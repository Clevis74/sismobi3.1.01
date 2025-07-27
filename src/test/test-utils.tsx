import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationProvider } from '../components/common/NotificationSystem';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Provider wrapper para testes
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ErrorBoundary>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export tudo
export * from '@testing-library/react';
export { customRender as render };