import React from 'react';
import { LucideIcon } from 'lucide-react';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';

interface MetricCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, value, label }) => {
  return (
    <div className={overviewStyles.metricCard.container}>
      <div className={overviewStyles.metricCard.accent}></div>
      <div className={overviewStyles.metricCard.iconContainer}>
        <Icon className={overviewStyles.metricCard.icon} />
      </div>
      <div className={overviewStyles.metricCard.value}>
        {value}
      </div>
      <div className={overviewStyles.metricCard.label}>
        {label}
      </div>
    </div>
  );
};