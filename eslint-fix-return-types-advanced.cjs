#!/usr/bin/env node

// Advanced script para corrigir tipos de retorno e outras issues ESLint
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

function fixReturnTypesAdvanced() {
  console.log('🔧 Starting Advanced ESLint return type fixes...');
  
  // Get all TypeScript files
  const command = `find ${FRONTEND_DIR} -name "*.tsx" -o -name "*.ts"`;
  const files = execSync(command, { encoding: 'utf8' }).trim().split('\n');
  
  let totalFixed = 0;
  
  files.forEach(file => {
    if (!file || !fs.existsSync(file)) return;
    
    const fileName = path.relative(FRONTEND_DIR, file);
    console.log(`Processing: ${fileName}`);
    let content = fs.readFileSync(file, 'utf8');
    let fileFixed = 0;
    
    const fixes = [
      // React component arrow functions
      {
        pattern: /const\s+([A-Z]\w*)\s*:\s*React\.FC(?:<[^>]*>)?\s*=\s*\(\s*\{([^}]*)\}\s*\)\s*=>\s*\{/g,
        replacement: 'const $1: React.FC<{$2}> = ({$2}): JSX.Element => {'
      },
      // Hook functions starting with use
      {
        pattern: /export\s+function\s+(use\w+)\s*\(([^)]*)\)\s*{/g,
        replacement: 'export function $1($2): any {'
      },
      // Event handlers with void return
      {
        pattern: /(const\s+\w*[Hh]andle\w*\s*=\s*)\(([^)]*)\)\s*=>\s*{/g,
        replacement: '$1($2): void => {'
      },
      // onClick handlers
      {
        pattern: /(const\s+\w*onClick\w*\s*=\s*)\(([^)]*)\)\s*=>\s*{/g,
        replacement: '$1($2): void => {'
      },
      // onChange handlers
      {
        pattern: /(const\s+\w*onChange\w*\s*=\s*)\(([^)]*)\)\s*=>\s*{/g,
        replacement: '$1($2): void => {'
      },
      // onSubmit handlers
      {
        pattern: /(const\s+\w*onSubmit\w*\s*=\s*)\(([^)]*)\)\s*=>\s*{/g,
        replacement: '$1($2): void => {'
      },
      // Async functions
      {
        pattern: /(const\s+\w+\s*=\s*)async\s*\(([^)]*)\)\s*=>\s*{/g,
        replacement: '$1async ($2): Promise<void> => {'
      },
      // Simple arrow functions returning JSX
      {
        pattern: /const\s+([A-Z]\w*)\s*=\s*\(\s*\)\s*=>\s*\(/g,
        replacement: 'const $1 = (): JSX.Element => ('
      },
      // Boolean return functions
      {
        pattern: /(const\s+\w+\s*=\s*)\([^)]*\)\s*=>\s*\{[\s\S]*?return\s+(true|false|!\w+)/g,
        replacement: (match, prefix) => prefix + match.slice(prefix.length).replace(/\)\s*=>/, '): boolean =>')
      },
      // String return functions
      {
        pattern: /(const\s+\w+\s*=\s*)\([^)]*\)\s*=>\s*['"`]/g,
        replacement: '$1$2): string => $3'
      }
    ];
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        const oldContent = content;
        content = content.replace(fix.pattern, fix.replacement);
        if (content !== oldContent) {
          fileFixed++;
        }
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(file, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} return types`);
    }
  });
  
  console.log(`\n🎉 Total advanced fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixReturnTypesAdvanced();
}

module.exports = { fixReturnTypesAdvanced };