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
  Droplets
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
  { id: 'energy', label: 'Energia (CPFL)', icon: Zap },
  { id: 'water', label: 'Cálculo de Água Compartilhada', icon: Droplets },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Gestão Imobiliária</h1>
        <p className="text-sm text-gray-600">Controle Financeiro</p>
      </div>
      
      <nav className="flex-1 pt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};