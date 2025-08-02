import React from 'react';
import { CampaignAnalysis } from '../../types/CampaignEditor';

interface OverviewProps {
  analysis?: CampaignAnalysis | null;
}

export const Overview: React.FC<OverviewProps> = ({ analysis }) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-bold text-white mb-4">Campaign Overview</h3>
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Overview component da implementare</p>
        <p className="text-sm text-gray-500 mt-2">
          Recuperare da old/CampaignEditor.tsx sezione overview
        </p>
      </div>
    </div>
  );
};