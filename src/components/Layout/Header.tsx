import React from 'react';
import { Calendar, Download, Upload, Eye, EyeOff } from 'lucide-react';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
  showValues: boolean;
  onToggleValues: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onImport, showValues, onToggleValues }) => {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="capitalize">{currentDate}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleValues}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showValues 
                ? 'text-gray-700 hover:text-red-600 hover:bg-red-50' 
                : 'text-green-700 hover:text-green-800 hover:bg-green-50'
            }`}
          >
            {showValues ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                🔒 Ocultar Valores
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                🔓 Mostrar Valores
              </>
            )}
          </button>
          <button
            onClick={onImport}
            className="flex items-center px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </button>
          <button
            onClick={onExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>
    </header>
  );
};