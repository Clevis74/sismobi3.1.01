import React from 'react';

export const SkipLinks: React.FC = () => (
  <>
    {/* Skip Links - só aparecem quando focados */}
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50">
      <a 
        href="#main-content"
        className="inline-block bg-blue-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
      >
        Pular para conteúdo principal
      </a>
      <a 
        href="#navigation"
        className="inline-block bg-blue-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
      >
        Pular para navegação
      </a>
      <a 
        href="#sidebar"
        className="inline-block bg-blue-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
      >
        Pular para menu lateral
      </a>
    </div>
  </>
);