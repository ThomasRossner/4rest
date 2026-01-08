import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { useToastStore } from '../../stores/toastStore';
import { TREES_PER_TASK } from '../../constants/toast';
import './TaskComponents.css';

// Fix for default marker icons in Leaflet
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

// Custom icon for target location (red) - using a different color
const TargetIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [35, 51],
  iconAnchor: [17, 51],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface VisitLocationTaskProps {
  taskId: string;
  onComplete?: () => void;
}

// Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Proximity threshold in meters (50 meters)
const PROXIMITY_THRESHOLD = 50;

export function VisitLocationTask({ taskId, onComplete }: VisitLocationTaskProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const { t } = useTranslation();
  const showToast = useToastStore((s) => s.showToast);

  const { data: task, isLoading } = useQuery(
    ['task', taskId],
    () => api.getTask(taskId),
    { enabled: !!taskId }
  );

  const completeMutation = useMutation(
    () => api.completeTask(taskId, {}),
    {
      onSuccess: async () => {
        // Invalidate task and progress queries
        queryClient.invalidateQueries(['tasks']);
        queryClient.invalidateQueries(['userProgress']);
        
        // Invalidate team-related queries to update team points and forest
        if (userId) {
          await Promise.all([
            queryClient.invalidateQueries(['userActiveTeam', userId]),
            queryClient.invalidateQueries(['userTeams', userId]),
          ]);
        }
        queryClient.invalidateQueries(['userActiveTeam']);
        queryClient.invalidateQueries(['userTeams']);
        
        // Refresh user data to update points
        try {
          await api.refreshMe();
        } catch (userError) {
          console.debug('Failed to refresh user data:', userError);
        }
        
        showToast({
          type: 'success',
          title: t('tasks.toast.completedTitle'),
          message: t('tasks.toast.completedMessage', { points: task?.points ?? 0, trees: TREES_PER_TASK }),
        });
        onComplete?.();
      },
    }
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !task || mapInstanceRef.current) return;

    const targetLat = task.target_latitude;
    const targetLng = task.target_longitude;

    if (!targetLat || !targetLng) {
      setLocationError(t('tasksComponents.visit_location.targetLocationNotSet'));
      return;
    }

    // Initialize map centered on target location
    const map = L.map(mapRef.current, {
      center: [targetLat, targetLng],
      zoom: 15,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add target marker (red)
    const targetMarker = L.marker([targetLat, targetLng], { icon: TargetIcon })
      .addTo(map)
      .bindPopup(`<div style="color: #dc2626; font-weight: bold;">🎯 ${t('tasksComponents.visit_location.targetLocation')}</div>`)
      .openPopup();

    targetMarkerRef.current = targetMarker;

    // Add circle to show proximity area
    const proximityCircle = L.circle([targetLat, targetLng], {
      radius: PROXIMITY_THRESHOLD,
      color: '#ff0000',
      fillColor: '#ff0000',
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      targetMarkerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [task, t]);

  // Request location permission and start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError(t('tasksComponents.visit_location.geolocationNotSupported'));
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        updateUserMarker(latitude, longitude);
        checkProximity(latitude, longitude);
      },
      (error) => {
        setLocationError(t('tasksComponents.visit_location.locationError', { message: error.message }));
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Watch position updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        updateUserMarker(latitude, longitude);
        checkProximity(latitude, longitude);
      },
      (error) => {
        setLocationError(t('tasksComponents.visit_location.locationTrackingError', { message: error.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const updateUserMarker = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const userMarker = L.marker([lat, lng])
        .addTo(mapInstanceRef.current)
        .bindPopup(t('tasksComponents.visit_location.yourLocation'));
      userMarkerRef.current = userMarker;
    }

    // Center map on user location if they're far from target
    const targetLat = task?.target_latitude;
    const targetLng = task?.target_longitude;
    if (targetLat && targetLng) {
      const dist = calculateDistance(lat, lng, targetLat, targetLng);
      if (dist > 500) {
        // If more than 500m away, center on midpoint
        const centerLat = (lat + targetLat) / 2;
        const centerLng = (lng + targetLng) / 2;
        mapInstanceRef.current.setView([centerLat, centerLng], 14);
      } else {
        // If close, center on user
        mapInstanceRef.current.setView([lat, lng], 16);
      }
    }
  };

  const checkProximity = (userLat: number, userLng: number) => {
    if (!task?.target_latitude || !task?.target_longitude) return;

    const dist = calculateDistance(
      userLat,
      userLng,
      task.target_latitude,
      task.target_longitude
    );

    setDistance(dist);

    // Auto-complete when within threshold
    if (dist <= PROXIMITY_THRESHOLD && !completeMutation.isLoading && !completeMutation.isSuccess) {
      completeMutation.mutate();
      stopTracking();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  if (isLoading) return <div>{t('tasksComponents.loading')}</div>;
  if (!task) return <div>{t('tasksComponents.notFound')}</div>;

  if (!task.target_latitude || !task.target_longitude) {
    return (
      <div className="task-container">
        <div className="task-header">
          <h2>{task.title}</h2>
          <span className="task-points">
            {t('tasksComponents.points', { points: task.points })}
          </span>
        </div>
        <div className="task-error">
          <p>{t('tasksComponents.visit_location.noTargetLocation')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-container">
      <div className="task-header">
        <h2>{task.title}</h2>
        <span className="task-points">
          {t('tasksComponents.points', { points: task.points })}
        </span>
      </div>
      {task.description && (
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-light)' }}>
          {task.description}
        </p>
      )}

      <div className="visit-location-container">
        <div className="map-container" style={{ position: 'relative', marginBottom: '16px' }}>
          <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '8px' }} />
          
          {distance !== null && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: distance <= PROXIMITY_THRESHOLD ? 'rgba(0, 255, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                zIndex: 1000,
              }}
            >
              {distance <= PROXIMITY_THRESHOLD
                ? t('tasksComponents.visit_location.atLocation')
                : t('tasksComponents.visit_location.distance', { distance: Math.round(distance) })}
            </div>
          )}

          {locationError && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(255, 0, 0, 0.9)',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '8px',
                fontSize: '14px',
                zIndex: 1000,
              }}
            >
              {locationError}
            </div>
          )}
        </div>

        <div className="location-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="verify-button"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {t('tasksComponents.visit_location.startTracking')}
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="verify-button"
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                background: '#dc2626',
              }}
            >
              {t('tasksComponents.visit_location.stopTracking')}
            </button>
          )}

          {userLocation && (
            <div style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
              {t('tasksComponents.visit_location.yourLocationLabel', {
                lat: userLocation.lat.toFixed(6),
                lng: userLocation.lng.toFixed(6),
              })}
            </div>
          )}

          {completeMutation.isSuccess && (
            <div className="task-success">
              <span className="success-icon">✅</span>
              <p>{t('tasksComponents.visit_location.locationReached')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

