import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FullscreenContextType {
  isMapFullscreen: boolean;
  isFlowFullscreen: boolean;
  toggleMapFullscreen: () => void;
  toggleFlowFullscreen: () => void;
  exitAllFullscreen: () => void;
}

const FullscreenContext = createContext<FullscreenContextType | undefined>(undefined);

interface FullscreenProviderProps {
  children: ReactNode;
}

export const FullscreenProvider: React.FC<FullscreenProviderProps> = ({ children }) => {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isFlowFullscreen, setIsFlowFullscreen] = useState(false);

  const toggleMapFullscreen = () => {
    setIsMapFullscreen(!isMapFullscreen);
    // Exit flow fullscreen if active
    if (isFlowFullscreen) {
      setIsFlowFullscreen(false);
    }
  };

  const toggleFlowFullscreen = () => {
    setIsFlowFullscreen(!isFlowFullscreen);
    // Exit map fullscreen if active
    if (isMapFullscreen) {
      setIsMapFullscreen(false);
    }
  };

  const exitAllFullscreen = () => {
    setIsMapFullscreen(false);
    setIsFlowFullscreen(false);
  };

  const value: FullscreenContextType = {
    isMapFullscreen,
    isFlowFullscreen,
    toggleMapFullscreen,
    toggleFlowFullscreen,
    exitAllFullscreen
  };

  return (
    <FullscreenContext.Provider value={value}>
      {children}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = (): FullscreenContextType => {
  const context = useContext(FullscreenContext);
  if (context === undefined) {
    throw new Error('useFullscreen must be used within a FullscreenProvider');
  }
  return context;
};