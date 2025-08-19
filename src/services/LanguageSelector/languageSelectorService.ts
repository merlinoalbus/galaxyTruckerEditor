import { logger } from '@/utils/logger';
import { SupportedLanguage } from '@/contexts/LanguageContext';

class LanguageSelectorService {
  private readonly LANGUAGE_KEY = 'app_language';

  saveLanguagePreference(language: SupportedLanguage): void {
    try {
      localStorage.setItem(this.LANGUAGE_KEY, language);
    } catch (error) {
  logger.error('Error saving language preference:', error);
    }
  }

  getLanguagePreference(): SupportedLanguage | null {
    try {
      const saved = localStorage.getItem(this.LANGUAGE_KEY);
      return saved as SupportedLanguage | null;
    } catch (error) {
  logger.error('Error getting language preference:', error);
      return null;
    }
  }

  clearLanguagePreference(): void {
    try {
      localStorage.removeItem(this.LANGUAGE_KEY);
    } catch (error) {
  logger.error('Error clearing language preference:', error);
    }
  }
}

export const languageSelectorService = new LanguageSelectorService();