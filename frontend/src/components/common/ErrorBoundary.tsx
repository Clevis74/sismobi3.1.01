import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: ''
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary ${this.state.errorId}]:`, error, errorInfo);
    
    // Enviar para serviço de monitoramento (Sentry, LogRocket, etc.)
    this.props.onError?.(error, errorInfo);
    
    // Métricas de erro
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: { error_id: this.state.errorId }
      });
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined });
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-lg w-full bg-white shadow-xl rounded-lg p-8 text-center">
            <div className="mb-6">
              <AlertTriangle 
                className="h-16 w-16 text-red-500 mx-auto mb-4" 
                aria-hidden="true"
              />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Algo deu errado
              </h1>
              <p className="text-gray-600 mb-4">
                Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left bg-gray-50 p-4 rounded-lg mb-4">
                  <summary className="font-mono text-sm cursor-pointer">
                    Detalhes técnicos (dev)
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                  <p className="text-xs text-gray-500 mt-2">
                    ID: {this.state.errorId}
                  </p>
                </details>
              )}
            </div>
            
            <div className="space-y-3">
              {this.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  aria-describedby="retry-help"
                >
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                  Tentar novamente ({this.maxRetries - this.retryCount} tentativas restantes)
                </button>
              )}
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Voltar ao início
              </button>
            </div>
            
            <div className="sr-only" id="retry-help">
              Clique para tentar recarregar o componente que falhou
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}