import { logger } from '@/utils/logger';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
  logger.error('[ErrorBoundary] Component crash detected:', error);
  logger.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  logger.error('[ErrorBoundary] Error boundary props:', this.props);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            Si è verificato un errore
          </h2>
          <p className="text-red-600 dark:text-red-300 text-center mb-4">
            {this.state.error?.message || 'Errore sconosciuto nel componente'}
          </p>
          
          {/* Show details in development */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
              <summary className="cursor-pointer font-semibold mb-2">
                Dettagli errore (solo in sviluppo)
              </summary>
              <pre className="overflow-auto max-w-full">
                {this.state.error?.stack}
              </pre>
              <pre className="overflow-auto max-w-full mt-2">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          
          <button
            onClick={this.handleReset}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Riprova
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}