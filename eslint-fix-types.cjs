#!/usr/bin/env node

// Script para corrigir automaticamente tipos de retorno das funções
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

// Mapeamento de padrões comuns para tipos de retorno
const RETURN_TYPE_PATTERNS = {
  // React components
  'const.*=.*React.FC': 'JSX.Element',
  'const.*=.*\\(props.*\\).*=>.*<': 'JSX.Element',
  'function.*\\(.*\\).*{.*return.*<': 'JSX.Element',
  
  // Event handlers
  'const.*=.*\\(e:.*Event.*\\).*=>': 'void',
  'const.*=.*\\(event.*\\).*=>': 'void',
  'const.*Handle.*=.*\\(.*\\).*=>': 'void',
  'const.*onClick.*=.*\\(.*\\).*=>': 'void',
  'const.*onChange.*=.*\\(.*\\).*=>': 'void',
  
  // Async functions
  'const.*=.*async.*\\(.*\\).*=>': 'Promise<void>',
  'async.*function': 'Promise<void>',
  
  // Boolean returns
  'const.*=.*\\(.*\\).*=>.*true|false': 'boolean',
  'const.*=.*\\(.*\\).*=>.*!': 'boolean',
  
  // Number returns
  'const.*=.*\\(.*\\).*=>.*\\d+': 'number',
  
  // String returns
  'const.*=.*\\(.*\\).*=>.*[\'"`]': 'string',
  
  // Default void for simple functions
  'const.*=.*\\(.*\\).*=>.*{': 'void'
};

function fixReturnTypes() {
  console.log('🔧 Starting ESLint return type fixes...');
  
  // Get all TypeScript files
  const command = `find ${FRONTEND_DIR} -name "*.tsx" -o -name "*.ts" | head -20`;
  const files = execSync(command, { encoding: 'utf8' }).trim().split('\n');
  
  let totalFixed = 0;
  
  files.forEach(file => {
    if (!file || !fs.existsSync(file)) return;
    
    console.log(`Processing: ${path.relative(FRONTEND_DIR, file)}`);
    let content = fs.readFileSync(file, 'utf8');
    let fileFixed = 0;
    
    // Fix common patterns
    const fixes = [
      // Event handlers
      {
        pattern: /const\s+(\w*[Hh]andle\w*)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
        replacement: 'const $1 = ($2): void => {'
      },
      {
        pattern: /const\s+(\w*[Oo]n\w+)\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
        replacement: 'const $1 = ($2): void => {'
      },
      // Simple void functions
      {
        pattern: /const\s+(\w+)\s*=\s*\(\)\s*=>\s*{/g,
        replacement: 'const $1 = (): void => {'
      },
      // Async functions
      {
        pattern: /const\s+(\w+)\s*=\s*async\s*\(([^)]*)\)\s*=>\s*{/g,
        replacement: 'const $1 = async ($2): Promise<void> => {'
      }
    ];
    
    fixes.forEach(fix => {
      const matches = content.match(fix.pattern);
      if (matches) {
        content = content.replace(fix.pattern, fix.replacement);
        fileFixed += matches.length;
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(file, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} return types`);
    }
  });
  
  console.log(`\n🎉 Total fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixReturnTypes();
}

module.exports = { fixReturnTypes };