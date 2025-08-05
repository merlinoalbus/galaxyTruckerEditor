export interface SidebarProps {
  className?: string;
  defaultCollapsed?: boolean;
}

export interface SidebarSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items?: SidebarItem[];
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}