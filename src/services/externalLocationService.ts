// External location services for fetching comprehensive city data
import { locationConfig, shouldUseExternalApis } from '@/config/locationConfig';

export interface ExternalCity {
  id: string;
  name: string;
  countryCode: string;
  stateCode: string;
  population?: number;
  latitude?: number;
  longitude?: number;
}

export interface GeoNamesResponse {
  geonames: Array<{
    geonameId: number;
    name: string;
    countryCode: string;
    adminCode1: string;
    population: number;
    lat: string;
    lng: string;
  }>;
}

class ExternalLocationService {
  constructor() {
    // Configuration is now handled by locationConfig
  }

  /**
   * Fetch cities from GeoNames API for a specific state/country
   * GeoNames provides comprehensive city data worldwide
   */
  async fetchCitiesFromGeoNames(
    countryCode: string = 'AR',
    stateCode?: string,
    maxRows: number = 1000
  ): Promise<ExternalCity[]> {
    try {
      const url = new URL(locationConfig.geoNames.baseUrl);
      url.searchParams.set('country', countryCode);
      url.searchParams.set('featureClass', 'P'); // Populated places
      url.searchParams.set('orderby', 'population');
      url.searchParams.set('maxRows', maxRows.toString());
      url.searchParams.set('username', locationConfig.geoNames.username);

      if (stateCode) {
        url.searchParams.set('adminCode1', stateCode);
      }

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), locationConfig.geoNames.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GeoNames API error: ${response.status}`);
      }

      const data: GeoNamesResponse = await response.json();
      
      return data.geonames.map(city => ({
        id: `geoname-${city.geonameId}`,
        name: city.name,
        countryCode: city.countryCode,
        stateCode: city.adminCode1,
        population: city.population,
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng)
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('GeoNames API timeout after 8 seconds');
        throw new Error('API request timed out');
      }
      console.error('Error fetching cities from GeoNames:', error);
      throw error;
    }
  }

  /**
   * Alternative: Use a free REST Countries API for basic city data
   * This is a fallback option if GeoNames is not available
   */
  async fetchCitiesFromRESTCountries(countryCode: string = 'AR'): Promise<ExternalCity[]> {
    try {
      // This is a simplified example - REST Countries doesn't provide city data
      // You might want to use other APIs like OpenStreetMap Nominatim
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
      
      if (!response.ok) {
        throw new Error(`REST Countries API error: ${response.status}`);
      }

      const data = await response.json();
      
      // This is just a placeholder - REST Countries doesn't have city data
      // You would need to implement a different service for actual city data
      return [];
    } catch (error) {
      console.error('Error fetching cities from REST Countries:', error);
      throw error;
    }
  }

  /**
   * Use OpenStreetMap Nominatim API for city data
   * This is a free alternative to GeoNames
   */
  async fetchCitiesFromNominatim(
    countryCode: string = 'AR',
    stateCode?: string,
    limit: number = 1000
  ): Promise<ExternalCity[]> {
    try {
      const query = stateCode 
        ? `${stateCode}, ${countryCode}`
        : countryCode;
      
      const url = new URL(locationConfig.nominatim.baseUrl);
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('addressdetails', '1');
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('featuretype', 'city,town,village');
      url.searchParams.set('countrycodes', countryCode.toLowerCase());

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), locationConfig.nominatim.timeout);

      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': locationConfig.nominatim.userAgent
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((place: any, index: number) => ({
        id: `nominatim-${place.place_id || index}`,
        name: place.display_name.split(',')[0], // Get the main city name
        countryCode: place.address?.country_code?.toUpperCase() || countryCode,
        stateCode: place.address?.state || stateCode || '',
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon)
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Nominatim API timeout after 10 seconds');
        throw new Error('API request timed out');
      }
      console.error('Error fetching cities from Nominatim:', error);
      throw error;
    }
  }

  /**
   * Get cities with fallback strategy
   * Try GeoNames first, then Nominatim, then local data
   */
  async getCitiesWithFallback(
    countryCode: string = 'AR',
    stateCode?: string
  ): Promise<ExternalCity[]> {
    // Skip external APIs if configured to do so
    if (!shouldUseExternalApis()) {
      console.log('Skipping external APIs, using local data');
      return this.getLocalCities(stateCode);
    }

    try {
      // Try GeoNames first (most comprehensive)
      console.log('Trying GeoNames API...');
      return await this.fetchCitiesFromGeoNames(countryCode, stateCode);
    } catch (geoNamesError) {
      console.warn('GeoNames failed, trying Nominatim:', geoNamesError.message);
      
      try {
        // Fallback to Nominatim
        console.log('Trying Nominatim API...');
        return await this.fetchCitiesFromNominatim(countryCode, stateCode);
      } catch (nominatimError) {
        console.warn('Nominatim failed, using local data:', nominatimError.message);
        
        // Final fallback to local data
        return this.getLocalCities(stateCode);
      }
    }
  }

  /**
   * Get local cities data as fallback
   */
  private async getLocalCities(stateCode?: string): Promise<ExternalCity[]> {
    try {
      const { argentinaCities } = await import('@/data/argentinaCities');
      const localCities = argentinaCities[stateCode || 'CABA'] || [];
      
      return localCities.map(city => ({
        id: city.id,
        name: city.name,
        countryCode: 'AR',
        stateCode: stateCode || 'CABA'
      }));
    } catch (error) {
      console.error('Error loading local cities data:', error);
      return [];
    }
  }
}

export const externalLocationService = new ExternalLocationService();
