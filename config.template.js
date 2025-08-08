// Configuration template - copy to config.js and add your API keys
// This file is safe to commit to version control

const CONFIG = {
  // Get your Google Maps API key from: https://console.cloud.google.com/google/maps-apis/
  // Make sure to enable these APIs:
  // - Maps JavaScript API
  // - Places API
  // - Directions API
  GOOGLE_MAPS_API_KEY: 'AIzaSyDR51CGOXEyVz8Dy-6hU7kdaqbq8-CTkBs',
  
  // Set to false when you have a valid API key
  DEMO_MODE: false,
  
  // Default map center (USA center)
  DEFAULT_MAP_CENTER: {
    lat: 39.8283,
    lng: -98.5795
  },
  
  // Map configuration
  DEFAULT_ZOOM: 4,
  
  // Enable console logging for debugging
  DEBUG: true
};

// Make config globally available
window.CONFIG = CONFIG;
