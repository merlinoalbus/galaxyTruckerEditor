import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as any);
  };

  return (
    <select
      value={currentLanguage}
      onChange={handleChange}
      className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 hover:border-gray-500 focus:outline-none focus:border-gt-accent"
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};