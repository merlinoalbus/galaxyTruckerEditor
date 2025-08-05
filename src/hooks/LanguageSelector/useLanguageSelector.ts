import { useState, useEffect } from 'react';
import { useLanguage, SupportedLanguage } from '@/contexts/LanguageContext';

export const useLanguageSelector = () => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const selectLanguage = (language: SupportedLanguage) => {
    setLanguage(language);
    closeDropdown();
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        closeDropdown();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isDropdownOpen]);

  return {
    currentLanguage,
    availableLanguages,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
    selectLanguage
  };
};