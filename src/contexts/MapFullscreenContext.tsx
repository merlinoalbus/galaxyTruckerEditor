import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapFullscreenContextType {
  isMapFullscreen: boolean;
  toggleMapFullscreen: () => void;
  exitMapFullscreen: () => void;
}

const MapFullscreenContext = createContext<MapFullscreenContextType | undefined>(undefined);

interface MapFullscreenProviderProps {
  children: ReactNode;
}

export const MapFullscreenProvider: React.FC<MapFullscreenProviderProps> = ({ children }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
  };

  const exitMapFullscreen = () => {
    setIsMapFullscreen(false);
  };

  const value: MapFullscreenContextType = {
    isMapFullscreen,
    toggleMapFullscreen,
    exitMapFullscreen
  };

  return (
    <MapFullscreenContext.Provider value={value}>
      {children}
    </MapFullscreenContext.Provider>
  );
};

export const useMapFullscreen = (): MapFullscreenContextType => {
  const context = useContext(MapFullscreenContext);
  if (context === undefined) {
    throw new Error('useMapFullscreen must be used within a MapFullscreenProvider');
  }
  return context;
};