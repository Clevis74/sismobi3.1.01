import { StaticAnalysisResult, StaticAnalysisReport, FileAnalysis, AnalysisRule, AnalysisStats } from '../types/staticAnalysis';

/**
 * Analisador estático de código - sem dependências externas
 * Utiliza apenas APIs nativas do JavaScript e regex patterns
 */
export class StaticAnalyzer {
  private rules: AnalysisRule[] = [];
  private cache: Map<string, FileAnalysis> = new Map();
  
  constructor() {
    this.initializeRules();
  }

  private initializeRules(): void {
    // Regras TypeScript
    this.rules.push(
      {
        id: 'ts-any-usage',
        name: 'Uso de tipo any',
        category: 'typescript',
        severity: 'medium',
        pattern: /:\s*any\b/g,
        message: 'Uso de tipo "any" detectado',
        description: 'O tipo "any" remove a verificação de tipos do TypeScript',
        suggestion: 'Use tipos específicos ao invés de "any"',
        enabled: true
      },
      {
        id: 'ts-unused-vars',
        name: 'Variáveis não utilizadas',
        category: 'typescript',
        severity: 'low',
        pattern: /(?:let|const|var)\s+(\w+)[^=]*=[^;]*;[\s\S]*?(?!.*\1)/g,
        message: 'Variável potencialmente não utilizada',
        description: 'Variáveis declaradas mas não utilizadas podem indicar código morto',
        suggestion: 'Remova variáveis não utilizadas ou use underscore (_) se necessário',
        enabled: true
      },
      {
        id: 'ts-console-statements',
        name: 'Statements console em produção',
        category: 'typescript',
        severity: 'low',
        pattern: /console\.(log|warn|error|info|debug)/g,
        message: 'Statement console detectado',
        description: 'Statements console podem afetar performance em produção',
        suggestion: 'Use sistema de logging apropriado ou remova em produção',
        enabled: true
      }
    );

    // Regras React
    this.rules.push(
      {
        id: 'react-missing-key',
        name: 'Propriedade key ausente',
        category: 'react',
        severity: 'high',
        pattern: /\.map\s*\(\s*\([^)]*\)\s*=>\s*<(?!.*key=)/g,
        message: 'Propriedade "key" ausente em lista renderizada',
        description: 'Elementos em listas devem ter propriedade "key" única',
        suggestion: 'Adicione propriedade key única para cada elemento da lista',
        enabled: true
      },
      {
        id: 'react-inline-functions',
        name: 'Função inline em prop',
        category: 'react',
        severity: 'medium',
        pattern: /\s(?:onClick|onChange|onSubmit|onFocus|onBlur)\s*=\s*\{[^}]*=>/g,
        message: 'Função inline detectada em prop',
        description: 'Funções inline podem causar re-renders desnecessários',
        suggestion: 'Use useCallback ou declare função fora do render',
        enabled: true
      },
      {
        id: 'react-missing-deps',
        name: 'Dependências ausentes em hooks',
        category: 'react',
        severity: 'high',
        pattern: /use(?:Effect|Memo|Callback)\s*\([^,]*,\s*\[\s*\]/g,
        message: 'Array de dependências vazio pode estar incorreto',
        description: 'Hooks com dependências ausentes podem causar bugs',
        suggestion: 'Verifique se todas as dependências estão listadas',
        enabled: true
      }
    );

    // Regras de Segurança
    this.rules.push(
      {
        id: 'security-dangerouslySetInnerHTML',
        name: 'Uso de dangerouslySetInnerHTML',
        category: 'security',
        severity: 'critical',
        pattern: /dangerouslySetInnerHTML/g,
        message: 'Uso de dangerouslySetInnerHTML detectado',
        description: 'Pode introduzir vulnerabilidades XSS',
        suggestion: 'Sanitize o HTML ou use alternativas seguras',
        enabled: true
      },
      {
        id: 'security-eval',
        name: 'Uso de eval()',
        category: 'security',
        severity: 'critical',
        pattern: /\beval\s*\(/g,
        message: 'Uso de eval() detectado',
        description: 'eval() pode executar código malicioso',
        suggestion: 'Use alternativas seguras como JSON.parse() ou Function constructor',
        enabled: true
      },
      {
        id: 'security-innerHTML',
        name: 'Uso de innerHTML',
        category: 'security',
        severity: 'medium',
        pattern: /\.innerHTML\s*=/g,
        message: 'Uso de innerHTML detectado',
        description: 'innerHTML pode introduzir vulnerabilidades XSS',
        suggestion: 'Use textContent ou createElement para conteúdo dinâmico',
        enabled: true
      }
    );

    // Regras de Acessibilidade
    this.rules.push(
      {
        id: 'a11y-missing-alt',
        name: 'Atributo alt ausente',
        category: 'accessibility',
        severity: 'high',
        pattern: /<img(?!.*alt=)/g,
        message: 'Atributo alt ausente em elemento img',
        description: 'Imagens devem ter texto alternativo para acessibilidade',
        suggestion: 'Adicione atributo alt descritivo ou alt="" se decorativa',
        enabled: true
      },
      {
        id: 'a11y-missing-aria-label',
        name: 'Button sem texto acessível',
        category: 'accessibility',
        severity: 'medium',
        pattern: /<button(?!.*(?:aria-label|aria-labelledby))[^>]*>[\s]*<(?:svg|i|span class="icon")/g,
        message: 'Button com ícone sem texto acessível',
        description: 'Botões com apenas ícones precisam de texto acessível',
        suggestion: 'Adicione aria-label ou span com sr-only',
        enabled: true
      },
      {
        id: 'a11y-missing-role',
        name: 'Elemento interativo sem role',
        category: 'accessibility',
        severity: 'medium',
        pattern: /<div[^>]*onClick[^>]*(?!.*role=)/g,
        message: 'Elemento div com onClick sem role',
        description: 'Elementos div interativos devem ter role apropriado',
        suggestion: 'Adicione role="button" ou use elemento button',
        enabled: true
      }
    );

    // Regras de Performance
    this.rules.push(
      {
        id: 'perf-large-bundle',
        name: 'Import de biblioteca inteira',
        category: 'performance',
        severity: 'medium',
        pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|moment|material-ui)/g,
        message: 'Import de biblioteca inteira detectado',
        description: 'Importar bibliotecas inteiras pode aumentar o bundle size',
        suggestion: 'Use imports específicos (tree shaking)',
        enabled: true
      },
      {
        id: 'perf-regex-in-render',
        name: 'RegExp em render',
        category: 'performance',
        severity: 'medium',
        pattern: /new\s+RegExp\s*\(|\/.*\/[gimuy]*\s*\./g,
        message: 'RegExp sendo criado em render',
        description: 'Criar RegExp em cada render pode afetar performance',
        suggestion: 'Mova RegExp para fora do componente ou use useMemo',
        enabled: true
      }
    );
  }

  /**
   * Analisa um arquivo individual
   */
  public analyzeFile(filePath: string, content: string): FileAnalysis {
    const cacheKey = `${filePath}-${this.hashContent(content)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const startTime = performance.now();
    const issues: StaticAnalysisResult[] = [];
    const lines = content.split('\n');

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      let match;
      rule.pattern.lastIndex = 0; // Reset regex global flag

      while ((match = rule.pattern.exec(content)) !== null) {
        const position = this.getLineAndColumn(content, match.index);
        const codeSnippet = this.getCodeSnippet(lines, position.line);

        issues.push({
          id: `${rule.id}-${match.index}`,
          file: filePath,
          line: position.line,
          column: position.column,
          type: rule.severity === 'critical' || rule.severity === 'high' ? 'error' : 
                rule.severity === 'medium' ? 'warning' : 'info',
          category: rule.category,
          message: rule.message,
          description: rule.description,
          severity: rule.severity,
          suggestion: rule.suggestion,
          codeSnippet
        });
      }
    });

    const analysisTime = performance.now() - startTime;
    const analysis: FileAnalysis = {
      filePath,
      content,
      issues,
      linesOfCode: lines.length,
      analysisTime
    };

    this.cache.set(cacheKey, analysis);
    return analysis;
  }

  /**
   * Analisa múltiplos arquivos
   */
  public async analyzeProject(files: { path: string; content: string }[]): Promise<StaticAnalysisReport> {
    const startTime = performance.now();
    const allResults: StaticAnalysisResult[] = [];
    const issuesByCategory: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};

    for (const file of files) {
      const analysis = this.analyzeFile(file.path, file.content);
      allResults.push(...analysis.issues);
    }

    // Calcular estatísticas
    allResults.forEach(result => {
      issuesByCategory[result.category] = (issuesByCategory[result.category] || 0) + 1;
      issuesBySeverity[result.severity] = (issuesBySeverity[result.severity] || 0) + 1;
    });

    const analysisTime = performance.now() - startTime;

    return {
      id: `analysis-${Date.now()}`,
      timestamp: new Date(),
      totalFiles: files.length,
      totalIssues: allResults.length,
      issuesByCategory,
      issuesBySeverity,
      results: allResults.sort((a, b) => {
        // Ordenar por severidade e depois por arquivo
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || 
               a.file.localeCompare(b.file);
      }),
      analysisTime
    };
  }

  /**
   * Calcula estatísticas do projeto
   */
  public calculateStats(results: StaticAnalysisResult[]): AnalysisStats {
    const stats: AnalysisStats = {
      totalFiles: new Set(results.map(r => r.file)).size,
      totalLines: 0, // Seria necessário calcular separadamente
      totalIssues: results.length,
      criticalIssues: results.filter(r => r.severity === 'critical').length,
      highIssues: results.filter(r => r.severity === 'high').length,
      mediumIssues: results.filter(r => r.severity === 'medium').length,
      lowIssues: results.filter(r => r.severity === 'low').length,
      errorCount: results.filter(r => r.type === 'error').length,
      warningCount: results.filter(r => r.type === 'warning').length,
      infoCount: results.filter(r => r.type === 'info').length
    };

    return stats;
  }

  /**
   * Limpa cache de análises
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Obtem regras ativas
   */
  public getRules(): AnalysisRule[] {
    return this.rules.filter(rule => rule.enabled);
  }

  /**
   * Atualiza configuração de regra
   */
  public updateRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // Métodos utilitários privados
  private getLineAndColumn(content: string, index: number): { line: number; column: number } {
    const lines = content.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private getCodeSnippet(lines: string[], lineNumber: number): string {
    const start = Math.max(0, lineNumber - 2);
    const end = Math.min(lines.length, lineNumber + 1);
    return lines.slice(start, end).join('\n');
  }

  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

// Instância singleton
export const staticAnalyzer = new StaticAnalyzer();