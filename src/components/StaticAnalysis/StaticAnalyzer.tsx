import React, { useState, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Search,
  FileText,
  Clock,
  Filter,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { staticAnalyzer } from '../../utils/staticAnalysis';
import { StaticAnalysisReport, StaticAnalysisResult, AnalysisStats } from '../../types/staticAnalysis';

const StaticAnalyzer: React.FC = () => {
  const [analysisReport, setAnalysisReport] = useState<StaticAnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Simula leitura de arquivos do projeto (em implementação real, seria via File API ou fetch)
  const getProjectFiles = useCallback(async (): Promise<{ path: string; content: string }[]> => {
    // Esta é uma simulação - em implementação real, você leria os arquivos do sistema
    const mockFiles = [
      {
        path: '/src/App.tsx',
        content: `
import React, { useState, useEffect } from 'react';
import { SomeComponent } from './components/SomeComponent';

// Exemplo com problemas intencionais para demonstração
const App: React.FC = () => {
  const [data, setData] = useState<any>([]); // Problema: uso de 'any'
  const [unused] = useState('test'); // Problema: variável não utilizada
  
  useEffect(() => {
    console.log('Component mounted'); // Problema: console.log
  }, []); // Problema: array de dependências pode estar incompleto
  
  const items = data.map(item => ( // Problema: key ausente
    <div onClick={() => console.log('clicked')}> // Problema: função inline
      {item.name}
    </div>
  ));
  
  return (
    <div>
      <img src="test.jpg" /> {/* Problema: alt ausente */}
      <button onClick={() => alert('clicked')}> {/* Problema: função inline */}
        <svg>...</svg> {/* Problema: button sem texto acessível */}
      </button>
      <div onClick={handleClick}>Clickable div</div> {/* Problema: div sem role */}
      {items}
    </div>
  );
};

export default App;`
      },
      {
        path: '/src/components/ExampleComponent.tsx',
        content: `
import React from 'react';
import * as lodash from 'lodash'; // Problema: import de biblioteca inteira

const ExampleComponent: React.FC = () => {
  const regex = new RegExp('test'); // Problema: RegExp em render
  
  const handleDangerousHTML = (html: string) => {
    return <div dangerouslySetInnerHTML={{__html: html}} />; // Problema: XSS risk
  };
  
  return (
    <div>
      <p>Example component</p>
    </div>
  );
};

export default ExampleComponent;`
      }
    ];
    
    return mockFiles;
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const files = await getProjectFiles();
      const report = await staticAnalyzer.analyzeProject(files);
      setAnalysisReport(report);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [getProjectFiles]);

  const filteredResults = useMemo(() => {
    if (!analysisReport) return [];
    
    let filtered = analysisReport.results;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(result => result.category === selectedCategory);
    }
    
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(result => result.severity === selectedSeverity);
    }
    
    if (showOnlyErrors) {
      filtered = filtered.filter(result => result.type === 'error');
    }
    
    if (searchTerm) {
      filtered = filtered.filter(result => 
        result.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.file.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [analysisReport, selectedCategory, selectedSeverity, showOnlyErrors, searchTerm]);

  const stats = useMemo(() => {
    if (!analysisReport) return null;
    return staticAnalyzer.calculateStats(analysisReport.results);
  }, [analysisReport]);

  const getSeverityIcon = (severity: string): React.ReactElement => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Análise Estática de Código
              </h1>
              <p className="text-gray-600 mt-1">
                Detecte falhas e problemas no código sem execução
              </p>
            </div>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Executar Análise'}
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalFiles}</div>
                <div className="text-sm text-gray-600">Arquivos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.totalIssues}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.criticalIssues}</div>
                <div className="text-sm text-gray-600">Críticos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{stats.highIssues}</div>
                <div className="text-sm text-gray-600">Altos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{stats.mediumIssues}</div>
                <div className="text-sm text-gray-600">Médios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{stats.lowIssues}</div>
                <div className="text-sm text-gray-600">Baixos</div>
              </div>
            </div>
            
            {analysisReport && (
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Análise concluída em {Math.round(analysisReport.analysisTime)}ms
              </div>
            )}
          </div>
        )}

        {/* Filtros */}
        {analysisReport && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Busca */}
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Buscar por mensagem ou arquivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as Categorias</option>
                <option value="typescript">TypeScript</option>
                <option value="react">React</option>
                <option value="security">Segurança</option>
                <option value="accessibility">Acessibilidade</option>
                <option value="performance">Performance</option>
              </select>
              
              {/* Severidade */}
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas as Severidades</option>
                <option value="critical">Crítico</option>
                <option value="high">Alto</option>
                <option value="medium">Médio</option>
                <option value="low">Baixo</option>
              </select>
              
              {/* Apenas erros */}
              <button
                onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                className={`flex items-center px-3 py-2 rounded-md border ${
                  showOnlyErrors 
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-gray-50 border-gray-300 text-gray-700'
                } hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {showOnlyErrors ? (
                  <Eye className="w-4 h-4 mr-2" />
                ) : (
                  <EyeOff className="w-4 h-4 mr-2" />
                )}
                Apenas Erros
              </button>
            </div>
          </div>
        )}

        {/* Resultados */}
        <div className="px-6 py-4">
          {!analysisReport ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma análise executada
              </h3>
              <p className="text-gray-600">
                Clique em "Executar Análise" para começar a análise estática do código.
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum problema encontrado
              </h3>
              <p className="text-gray-600">
                Excelente! Não foram encontrados problemas com os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  className={`border rounded-lg p-4 ${getSeverityColor(result.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(result.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {result.message}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            result.category === 'typescript' ? 'bg-blue-100 text-blue-800' :
                            result.category === 'react' ? 'bg-green-100 text-green-800' :
                            result.category === 'security' ? 'bg-red-100 text-red-800' :
                            result.category === 'accessibility' ? 'bg-purple-100 text-purple-800' :
                            result.category === 'performance' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.category}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedResult(
                            expandedResult === result.id ? null : result.id
                          )}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {expandedResult === result.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">{result.file}</span>
                        <span className="text-gray-400"> • </span>
                        Linha {result.line}, Coluna {result.column}
                      </div>
                      
                      <p className="mt-2 text-sm text-gray-700">
                        {result.description}
                      </p>
                      
                      {result.suggestion && (
                        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                          <strong>Sugestão:</strong> {result.suggestion}
                        </div>
                      )}
                      
                      {expandedResult === result.id && result.codeSnippet && (
                        <div className="mt-3 p-3 bg-gray-900 rounded text-green-400 text-sm font-mono overflow-x-auto">
                          <pre>{result.codeSnippet}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaticAnalyzer;