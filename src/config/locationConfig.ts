// Location services configuration

export const locationConfig = {
  // GeoNames API Configuration
  geoNames: {
    username: process.env.GEONAMES_USERNAME || 'demo',
    timeout: parseInt(process.env.GEONAMES_TIMEOUT || '8000'),
    baseUrl: 'http://api.geonames.org/searchJSON'
  },

  // Nominatim API Configuration
  nominatim: {
    timeout: parseInt(process.env.NOMINATIM_TIMEOUT || '10000'),
    baseUrl: 'https://nominatim.openstreetmap.org/search',
    userAgent: 'MKT-Turismo-Next/1.0'
  },

  // General settings
  settings: {
    disableExternalApis: process.env.DISABLE_EXTERNAL_APIS === 'true',
    skipExternalInDevelopment: process.env.NODE_ENV === 'development',
    defaultLimit: 100,
    maxLimit: 500
  }
};

// Helper function to check if external APIs should be used
export const shouldUseExternalApis = (): boolean => {
  return !locationConfig.settings.disableExternalApis && 
         !locationConfig.settings.skipExternalInDevelopment;
};
