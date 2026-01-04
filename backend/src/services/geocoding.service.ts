/**
 * Geocoding service for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim API (free, but has rate limits)
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

export interface GeocodingError {
  error: string;
  message: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'RootsOfImpact/1.0'; // Required by Nominatim ToS

/**
 * Geocode an address to get coordinates
 * @param address The address string to geocode
 * @returns Geocoding result with coordinates and formatted address
 * @throws Error if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Address is required for geocoding.');
  }

  const encodedAddress = encodeURIComponent(address.trim());
  const url = `${NOMINATIM_BASE_URL}?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No results found for this address.');
    }

    const result = data[0];
    const lat = Number.parseFloat(result.lat);
    const lon = Number.parseFloat(result.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error('Invalid coordinates returned from geocoding service.');
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Coordinates out of valid range.');
    }

    return {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      display_name: result.display_name || address,
      address: result.address || undefined,
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Geocoding failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Reverse geocode coordinates to get an address
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Geocoding result with address
 * @throws Error if reverse geocoding fails
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid latitude and longitude are required.');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordinates out of valid range.');
  }

  const url = `${NOMINATIM_BASE_URL.replace('/search', '/reverse')}?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding API returned status ${response.status}`);
    }

    const result = await response.json();

    if (!result || !result.lat || !result.lon) {
      throw new Error('No results found for these coordinates.');
    }

    return {
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      display_name: result.display_name || `${latitude}, ${longitude}`,
      address: result.address || undefined,
    };
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Reverse geocoding failed: ${error.message || 'Unknown error'}`);
  }
}
