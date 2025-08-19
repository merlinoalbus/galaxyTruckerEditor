import React, { createContext, useContext, ReactNode } from 'react';

interface ScriptMetadata {
  isCustom?: boolean;
  availableLanguages?: string[];
}

const ScriptMetadataContext = createContext<ScriptMetadata>({});

export const useScriptMetadata = () => {
  return useContext(ScriptMetadataContext);
};

interface ScriptMetadataProviderProps {
  children: ReactNode;
  isCustom?: boolean;
  availableLanguages?: string[];
}

export const ScriptMetadataProvider: React.FC<ScriptMetadataProviderProps> = ({
  children,
  isCustom,
  availableLanguages
}) => {
  return (
    <ScriptMetadataContext.Provider value={{ isCustom, availableLanguages }}>
      {children}
    </ScriptMetadataContext.Provider>
  );
};