import React, { useState } from 'react';
import { Calendar, Download, Upload, Eye, EyeOff, Activity, Wifi, WifiOff, FileBarChart } from 'lucide-react';
import { PerformanceDashboard } from '../Dev/PerformanceDashboard';
import { formatDate } from '../../utils/safeDateFormatting';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  showValues: boolean;
  onToggleValues: () => void;
  onShowSummary?: () => void; // Nova prop para o modal de resumo
  // Novo: indicadores de status da conexão
  connectionStatus?: {
    isOnline: boolean;
    dataSource: 'api' | 'localStorage' | 'default';
    lastSync?: Date | null;
  };
}

export const Header: React.FC<HeaderProps> = ({ 
  onExport, 
  onImport, 
  showValues, 
  onToggleValues, 
  onShowSummary,
  connectionStatus 
}) => {
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  
  const currentDate = formatDate(new Date(), {
    format: {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  });

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Status da conexão com cores e ícones
  const getConnectionDisplay = () => {
    if (!connectionStatus) return null;

    const { isOnline, dataSource, lastSync } = connectionStatus;
    
    if (dataSource === 'api' && isOnline) {
      return {
        icon: <Wifi className="w-4 h-4" />,
        text: 'Online',
        color: 'text-green-600 bg-green-50',
        title: `Conectado à API${lastSync ? ` - Última sync: ${lastSync.toLocaleTimeString()}` : ''}`
      };
    } else if (dataSource === 'localStorage') {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Offline',
        color: 'text-yellow-600 bg-yellow-50',
        title: 'Usando dados locais - Conecte-se para sincronizar'
      };
    } else {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Sem dados',
        color: 'text-gray-600 bg-gray-50',
        title: 'Nenhum dado disponível'
      };
    }
  };

  const connectionDisplay = getConnectionDisplay();

  return (
    <>
      <header className="bg-white shadow-sm border-b px-6 py-4" role="banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
              <span className="capitalize" aria-label={`Data atual: ${currentDate}`}>
                {currentDate}
              </span>
            </div>
            
            {/* Indicador de status da conexão */}
            {connectionDisplay && (
              <div 
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${connectionDisplay.color}`}
                title={connectionDisplay.title}
              >
                {connectionDisplay.icon}
                <span className="ml-1">{connectionDisplay.text}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4" role="toolbar" aria-label="Ações do cabeçalho">
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowPerformanceDashboard(true)}
                onKeyDown={(e) => handleKeyDown(e, () => setShowPerformanceDashboard(true))}
                aria-label="Abrir dashboard de performance"
                className="flex items-center px-4 py-2 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <Activity className="w-4 h-4 mr-2" aria-hidden="true" />
                🚀 Performance
              </button>
            )}
            <button
              onClick={onToggleValues}
              onKeyDown={(e) => handleKeyDown(e, onToggleValues)}
              aria-label={showValues ? 'Ocultar valores financeiros' : 'Mostrar valores financeiros'}
              aria-pressed={showValues}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                showValues 
                  ? 'text-gray-700 hover:text-red-600 hover:bg-red-50 focus:ring-red-500' 
                  : 'text-green-700 hover:text-green-800 hover:bg-green-50 focus:ring-green-500'
              }`}
            >
              {showValues ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" aria-hidden="true" />
                  🔒 Ocultar Valores
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                  🔓 Mostrar Valores
                </>
              )}
            </button>
            
            {/* Botão Ver Resumo */}
            {onShowSummary && (
              <button
                onClick={onShowSummary}
                onKeyDown={(e) => handleKeyDown(e, onShowSummary)}
                aria-label="Ver resumo detalhado do portfólio"
                className="flex items-center px-4 py-2 text-purple-700 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <FileBarChart className="w-4 h-4 mr-2" aria-hidden="true" />
                📋 Ver Resumo
              </button>
            )}
            
            <button
              onClick={onImport}
              onKeyDown={(e) => handleKeyDown(e, onImport)}
              aria-label="Importar backup de dados"
              className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
              Importar
            </button>
            <button
              onClick={onExport}
              onKeyDown={(e) => handleKeyDown(e, onExport)}
              aria-label="Exportar backup de dados"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Exportar
            </button>
          </div>
        </div>
      </header>
      
      <PerformanceDashboard
        isVisible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
        showValues={showValues}
      />
    </>
  );
};