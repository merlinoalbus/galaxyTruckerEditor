import { SupportedLanguage } from '@/contexts/LanguageContext';

export interface LanguageSelectorProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  flag?: string;
}