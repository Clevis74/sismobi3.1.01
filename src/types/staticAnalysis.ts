// Tipos para análise estática - sem dependências externas
export interface StaticAnalysisResult {
  id: string;
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'info';
  category: 'typescript' | 'react' | 'security' | 'accessibility' | 'performance' | 'eslint';
  message: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
  codeSnippet?: string;
}

export interface StaticAnalysisReport {
  id: string;
  timestamp: Date;
  totalFiles: number;
  totalIssues: number;
  issuesByCategory: Record<string, number>;
  issuesBySeverity: Record<string, number>;
  results: StaticAnalysisResult[];
  analysisTime: number; // em millisegundos
}

export interface FileAnalysis {
  filePath: string;
  content: string;
  issues: StaticAnalysisResult[];
  linesOfCode: number;
  analysisTime: number;
}

export interface AnalysisRule {
  id: string;
  name: string;
  category: StaticAnalysisResult['category'];
  severity: StaticAnalysisResult['severity'];
  pattern: RegExp;
  message: string;
  description: string;
  suggestion?: string;
  enabled: boolean;
}

export interface AnalysisStats {
  totalFiles: number;
  totalLines: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}