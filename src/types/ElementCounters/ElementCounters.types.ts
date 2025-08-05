export interface ElementCountersProps {
  scripts: number;
  nodes: number;
  connections: number;
  missions: number;
  variables: number;
  className?: string;
}

export interface CounterItem {
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}