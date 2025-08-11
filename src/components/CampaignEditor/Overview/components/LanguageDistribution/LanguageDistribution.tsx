import React from 'react';
import { Globe } from 'lucide-react';
import { overviewStyles } from '@/styles/CampaignEditor/Overview/Overview.styles';
import { useTranslation } from '@/locales';

interface LanguageDistributionProps {
  scriptsPerLanguage: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
}

export const LanguageDistribution: React.FC<LanguageDistributionProps> = ({ 
  scriptsPerLanguage 
}) => {
  const { t } = useTranslation();
  
  if (!scriptsPerLanguage || scriptsPerLanguage.length === 0) {
    return null;
  }

  return (
    <div className={overviewStyles.section.container}>
      <div className={overviewStyles.section.header}>
        <Globe className={overviewStyles.section.icon} />
        <h2 className={overviewStyles.section.title}>
          {t('overview.languageDistribution')}
        </h2>
      </div>
      <div className={overviewStyles.section.content}>
        <div className={overviewStyles.languageGrid}>
          {scriptsPerLanguage.slice(0, 6).map(({ language, count, percentage }) => (
            <div key={language} className={overviewStyles.languageItem.container}>
              <div className={overviewStyles.languageItem.left}>
                <div className={overviewStyles.languageItem.flag}>
                  {language.slice(0, 2).toUpperCase()}
                </div>
                <span className={overviewStyles.languageItem.language}>
                  {language}
                </span>
              </div>
              <div className={overviewStyles.languageItem.right}>
                <span className={overviewStyles.languageItem.count}>
                  {count} scripts
                </span>
                <span className={overviewStyles.languageItem.percentage}>
                  {percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};