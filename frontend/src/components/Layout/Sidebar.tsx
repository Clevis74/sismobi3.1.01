import React, { useState } from 'react';
import { 
  Home, 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Bell, 
  Settings,
  Zap,
  FileText,
  Droplets,
  Shield,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Receipt,
  BookOpen
} from 'lucide-react';
import { utils } from '../../styles/designSystem';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// 🧭 NAVEGAÇÃO HIERÁRQUICA - Estrutura organizada por categorias
const navigationStructure = [
  {
    id: 'overview',
    label: '📊 Visão Geral',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home }
    ]
  },
  {
    id: 'property-management',
    label: '🏢 Gestão de Imóveis',
    items: [
      { id: 'properties', label: 'Propriedades', icon: Building, badge: 'new' },
      { id: 'tenants', label: 'Inquilinos', icon: Users },
      { id: 'documents', label: 'Contratos & Docs', icon: FileText }
    ]
  },
  {
    id: 'financial',
    label: '💰 Financeiro',
    items: [
      { id: 'transactions', label: 'Transações', icon: DollarSign },
      { id: 'energy', label: 'Contas de Energia', icon: Zap },
      { id: 'water', label: 'Contas de Água', icon: Droplets },
      { id: 'reports', label: 'Relatórios', icon: BarChart3 }
    ]
  },
  {
    id: 'system',
    label: '⚙️ Sistema',
    items: [
      { id: 'alerts', label: 'Central de Alertas', icon: Bell, badge: 'critical' },
      { id: 'accessibility', label: 'Acessibilidade', icon: Shield },
      { id: 'settings', label: 'Configurações', icon: Settings }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['overview', 'property-management', 'financial']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <aside 
      id="sidebar"
      className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-gray-200"
      aria-label="Menu de navegação principal"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <Building className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SISMOBI</h1>
            <p className="text-xs text-gray-500">Gestão Imobiliária</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto" role="navigation">
        <ul className="space-y-1" role="menu">
          {navigationStructure.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            
            return (
              <li key={group.id} role="none">
                {/* Group Header */}
                <div
                  className={utils.cn(
                    "flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 cursor-pointer rounded-lg",
                    "hover:bg-gray-50 transition-colors duration-150"
                  )}
                  onClick={() => toggleGroup(group.id)}
                  onKeyDown={(e) => handleKeyDown(e, () => toggleGroup(group.id))}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-controls={`group-${group.id}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {group.label}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>

                {/* Group Items */}
                <div 
                  id={`group-${group.id}`}
                  className={utils.cn(
                    "ml-2 mt-1 space-y-1 transition-all duration-200",
                    isExpanded ? "block" : "hidden"
                  )}
                >
                  {group.items.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        className={utils.cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-150",
                          isActive 
                            ? "bg-blue-50 text-blue-700 border-l-2 border-blue-600 font-medium shadow-sm" 
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        onClick={() => setActiveTab(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, () => setActiveTab(item.id))}
                        tabIndex={0}
                        role="menuitem"
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon 
                            className={utils.cn(
                              "w-4 h-4 flex-shrink-0",
                              isActive ? "text-blue-600" : "text-gray-400"
                            )} 
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {/* Badges */}
                        {item.badge && (
                          <span 
                            className={utils.cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                              item.badge === 'new' && "bg-green-100 text-green-800",
                              item.badge === 'critical' && "bg-red-100 text-red-800"
                            )}
                          >
                            {item.badge === 'new' && '●'}
                            {item.badge === 'critical' && '!'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>SISMOBI v3.2.0</p>
          <p className="mt-1">Melhorias de Performance ✨</p>
        </div>
      </div>
    </aside>
  );
};
        <p className="text-sm text-gray-600">Controle Financeiro</p>
      </div>
      
      <nav 
        id="navigation"
        role="navigation" 
        aria-label="Menu principal"
        className="flex-1 pt-4"
      >
        <ul role="list">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id} role="none">
                <button
                  onClick={() => setActiveTab(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-describedby={`${item.id}-desc`}
                  className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50'
                  }`}
                >
                  <Icon 
                    className="w-5 h-5 mr-3" 
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="sr-only"> (página atual)</span>
                  )}
                </button>
                <div id={`${item.id}-desc`} className="sr-only">
                  Navegar para {item.label}
                </div>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};