import { useBackend } from '../contexts/BackendContext';

export const useApiUrl = () => {
  const { activeBackend } = useBackend();
  
  return {
    API_BASE_URL: `${activeBackend.url}${activeBackend.mountPoint || '/api'}`,
    ASSETS_BASE_URL: `${activeBackend.url}/static`,
    BE_BASE_URL: activeBackend.url,
    BACKEND_NAME: activeBackend.name,
    BACKEND_PORT: activeBackend.port,
    MOUNT_POINT: activeBackend.mountPoint || '/api'
  };
};

// Funzione helper per componenti che non possono usare hooks
export const getApiUrl = () => {
  // Recupera configurazione completa dal localStorage
  try {
    const savedBackendConfig = localStorage.getItem('preferredBackendConfig');
    if (savedBackendConfig) {
      const config = JSON.parse(savedBackendConfig);
      return {
        API_BASE_URL: `${config.url}${config.mountPoint}`,
        ASSETS_BASE_URL: `${config.url}/static`,
        BE_BASE_URL: config.url,
        MOUNT_POINT: config.mountPoint
      };
    }
  } catch (error) {
    console.warn('Error parsing backend config from localStorage:', error);
  }
  
  // Fallback al default
  const savedBackendUrl = localStorage.getItem('preferredBackend') || 'http://localhost:3001';
  
  return {
    API_BASE_URL: `${savedBackendUrl}/api`,
    ASSETS_BASE_URL: `${savedBackendUrl}/static`,
    BE_BASE_URL: savedBackendUrl,
    MOUNT_POINT: '/api'
  };
};