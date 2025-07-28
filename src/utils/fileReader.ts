/**
 * Utilitário para leitura de arquivos do projeto para análise estática
 * Sem dependências externas - usa apenas APIs nativas
 */

export interface ProjectFile {
  path: string;
  content: string;
  size: number;
  lastModified: Date;
}

/**
 * Simula leitura de arquivos do projeto
 * Em implementação real, seria através de File API ou fetch
 */
export const getProjectFiles = async (): Promise<ProjectFile[]> => {
  // Lista de arquivos TypeScript/React principais para análise
  const filePaths = [
    '/src/App.tsx',
    '/src/main.tsx',
    '/src/components/Layout/Sidebar.tsx',
    '/src/components/Layout/Header.tsx',
    '/src/components/Dashboard/OptimizedDashboard.tsx',
    '/src/components/Properties/PropertyManager.tsx',
    '/src/components/Tenants/OptimizedTenantManager.tsx',
    '/src/components/Transactions/TransactionManager.tsx',
    '/src/components/Alerts/AlertManager.tsx',
    '/src/components/Reports/ReportManager.tsx',
    '/src/components/Documents/DocumentManager.tsx',
    '/src/components/Energy/EnergyCalculator.tsx',
    '/src/components/Water/WaterCalculator.tsx',
    '/src/components/common/ErrorBoundary.tsx',
    '/src/components/common/NotificationSystem.tsx',
    '/src/hooks/useOptimizedLocalStorage.ts',
    '/src/utils/staticAnalysis.ts',
    '/src/utils/optimizedCalculations.ts',
    '/src/utils/optimizedAlerts.ts',
    '/src/utils/safeDateFormatting.ts',
    '/src/utils/performanceMonitor.ts',
    '/src/types/index.ts',
    '/src/types/staticAnalysis.ts'
  ];

  const files: ProjectFile[] = [];
  
  for (const filePath of filePaths) {
    try {
      // Simula conteúdo real baseado em exemplos comuns
      const content = generateMockContent(filePath);
      
      files.push({
        path: filePath,
        content,
        size: content.length,
        lastModified: new Date()
      });
    } catch (error) {
      console.warn(`Erro ao ler arquivo ${filePath}:`, error);
    }
  }

  return files;
};

/**
 * Gera conteúdo mock baseado em padrões comuns encontrados no projeto
 */
const generateMockContent = (filePath: string): string => {
  // Conteúdo baseado em problemas reais encontrados no projeto
  if (filePath.includes('App.tsx')) {
    return `
import React, { useState, useEffect } from 'react';
import { SomeComponent } from './components/SomeComponent';

const App: React.FC = () => {
  const [data, setData] = useState<any>([]); // Problema: uso de 'any'
  const [unused] = useState('test'); // Problema: variável não utilizada
  
  useEffect(() => {
    console.log('Component mounted'); // Problema: console.log
  }, []); // Problema: dependências podem estar ausentes
  
  const items = data.map(item => ( // Problema: key ausente
    <div onClick={() => console.log('clicked')}> // Problema: função inline + console
      {item.name}
    </div>
  ));
  
  return (
    <div>
      <img src="test.jpg" /> {/* Problema: alt ausente */}
      <button onClick={() => alert('clicked')}> {/* Problema: função inline + alert */}
        <svg>...</svg> {/* Problema: button sem texto acessível */}
      </button>
      <div onClick={handleClick}>Clickable div</div> {/* Problema: div sem role */}
      {items}
    </div>
  );
};

export default App;`;
  }
  
  if (filePath.includes('Component')) {
    return `
import React from 'react';
import * as lodash from 'lodash'; // Problema: import de biblioteca inteira

const ExampleComponent: React.FC = () => {
  const regex = new RegExp('test'); // Problema: RegExp em render
  
  const handleDangerousHTML = (html: string) => {
    return <div dangerouslySetInnerHTML={{__html: html}} />; // Problema: XSS risk
  };
  
  const handleClick = () => {
    eval('console.log("dangerous")'); // Problema: eval usage
  };
  
  return (
    <div>
      <p>Example component</p>
      <input onChange={() => setData(value)} /> {/* Problema: função inline */}
      <div role="button" tabIndex={0}> {/* Problema: div interativo sem handlers */}
        Clickable
      </div>
    </div>
  );
};

export default ExampleComponent;`;
  }
  
  if (filePath.includes('utils/')) {
    return `
import { SomeType } from '../types';

export const utilityFunction = (param: any): any => { // Problema: uso de any
  console.log('Processing:', param); // Problema: console.log
  
  try {
    const result = processData(param);
    return result;
  } catch (error) {
    console.error('Error:', error); // OK: console.error é permitido
    throw error;
  }
};

const processData = (data: any) => { // Problema: tipo any
  if (!data) return null;
  
  // Problema: regex em função que pode ser chamada frequentemente
  const pattern = /[a-zA-Z]+/g;
  return data.match(pattern);
};`;
  }
  
  if (filePath.includes('hooks/')) {
    return `
import { useState, useEffect } from 'react';

export const useCustomHook = (dependency: string) => {
  const [state, setState] = useState<any>(null); // Problema: uso de any
  
  useEffect(() => {
    console.log('Effect running'); // Problema: console.log
    // Problema: dependência possivelmente ausente
  }, []);
  
  const updateState = (newValue: any) => { // Problema: uso de any
    setState(newValue);
  };
  
  return { state, updateState };
};`;
  }
  
  if (filePath.includes('types/')) {
    return `
export interface SomeInterface {
  id: string;
  name: string;
  data: any; // Problema: uso de any
}

export type SomeType = {
  value: any; // Problema: uso de any
  callback: () => void;
};`;
  }
  
  // Conteúdo genérico para outros arquivos
  return `
import React from 'react';

const GenericComponent: React.FC = () => {
  const [data, setData] = useState<any>([]); // Problema: uso de any
  
  useEffect(() => {
    console.log('Generic component mounted'); // Problema: console.log
  }, []);
  
  return (
    <div>
      <img src="placeholder.jpg" /> {/* Problema: alt ausente */}
      <button onClick={() => console.log('clicked')}> {/* Problema: função inline + console */}
        Click me
      </button>
    </div>
  );
};

export default GenericComponent;`;
};

/**
 * Filtra arquivos por extensão
 */
export const filterFilesByExtension = (files: ProjectFile[], extensions: string[]): ProjectFile[] => {
  return files.filter(file => {
    const ext = file.path.split('.').pop()?.toLowerCase();
    return ext ? extensions.includes(ext) : false;
  });
};

/**
 * Obtém estatísticas básicas dos arquivos
 */
export const getFileStats = (files: ProjectFile[]): { totalFiles: number; totalSize: number; extensions: Record<string, number> } => {
  const extensions: Record<string, number> = {};
  let totalSize = 0;
  
  files.forEach(file => {
    const ext = file.path.split('.').pop()?.toLowerCase() || 'unknown';
    extensions[ext] = (extensions[ext] || 0) + 1;
    totalSize += file.size;
  });
  
  return {
    totalFiles: files.length,
    totalSize,
    extensions
  };
};