import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './UserLocationMap.css';

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fix for default marker icons in Leaflet with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Task marker icon (different color - blue)
const TaskIcon = L.divIcon({
  className: 'task-marker-icon',
  html: `<div style="
    width: 30px;
    height: 30px;
    background: var(--color-primary);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
  ">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

// Reward marker icon (different color - green/gold)
const RewardIcon = L.divIcon({
  className: 'reward-marker-icon',
  html: `<div style="
    width: 30px;
    height: 30px;
    background: #10b981;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
  ">🎁</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

interface Task {
  id: string;
  title: string;
  description?: string;
  points: number;
  completed?: boolean;
  location?: {
    id: string;
    name: string;
    is_online: boolean;
    latitude: number | null;
    longitude: number | null;
    address?: string | null;
  };
}

interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  rewardType?: string;
  location?: {
    id: string;
    name: string;
    is_online: boolean;
    latitude: number | null;
    longitude: number | null;
    address?: string | null;
    category?: string | null;
    category_description?: string | null;
  };
}

interface UserLocationMapProps {
  height?: string;
  /** Aufgaben-Karte vs. Belohnungsmarkt – steuert i18n-Keys (tasks.visit_location vs. rewards.map). */
  variant?: 'tasks' | 'rewards';
  tasks?: Task[];
  rewards?: Reward[];
  onTaskClick?: (taskId: string) => void;
  onRewardClick?: (rewardId: string) => void;
}

export function UserLocationMap({
  height = '500px',
  variant = 'tasks',
  tasks = [],
  rewards = [],
  onTaskClick,
  onRewardClick,
}: UserLocationMapProps) {
  const { t, i18n } = useTranslation();

  const mapText = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      variant === 'rewards' ? t(`rewards.map.${key}`, options) : t(`tasks.visit_location.${key}`, options),
    [t, variant]
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const taskMarkersRef = useRef<L.Marker[]>([]);
  const rewardMarkersRef = useRef<L.Marker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(mapText('geolocationNotSupported'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        setIsLoading(false);
      },
      (error) => {
        setLocationError(mapText('positionError', { message: error.message }));
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [mapText]);

  // Initialize map - don't wait for user location
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    // Use requestAnimationFrame to ensure DOM is ready, but don't wait unnecessarily
    const initFrame = requestAnimationFrame(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Use user location if available, otherwise default to Berlin
        const defaultLat = userLocation?.lat ?? 52.52;
        const defaultLng = userLocation?.lng ?? 13.405;
        const center: [number, number] = [defaultLat, defaultLng];

        const map = L.map(mapRef.current!, {
          center,
          zoom: userLocation ? 15 : 6,
        });

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapReady(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setLocationError(
          mapText('mapInitError', {
            message: error instanceof Error ? error.message : mapText('mapUnknownError'),
          })
        );
        setIsLoading(false);
      }
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(initFrame);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, [mapText]);

  // Update map center when user location becomes available (but don't wait for it)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || !userLocation) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Add marker for user location
    const marker = L.marker([userLocation.lat, userLocation.lng]).addTo(mapInstanceRef.current);
    markerRef.current = marker;
    marker.bindPopup(mapText('yourCurrentPosition'));

    // If there are task or reward markers, fit bounds to include user location
    // Otherwise, center on user location
    if (taskMarkersRef.current.length > 0 || rewardMarkersRef.current.length > 0) {
      // Create bounds from all markers and user location
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        ...taskMarkersRef.current.map(m => m.getLatLng()),
        ...rewardMarkersRef.current.map(m => m.getLatLng())
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // No tasks or rewards yet, center on user location
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
      marker.openPopup(); // Open popup when centering on user location
    }
  }, [userLocation, isMapReady, mapText]);


  // Add task and reward markers to map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) {
      return;
    }

    // Remove existing task markers
    taskMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    taskMarkersRef.current = [];

    // Remove existing reward markers
    rewardMarkersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    rewardMarkersRef.current = [];

    // Process tasks if provided
    if (tasks && tasks.length > 0) {
      console.log('Tasks received:', tasks.length, tasks.map(t => ({ id: t.id, title: t.title, hasLocation: !!t.location, locationType: typeof t.location })));

    // Filter tasks: only available, non-completed tasks with physical locations
    const physicalTasks = tasks.filter((task) => {
      // Skip completed tasks
      if (task.completed) {
        console.debug('Task completed:', task.id, task.title);
        return false;
      }
      
      // Skip locked/unavailable tasks
      if ((task as any).is_available === false) {
        console.debug('Task not available:', task.id, task.title);
        return false;
      }
      
      // Check if location exists
      if (!task.location) {
        console.debug('Task has no location:', task.id, task.title);
        return false;
      }
      
      // Location might be a string (JSON) or an object
      let location = task.location;
      if (typeof location === 'string') {
        try {
          location = JSON.parse(location);
        } catch (e) {
          console.debug('Failed to parse location JSON:', task.id, e);
          return false;
        }
      }
      
      console.debug('Task location data:', task.id, task.title, { 
        is_online: location.is_online, 
        latitude: location.latitude, 
        longitude: location.longitude,
        locationType: typeof location.is_online
      });
      
      // Check if location is online
      // Handle both boolean and string values
      const isOnline = location.is_online === true || location.is_online === 'true' || String(location.is_online).toLowerCase() === 'true';
      if (isOnline) {
        console.debug('Task location is online:', task.id, task.title, { is_online: location.is_online });
        return false;
      }
      
      // Check if coordinates exist
      const lat = location.latitude;
      const lng = location.longitude;
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        console.debug('Task location has no coordinates:', task.id, task.title, { lat, lng });
        return false;
      }
      
      // Convert to numbers if they're strings
      const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
      const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.debug('Task location has invalid coordinates:', task.id, task.title, { latitude, longitude });
        return false;
      }
      
      // Store parsed coordinates back in task for use below
      task.location = { ...location, latitude, longitude };
      
      return true;
    });
    
    console.log(`Found ${physicalTasks.length} physical tasks out of ${tasks.length} total tasks`, physicalTasks.map(t => ({ id: t.id, title: t.title })));

    // Group tasks by location to handle overlapping markers
    const locationGroups = new Map<string, typeof physicalTasks>();
    physicalTasks.forEach((task) => {
      // Location is already parsed in the filter step above
      const location = task.location;
      if (!location || typeof location !== 'object') return;
      
      const latitude = location.latitude;
      const longitude = location.longitude;
      
      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined || isNaN(latitude) || isNaN(longitude)) return;
      
      // Create a key for this location (rounded to 6 decimal places to group nearby markers)
      const locationKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(task);
    });

    // Add one marker per location group (at exact coordinates, no offset)
    locationGroups.forEach((tasksAtLocation, locationKey) => {
      const [latitude, longitude] = locationKey.split(',').map(Number);
      
      console.debug(`Adding marker for ${tasksAtLocation.length} task(s) at (${latitude}, ${longitude})`, {
        tasks: tasksAtLocation.map(t => ({ id: t.id, title: t.title }))
      });

      // Create one marker at the exact location
      const taskMarker = L.marker(
        [latitude, longitude],
        { icon: TaskIcon }
      ).addTo(mapInstanceRef.current!);

      // Create popup content element showing all tasks at this location
      const popupDiv = document.createElement('div');
      popupDiv.style.minWidth = '250px';
      popupDiv.style.maxWidth = '400px';
      
      // If multiple tasks, show count in header
      const headerText = tasksAtLocation.length > 1 
        ? t('tasks.visit_location.multipleAtLocation', { count: tasksAtLocation.length })
        : escapeHtml(tasksAtLocation[0].title);
      
      let popupHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
          <h3 style="margin: 0 0 12px 0; font-size: 1.1rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${headerText}</h3>
      `;
      
      // Add each task to the popup
      tasksAtLocation.forEach((task, index) => {
        const thumbnailUrl = (task as any).thumbnail_url;
        popupHTML += `
          <div style="margin-bottom: ${index < tasksAtLocation.length - 1 ? '16px' : '0'}; padding-bottom: ${index < tasksAtLocation.length - 1 ? '16px' : '0'}; border-bottom: ${index < tasksAtLocation.length - 1 ? '1px solid #e5e7eb' : 'none'};">
            ${tasksAtLocation.length > 1 ? `
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                ${thumbnailUrl ? `<img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(task.title)}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />` : ''}
                <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937;">${escapeHtml(task.title)}</h4>
              </div>
            ` : ''}
            ${task.description ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">${escapeHtml(task.description)}</p>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
              <span style="font-weight: 600; color: #f59e0b;">⭐ ${t('common.points', { count: task.points })}</span>
              ${onTaskClick ? `<button class="task-popup-button" data-task-id="${task.id}" style="padding: 6px 12px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s;">${escapeHtml(t('tasks.visit_location.startTask'))}</button>` : ''}
            </div>
          </div>
        `;
      });
      
      popupHTML += `</div>`;
      popupDiv.innerHTML = popupHTML;

      // Add click handlers to all buttons
      if (onTaskClick) {
        const buttons = popupDiv.querySelectorAll('.task-popup-button');
        buttons.forEach((button) => {
          button.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskId = (button as HTMLElement).getAttribute('data-task-id');
            if (taskId) {
              onTaskClick(taskId);
            }
          });
        });
      }

      taskMarker.bindPopup(popupDiv);
      taskMarkersRef.current.push(taskMarker);
    });
    } else {
      console.log('No tasks provided to UserLocationMap');
    }

    // Process rewards similar to tasks
    if (rewards && rewards.length > 0) {
      // Filter rewards: only rewards with physical locations
      const physicalRewards = rewards.filter((reward) => {
        // Check if location exists
        if (!reward.location) {
          return false;
        }
        
        // Location might be a string (JSON) or an object
        let location = reward.location;
        if (typeof location === 'string') {
          try {
            location = JSON.parse(location);
          } catch (e) {
            return false;
          }
        }
        
        // Check if location is online
        // Handle boolean false, string "false", and null/undefined
        const isOnline = location.is_online === true || location.is_online === 'true' || (typeof location.is_online === 'string' && location.is_online.toLowerCase() === 'true');
        if (isOnline) {
          return false;
        }
        
        // Check if coordinates exist
        const lat = location.latitude;
        const lng = location.longitude;
        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          return false;
        }
        
        // Convert to numbers if they're strings
        const latitude = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
        const longitude = typeof lng === 'string' ? parseFloat(lng) : Number(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
          return false;
        }
        
        // Store parsed coordinates back in reward for use below
        reward.location = { ...location, latitude, longitude };
        
        return true;
      });
      
      console.log(`Found ${physicalRewards.length} physical rewards out of ${rewards.length} total rewards`, physicalRewards.map(r => ({ id: r.id, title: r.title })));

      // Group rewards by location to handle overlapping markers
      const rewardLocationGroups = new Map<string, typeof physicalRewards>();
      physicalRewards.forEach((reward) => {
        const location = reward.location;
        if (!location || typeof location !== 'object') return;
        
        const latitude = location.latitude;
        const longitude = location.longitude;
        
        if (latitude === null || latitude === undefined || longitude === null || longitude === undefined || isNaN(latitude) || isNaN(longitude)) return;
        
        // Create a key for this location (rounded to 6 decimal places to group nearby markers)
        const locationKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        if (!rewardLocationGroups.has(locationKey)) {
          rewardLocationGroups.set(locationKey, []);
        }
        rewardLocationGroups.get(locationKey)!.push(reward);
      });

      // Add one marker per location group (at exact coordinates, no offset)
      rewardLocationGroups.forEach((rewardsAtLocation, locationKey) => {
        const [latitude, longitude] = locationKey.split(',').map(Number);
        
        console.debug(`Adding marker for ${rewardsAtLocation.length} reward(s) at (${latitude}, ${longitude})`, {
          rewards: rewardsAtLocation.map(r => ({ id: r.id, title: r.title }))
        });

        // Create one marker at the exact location
        const rewardMarker = L.marker(
          [latitude, longitude],
          { icon: RewardIcon }
        ).addTo(mapInstanceRef.current!);

        // Create popup content element showing all rewards at this location
        const popupDiv = document.createElement('div');
        popupDiv.style.minWidth = '250px';
        popupDiv.style.maxWidth = '400px';
        
        // If multiple rewards, show count in header
        const headerText = rewardsAtLocation.length > 1 
          ? t('rewards.map.multipleAtLocation', { count: rewardsAtLocation.length })
          : escapeHtml(rewardsAtLocation[0].title);
        
        let popupHTML = `
          <div style="max-height: 400px; overflow-y: auto;">
            <h3 style="margin: 0 0 12px 0; font-size: 1.1rem; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${headerText}</h3>
        `;
        
        // Add each reward to the popup
        rewardsAtLocation.forEach((reward, index) => {
          const thumbnailUrl = (reward as any).thumbnail_url;
          popupHTML += `
            <div style="margin-bottom: ${index < rewardsAtLocation.length - 1 ? '16px' : '0'}; padding-bottom: ${index < rewardsAtLocation.length - 1 ? '16px' : '0'}; border-bottom: ${index < rewardsAtLocation.length - 1 ? '1px solid #e5e7eb' : 'none'};">
              ${rewardsAtLocation.length > 1 ? `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  ${thumbnailUrl ? `<img src="${escapeHtml(thumbnailUrl)}" alt="${escapeHtml(reward.title)}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0;" />` : ''}
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 600; color: #1f2937;">${escapeHtml(reward.title)}</h4>
                </div>
              ` : ''}
              ${reward.description ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">${escapeHtml(reward.description)}</p>` : ''}
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="font-weight: 600; color: #f59e0b;">💰 ${t('common.points', { count: reward.pointsCost })}</span>
                ${onRewardClick ? `<button class="reward-popup-button" data-reward-id="${reward.id}" style="padding: 6px 12px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: background 0.2s;">${escapeHtml(mapText('details'))}</button>` : ''}
              </div>
            </div>
          `;
        });
        
        popupHTML += `</div>`;
        popupDiv.innerHTML = popupHTML;

        // Add click handlers to all buttons
        if (onRewardClick) {
          const buttons = popupDiv.querySelectorAll('.reward-popup-button');
          buttons.forEach((button) => {
            button.addEventListener('click', (e) => {
              e.stopPropagation();
              const rewardId = (button as HTMLElement).getAttribute('data-reward-id');
              if (rewardId) {
                onRewardClick(rewardId);
              }
            });
          });
        }

        rewardMarker.bindPopup(popupDiv);
        rewardMarkersRef.current.push(rewardMarker);
      });
    }

    // Fit map to show all markers if there are tasks or rewards
    if (taskMarkersRef.current.length > 0 || rewardMarkersRef.current.length > 0) {
      const bounds = L.latLngBounds(
        [...taskMarkersRef.current.map(marker => marker.getLatLng()),
         ...rewardMarkersRef.current.map(marker => marker.getLatLng())]
      );
      
      // Add user location to bounds if available
      if (userLocation) {
        bounds.extend([userLocation.lat, userLocation.lng]);
      }
      
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      // If no tasks/rewards but user location available, center on user
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else if (taskMarkersRef.current.length === 0 && rewardMarkersRef.current.length === 0 && !userLocation) {
      // If no tasks/rewards and no user location, keep default view (Berlin)
      // Map is already initialized with default center
    }
  }, [tasks, rewards, isMapReady, userLocation, onTaskClick, onRewardClick, i18n.language, t, mapText]);

  return (
    <div style={{ width: '100%', minHeight: height }}>
      {isLoading && !isMapReady && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          {mapText('locatingPosition')}
        </div>
      )}
      {locationError && (
        <div style={{ padding: '1rem', textAlign: 'center', color: 'red' }}>
          {locationError}
        </div>
      )}
      {!isMapReady && !isLoading && !locationError && (
        <div style={{ padding: '1rem', textAlign: 'center' }}>
          {mapText('loadingMap')}
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: height,
          borderRadius: 'var(--border-radius, 0.5rem)',
          border: '1px solid var(--color-border, #e5e7eb)',
          zIndex: 1,
          display: 'block',
          opacity: isMapReady ? 1 : 0.3,
          transition: 'opacity 0.2s ease-in-out',
        }}
        className="user-location-map-container"
      />
    </div>
  );
}
