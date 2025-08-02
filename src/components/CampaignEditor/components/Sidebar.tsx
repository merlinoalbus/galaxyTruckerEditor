import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Map, 
  Languages, 
  Rocket
} from 'lucide-react';

const menuItems = [
  { path: '/', icon: Map, label: 'Campagna', color: 'text-yellow-400' },
  { path: '/localization', icon: Languages, label: 'Traduzioni', color: 'text-cyan-400' },
];

// Azioni Rapide rimosse come richiesto

export function Sidebar() {
  const location = useLocation();

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
            <h2 className="font-bold text-white">GT Editor</h2>
            <p className="text-xs text-gray-400">v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6">
        <div className="px-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Navigazione
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

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-gray-400 text-center">
          <p>Galaxy Trucker Editor</p>
          <p>Basato su Marmalade SDK</p>
        </div>
      </div>
    </aside>
  );
}