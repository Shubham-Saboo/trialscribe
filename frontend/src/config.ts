// API configuration
const getApiUrl = (): string => {
  // In production, use environment variable or default to relative path
  // React apps can use REACT_APP_ prefix for environment variables
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // In development, use proxy (configured in package.json)
  // In production, use relative path (same origin)
  return '';
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  EXTRACT_AND_MATCH: `${API_BASE_URL}/api/extract-and-match`,
  SEARCH_TRIALS: `${API_BASE_URL}/api/search-trials`,
  TRIAL_CHAT: `${API_BASE_URL}/api/trial-chat`,
};

