import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
// @ts-ignore - leaflet-control-geocoder doesn't have perfect TypeScript support
import Geocoder from 'leaflet-control-geocoder';

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

interface LocationMapProps {
  latitude: string;
  longitude: string;
  address?: string;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  height?: string;
}

export function LocationMap({
  latitude,
  longitude,
  address,
  onLocationSelect,
  height = '400px',
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geocoderRef = useRef<any>(null);
  const userInteractingRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map with default center (Berlin) or provided coordinates
    const defaultLat = latitude ? parseFloat(latitude) : 52.52;
    const defaultLng = longitude ? parseFloat(longitude) : 13.405;
    const center: [number, number] = [defaultLat, defaultLng];

    const map = L.map(mapRef.current, {
      center,
      zoom: latitude && longitude ? 15 : 6,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add geocoder control
    const geocoder = new (Geocoder as any)({
      defaultMarkGeocode: false,
      placeholder: 'Search for a location...',
      errorMessage: 'Nothing found.',
    });

    geocoder.on('markgeocode', (e: any) => {
      const { center, name } = e.geocode;
      const lat = center.lat;
      const lng = center.lng;

      // Mark that user is interacting to prevent feedback loop
      userInteractingRef.current = true;

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;
      marker.bindPopup(name || 'Selected location').openPopup();

      // Pan to location
      map.setView([lat, lng], 15);

      // Update form fields
      onLocationSelect(lat, lng, name);

      // Reset interaction flag after a short delay
      setTimeout(() => {
        userInteractingRef.current = false;
      }, 500);
    });

    geocoder.addTo(map);
    geocoderRef.current = geocoder;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      // Remove existing marker
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }

      // Add new marker
      const marker = L.marker([lat, lng]).addTo(map);
      markerRef.current = marker;
      marker.bindPopup(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`).openPopup();

      // Mark that user is interacting to prevent feedback loop
      userInteractingRef.current = true;

      // Immediately update form fields with coordinates
      onLocationSelect(lat, lng);

      // Reverse geocode to get address (async, updates address after)
      // Use Nominatim directly for reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'RootsOfImpact/1.0'
        }
      })
        .then((response) => response.json())
        .then((data) => {
          if (data && data.display_name) {
            const address = data.display_name;
            marker.setPopupContent(`<strong>${address}</strong><br/>Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`).openPopup();
            // Update address in form (userInteractingRef is already set to true)
            onLocationSelect(lat, lng, address);
          }
          // Reset interaction flag after update
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 500);
        })
        .catch((error) => {
          console.error('Reverse geocoding error:', error);
          // Reset interaction flag on error
          setTimeout(() => {
            userInteractingRef.current = false;
          }, 500);
        });
    });

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Cleanup
    return () => {
      // Remove event listeners
      map.off('click');
      geocoder.off('markgeocode');
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      if (markerRef.current) {
        markerRef.current = null;
      }
      
      if (geocoderRef.current) {
        geocoderRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map when latitude/longitude changes from outside (manual input)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;
    
    // Skip if the change came from map interaction
    if (userInteractingRef.current) {
      userInteractingRef.current = false;
      return;
    }

    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;

    if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
      // Check if marker already exists at this location (within 0.0001 degree tolerance)
      const currentMarkerPos = markerRef.current?.getLatLng();
      if (currentMarkerPos) {
        const latDiff = Math.abs(currentMarkerPos.lat - lat);
        const lngDiff = Math.abs(currentMarkerPos.lng - lng);
        if (latDiff < 0.0001 && lngDiff < 0.0001) {
          // Marker already at this location, just update popup
          markerRef.current?.setPopupContent(address || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
          return;
        }
      }

      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker
      const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      markerRef.current = marker;
      marker.bindPopup(address || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`).openPopup();

      // Pan to location if it's significantly different
      const currentCenter = mapInstanceRef.current.getCenter();
      const distance = currentCenter.distanceTo([lat, lng]);
      if (distance > 1000) {
        // Only pan if more than 1km away
        mapInstanceRef.current.setView([lat, lng], 15);
      }
    }
  }, [latitude, longitude, address, isMapReady]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--color-border)',
        zIndex: 1,
      }}
      className="location-map-container"
    />
  );
}

