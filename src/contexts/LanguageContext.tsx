import React, { createContext, useContext, useState, ReactNode } from 'react';

export type SupportedLanguage = 'EN' | 'CS' | 'DE' | 'ES' | 'FR' | 'IT' | 'PL' | 'RU';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  availableLanguages: { code: SupportedLanguage; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('EN');

  const availableLanguages = [
    { code: 'EN' as SupportedLanguage, name: 'English' },
    { code: 'CS' as SupportedLanguage, name: 'Čeština' },
    { code: 'DE' as SupportedLanguage, name: 'Deutsch' },
    { code: 'ES' as SupportedLanguage, name: 'Español' },
    { code: 'FR' as SupportedLanguage, name: 'Français' },
    { code: 'IT' as SupportedLanguage, name: 'Italiano' },
    { code: 'PL' as SupportedLanguage, name: 'Polski' },
    { code: 'RU' as SupportedLanguage, name: 'Русский' }
  ];

  const setLanguage = (language: SupportedLanguage) => {
    setCurrentLanguage(language);
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, availableLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
};