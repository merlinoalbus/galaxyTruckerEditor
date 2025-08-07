import { SupportedLanguage } from '@/contexts/LanguageContext';

export const getLocalizedString = (
  localizedStrings: { [key: string]: string } | undefined,
  currentLanguage: SupportedLanguage,
  defaultValue: string = ''
): string => {
  if (!localizedStrings) return defaultValue;
  
  // Try current language
  if (localizedStrings[currentLanguage]) {
    return localizedStrings[currentLanguage];
  }
  
  // Fallback to English
  if (localizedStrings['EN']) {
    return localizedStrings['EN'];
  }
  
  // Return first available language
  const firstKey = Object.keys(localizedStrings)[0];
  if (firstKey) {
    return localizedStrings[firstKey];
  }
  
  return defaultValue;
};