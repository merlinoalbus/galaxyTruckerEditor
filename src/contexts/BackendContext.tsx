import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { scriptLoaderService } from '@/services/CampaignEditor/CampaignScriptParserService/scriptLoaderService';

interface BackendConfig {
  name: string;
  url: string;
  port: number;
  isAvailable: boolean;
  gamePath?: string;
  mountPoint?: string;
}

interface BackendContextType {
  backends: BackendConfig[];
  activeBackend: BackendConfig;
  setActiveBackend: (backend: BackendConfig) => void;
  checkBackendHealth: (url: string) => Promise<boolean>;
  refreshBackends: () => Promise<void>;
}

const defaultBackends: BackendConfig[] = [
  {
    name: 'Backend Principale',
    url: 'http://localhost:3001',
    port: 3001,
    isAvailable: false,
    mountPoint: '/api'
  },
  {
    name: 'Backend Secondario',
    url: 'http://localhost:3002',
    port: 3002,
    isAvailable: false,
    mountPoint: '/api2'
  }
];

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within BackendProvider');
  }
  return context;
};

interface BackendProviderProps {
  children: ReactNode;
}

// Funzione helper per ottenere il backend iniziale dal localStorage
const getInitialBackend = (): BackendConfig => {
  console.log('🔧 getInitialBackend called');
  try {
    const savedBackendUrl = localStorage.getItem('preferredBackend');
    console.log('🔧 localStorage preferredBackend:', savedBackendUrl);
    if (savedBackendUrl) {
      const savedBackend = defaultBackends.find(b => b.url === savedBackendUrl);
      console.log('🔧 Found saved backend:', savedBackend?.name);
      if (savedBackend) {
        return savedBackend;
      }
    }
  } catch (error) {
    console.warn('Error loading initial backend from localStorage:', error);
  }
  console.log('🔧 Falling back to default backend');
  return defaultBackends[0];
};

