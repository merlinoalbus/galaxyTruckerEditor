import React from 'react';
import { Database, Search, Filter, SortAsc, Hash, ToggleLeft } from 'lucide-react';

import { CampaignAnalysis } from '@/types/CampaignEditor';
import { useVariablesSystem } from '@/hooks/CampaignEditor/VariablesSystem/useVariablesSystem';
import { variablesSystemService } from '@/services/CampaignEditor/VariablesSystem/variablesSystemService';
import { variablesSystemStyles } from '@/styles/CampaignEditor/VariablesSystem/VariablesSystem.styles';

interface VariablesSystemProps {
  analysis?: CampaignAnalysis | null;
}

export const VariablesSystem: React.FC<VariablesSystemProps> = ({ analysis }) => {
  const {
    filteredVariables,
    statistics,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    isLoading,
    hasData
  } = useVariablesSystem(analysis || null);

  const categorizedVariables = variablesSystemService.categorizeVariables(analysis || null);

  if (isLoading) {
    return (
      <div className={variablesSystemStyles.loadingState}>
        Loading variables data...
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={variablesSystemStyles.emptyState.container}>
        <Database className={`w-16 h-16 ${variablesSystemStyles.emptyState.icon}`} />
        <h3 className={variablesSystemStyles.emptyState.title}>No Variables Found</h3>
        <p className={variablesSystemStyles.emptyState.subtitle}>
          Load campaign scripts to analyze variables and semafori
        </p>
      </div>
    );
  }

  return (
    <div className={variablesSystemStyles.container}>
      <div className={variablesSystemStyles.header.title}>Variables & System</div>
      <p className={variablesSystemStyles.header.subtitle}>
        Manage and analyze campaign variables, semafori, and their usage across scripts
      </p>

      {/* Statistics */}
      <div className={variablesSystemStyles.stats.container}>
        <div className={variablesSystemStyles.stats.card}>
          <div className={variablesSystemStyles.stats.title}>Total Variables</div>
          <div className={variablesSystemStyles.stats.value}>{statistics.totalVariables}</div>
        </div>
        <div className={variablesSystemStyles.stats.card}>
          <div className={variablesSystemStyles.stats.title}>Semafori</div>
          <div className={variablesSystemStyles.stats.value}>{statistics.semaforiCount}</div>
          <div className={variablesSystemStyles.stats.subtitle}>Boolean flags</div>
        </div>
        <div className={variablesSystemStyles.stats.card}>
          <div className={variablesSystemStyles.stats.title}>Variables</div>
          <div className={variablesSystemStyles.stats.value}>{statistics.realVariablesCount}</div>
          <div className={variablesSystemStyles.stats.subtitle}>Numeric values</div>
        </div>
        <div className={variablesSystemStyles.stats.card}>
          <div className={variablesSystemStyles.stats.title}>Most Used</div>
          <div className={variablesSystemStyles.stats.value}>{statistics.mostUsedVariable.usage.length}</div>
          <div className={variablesSystemStyles.stats.subtitle}>{statistics.mostUsedVariable.name}</div>
        </div>
      </div>

      {/* Controls */}
      <div className={variablesSystemStyles.controls.container}>
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={variablesSystemStyles.controls.searchInput}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className={variablesSystemStyles.controls.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="semafori">Semafori Only</option>
            <option value="variables">Variables Only</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <SortAsc className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={variablesSystemStyles.controls.sortSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Variables List */}
      <div className={variablesSystemStyles.variablesList.container}>
        {filteredVariables.map((variable) => {
          const categorizedVar = categorizedVariables.find(v => v.name === variable.name);
          const categoryStyle = variablesSystemStyles.categoryBadge[categorizedVar?.category as keyof typeof variablesSystemStyles.categoryBadge] 
            || variablesSystemStyles.categoryBadge.General;

          return (
            <div key={variable.name} className={variablesSystemStyles.variablesList.item}>
              <div className={variablesSystemStyles.variablesList.header}>
                <div className="flex items-center space-x-3">
                  <h4 className={variablesSystemStyles.variablesList.name}>{variable.name}</h4>
                  <span className={`${variablesSystemStyles.variablesList.type.base} ${
                    variable.type === 'semaforo' 
                      ? variablesSystemStyles.variablesList.type.semaforo
                      : variablesSystemStyles.variablesList.type.variable
                  }`}>
                    {variable.type === 'semaforo' ? (
                      <><ToggleLeft className="w-3 h-3 inline mr-1" />Semaforo</>
                    ) : (
                      <><Hash className="w-3 h-3 inline mr-1" />Variable</>
                    )}
                  </span>
                  {categorizedVar && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryStyle}`}>
                      {categorizedVar.category}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">
                  Used in {variable.usage.length} script{variable.usage.length !== 1 ? 's' : ''}
                </span>
              </div>

              {categorizedVar?.description && (
                <p className={variablesSystemStyles.variablesList.description}>
                  {categorizedVar.description}
                </p>
              )}

              {variable.usage.length > 0 && (
                <div className={variablesSystemStyles.variablesList.usage.container}>
                  <div className={variablesSystemStyles.variablesList.usage.title}>Used in scripts:</div>
                  <div className={variablesSystemStyles.variablesList.usage.list}>
                    {variable.usage.map((scriptName) => (
                      <span key={scriptName} className={variablesSystemStyles.variablesList.usage.item}>
                        {scriptName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredVariables.length === 0 && searchTerm && (
        <div className={variablesSystemStyles.emptyState.container}>
          <Search className={`w-12 h-12 ${variablesSystemStyles.emptyState.icon}`} />
          <h3 className={variablesSystemStyles.emptyState.title}>No Results</h3>
          <p className={variablesSystemStyles.emptyState.subtitle}>
            No variables found matching "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
};