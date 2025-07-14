import React from 'react';
import { Calendar, Download, Upload } from 'lucide-react';

interface HeaderProps {
  onExport: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onImport }) => {
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