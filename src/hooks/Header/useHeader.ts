import { useState } from 'react';

export const useHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return {
    isMenuOpen,
    toggleMenu,
    closeMenu
  };
};