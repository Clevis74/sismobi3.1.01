import React from 'react';
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
  Code
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'properties', label: 'Propriedades', icon: Building },
  { id: 'tenants', label: 'Inquilinos', icon: Users },
  { id: 'transactions', label: 'Transações', icon: DollarSign },
  { id: 'reports', label: 'Relatórios', icon: TrendingUp },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'energy', label: 'Energia – Rateio de Consumo', icon: Zap },
  { id: 'water', label: 'Água – Rateio de Consumo', icon: Droplets },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'static-analysis', label: 'Análise Estática', icon: Code },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const handleKeyDown = (event: React.KeyboardEvent, itemId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(itemId);
    }
  };

  return (
    <aside 
      id="sidebar"
      className="w-64 bg-white shadow-lg h-full flex flex-col"
      aria-label="Menu de navegação principal"
    >
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Gestão Imobiliária</h1>
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