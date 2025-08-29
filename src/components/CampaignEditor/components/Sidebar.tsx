import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Map, 
  Languages, 
  Rocket,
  Server,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from '@/locales';
import { useBackend } from '@/contexts/BackendContext';

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const { backends, activeBackend, setActiveBackend, refreshBackends } = useBackend();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const menuItems = [
    { path: '/', icon: Map, label: t('sidebar.campaign'), color: 'text-yellow-400' },
    { path: '/localization', icon: Languages, label: t('sidebar.translations'), color: 'text-cyan-400' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <aside className="w-64 bg-gt-primary border-r border-slate-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gt-accent rounded-lg flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white galaxy-title">GT Editor</h2>
            <p className="text-xs text-gray-400">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <div className="px-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t('sidebar.navigation')}
          </h3>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-gt-accent/20 text-gt-accent border-r-2 border-gt-accent'
                        : 'text-gray-300 hover:bg-gt-secondary hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive(item.path) ? 'text-gt-accent' : item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Azioni Rapide rimosse */}
      </nav>

      {/* Backend Switcher */}
      <div className="p-4 border-t border-slate-700">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Backend Server
          </h3>
          
          {/* Refresh button */}
          <button
            onClick={async () => {
              setIsRefreshing(true);
              await refreshBackends();
              setIsRefreshing(false);
            }}
            className="w-full mb-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 rounded text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Aggiorna stato
          </button>
          
          {/* Backend list */}
          <div className="space-y-1">
            {backends.map((backend) => (
              <button
                key={backend.url}
                onClick={() => backend.isAvailable && setActiveBackend(backend)}
                disabled={!backend.isAvailable}
                className={`w-full px-3 py-2 rounded text-xs transition-colors flex items-center justify-between ${
                  activeBackend.url === backend.url
                    ? 'bg-gt-accent/20 text-gt-accent border border-gt-accent'
                    : backend.isAvailable
                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-3 h-3" />
                  <div className="text-left">
                    <div className="font-medium">{backend.name}</div>
                    <div className="text-[10px] opacity-70">Porta {backend.port}</div>
                  </div>
                </div>
                {backend.isAvailable ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-400" />
                )}
              </button>
            ))}
          </div>
          
          {/* Active backend info */}
          {activeBackend.gamePath && (
            <div className="mt-2 p-2 bg-slate-800 rounded text-[10px] text-gray-400">
              <div className="truncate" title={activeBackend.gamePath}>
                📁 {activeBackend.gamePath}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-gray-400 text-center">
          <p>{t('sidebar.footerTitle')}</p>
          <p>{t('sidebar.footerSubtitle')}</p>
        </div>
      </div>
    </aside>
  );
}