import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { ErrorBoundary } from '../ErrorBoundary';

// Componente que vai gerar erro
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Erro de teste');
  }
  return <div>Componente funcionando</div>;
};

describe('ErrorBoundary', () => {
  it('deve renderizar children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Componente funcionando')).toBeInTheDocument();
  });

  it('deve renderizar UI de erro quando há erro', () => {
    // Suprimir console.error durante o teste
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Oops! Algo deu errado')).toBeInTheDocument();
    expect(screen.getByText(/Encontramos um erro inesperado/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /voltar ao início/i })).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('deve renderizar fallback customizado quando fornecido', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const customFallback = <div>Erro customizado</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Erro customizado')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('deve chamar callback onError quando fornecido', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('deve ter atributos de acessibilidade corretos', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
    
    consoleSpy.mockRestore();
  });
});