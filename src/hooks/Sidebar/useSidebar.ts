import { useState } from 'react';

export const useSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
  };

  return {
    isCollapsed,
    activeSection,
    toggleCollapse,
    expandSidebar,
    collapseSidebar,
    setActiveSection
  };
};