export const BackendProvider: React.FC<BackendProviderProps> = ({ children }) => {
  const [backends, setBackends] = useState<BackendConfig[]>(defaultBackends);
  const [activeBackend, setActiveBackendState] = useState<BackendConfig>(getInitialBackend());

  const checkBackendHealth = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'OK';
      }
      return false;
    } catch (error) {
      console.log(`Backend ${url} not available:`, error);
      return false;
    }
  };

  const refreshBackends = async () => {
    const updatedBackends = await Promise.all(
      backends.map(async (backend) => {
        const isAvailable = await checkBackendHealth(backend.url);
        
        // Se disponibile, ottieni info aggiuntive
        if (isAvailable) {
          try {
            const infoResponse = await fetch(`${backend.url}/api/server-info`);
            if (infoResponse.ok) {
              const info = await infoResponse.json();
              return {
                ...backend,
                isAvailable: true,
                name: info.name || backend.name,
                gamePath: info.gamePath,
                mountPoint: info.mountPoint || backend.mountPoint
              };
            }
          } catch (error) {
            console.error(`Error fetching server info from ${backend.url}:`, error);
          }
        }
        
        return {
          ...backend,
          isAvailable
        };
      })
    );
    
    setBackends(updatedBackends);
    
    // Aggiorna solo lo stato di disponibilità, ma mantieni la scelta dell'utente
    const currentBackendUpdated = updatedBackends.find(b => b.url === activeBackend.url);
    if (currentBackendUpdated) {
      // Mantieni il backend scelto anche se non disponibile
      setActiveBackendState(currentBackendUpdated);
      
      // Log solo se lo stato di disponibilità è cambiato
      if (currentBackendUpdated.isAvailable !== activeBackend.isAvailable) {
        if (currentBackendUpdated.isAvailable) {
          console.log(`✅ Backend '${currentBackendUpdated.name}' is now available`);
        } else {
          console.warn(`⚠️ Backend '${currentBackendUpdated.name}' is no longer available`);
        }
      }
    }
  };

  const setActiveBackend = (backend: BackendConfig) => {
    const previousBackend = activeBackend;
    
    setActiveBackendState(backend);
    // Salva la preferenza completa in localStorage
    localStorage.setItem('preferredBackend', backend.url);
    localStorage.setItem('preferredBackendConfig', JSON.stringify({
      url: backend.url,
      mountPoint: backend.mountPoint || '/api'
    }));
    
    // Se il backend è effettivamente cambiato, pulisci le cache e aggiorna i dati
    if (previousBackend.url !== backend.url) {
      console.log(`🔄 Backend switched: ${previousBackend.name} → ${backend.name}`);
      
      // Pulisci le cache dei servizi
      scriptLoaderService.clearCache();
      
      // Trigger refresh dell'app (tramite evento personalizzato)
      window.dispatchEvent(new CustomEvent('backendChanged', { 
        detail: { 
          from: previousBackend, 
          to: backend 
        } 
      }));
      
      console.log(`✅ Cache cleared and refresh triggered for: ${backend.name} (${backend.url})`);
    }
  };

  // Check backend health all'avvio
  useEffect(() => {
    const initBackends = async () => {
      // Prima verifica la disponibilità di tutti i backend
      const updatedBackends = await Promise.all(
        defaultBackends.map(async (backend) => {
          const isAvailable = await checkBackendHealth(backend.url);
          
          // Se disponibile, ottieni info aggiuntive
          if (isAvailable) {
            try {
              const infoResponse = await fetch(`${backend.url}/api/server-info`);
              if (infoResponse.ok) {
                const info = await infoResponse.json();
                return {
                  ...backend,
                  isAvailable: true,
                  name: info.name || backend.name,
                  gamePath: info.gamePath,
                  mountPoint: info.mountPoint || backend.mountPoint
                };
              }
            } catch (error) {
              console.error(`Error fetching server info from ${backend.url}:`, error);
            }
          }
          
          return {
            ...backend,
            isAvailable
          };
        })
      );
      
      setBackends(updatedBackends);
      
      // Recupera la preferenza salvata
      const savedBackendUrl = localStorage.getItem('preferredBackend');
      let selectedBackend: BackendConfig | null = null;
      
      if (savedBackendUrl) {
        // Prima prova a trovare il backend salvato (preferibile se disponibile)
        selectedBackend = updatedBackends.find(b => b.url === savedBackendUrl && b.isAvailable) || null;
        
        // Se il backend salvato non è disponibile ma esiste, usalo comunque per mostrare lo stato
        if (!selectedBackend) {
          selectedBackend = updatedBackends.find(b => b.url === savedBackendUrl) || null;
          if (selectedBackend) {
            console.warn(`⚠️ Backend preferito '${selectedBackend.name}' non è disponibile ma viene mantenuto come selezione`);
          }
        }
      }
      
      // Solo se non c'è nessuna preferenza, usa il primo disponibile
      if (!selectedBackend) {
        selectedBackend = updatedBackends.find(b => b.isAvailable) || null;
      }
      
      // Se nessun backend è disponibile, usa comunque il primo (per mostrare l'UI)
      if (!selectedBackend) {
        selectedBackend = updatedBackends[0];
        console.warn('⚠️ Nessun backend disponibile! Il frontend potrebbe non funzionare correttamente.');
      } else {
        console.log(`✅ Backend attivo: ${selectedBackend.name} (${selectedBackend.url})`);
      }
      
      // Usa il selectedBackend o fallback al primo disponibile/primo della lista
      const finalBackend = selectedBackend || updatedBackends.find(b => b.isAvailable) || updatedBackends[0];
      
      // Aggiorna lo stato 
      setActiveBackendState(finalBackend);
      
      // Se il backend inizializzato è diverso dal default, trigga gli eventi
      if (finalBackend.url !== defaultBackends[0].url) {
        console.log(`🔄 Backend initialization: Using saved ${finalBackend.name} instead of default`);
        
        // Salva la configurazione completa 
        localStorage.setItem('preferredBackendConfig', JSON.stringify({
          url: finalBackend.url,
          mountPoint: finalBackend.mountPoint || '/api'
        }));
        
        // Trigga refresh degli altri componenti
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('backendChanged', { 
            detail: { 
              from: defaultBackends[0], 
              to: finalBackend 
            } 
          }));
        }, 100);
      }
    };
    
    initBackends();
    
    // Refresh ogni 30 secondi
    const interval = setInterval(refreshBackends, 30000);
    
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BackendContext.Provider 
      value={{
        backends,
        activeBackend,
        setActiveBackend,
        checkBackendHealth,
        refreshBackends
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export default BackendContext;