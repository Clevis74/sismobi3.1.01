#!/usr/bin/env node

// Script para substituir tipos 'any' por tipos específicos
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

function fixAnyTypes() {
  console.log('🔧 Starting Any type fixes...');
  
  // Get files with any type issues from ESLint
  const lintOutput = execSync(`cd ${FRONTEND_DIR}/.. && npm run lint 2>&1 || true`, { encoding: 'utf8' });
  
  // Extract files with 'any' type issues
  const anyIssues = [];
  const lines = lintOutput.split('\n');
  
  let currentFile = null;
  for (const line of lines) {
    if (line.match(/^\/app\/frontend\/src\/.*\.(tsx?|jsx?)$/)) {
      currentFile = line.trim();
    } else if (line.includes('Unexpected any') && currentFile) {
      const match = line.match(/(\d+):(\d+)/);
      if (match) {
        anyIssues.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2])
        });
      }
    }
  }
  
  // Group by file
  const fileGroups = {};
  anyIssues.forEach(issue => {
    if (!fileGroups[issue.file]) {
      fileGroups[issue.file] = [];
    }
    fileGroups[issue.file].push(issue);
  });
  
  let totalFixed = 0;
  
  Object.keys(fileGroups).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    console.log(`Processing: ${path.relative(FRONTEND_DIR, filePath)}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let fileFixed = 0;
    
    // Common any type fixes
    const fixes = [
      // Function parameters
      { from: /function\s+\w+\s*\([^)]*:\s*any/g, to: (match) => match.replace(': any', ': unknown') },
      // Variable types
      { from: /:\s*any\s*=/g, to: ': unknown =' },
      // Array types
      { from: /:\s*any\[\]/g, to: ': unknown[]' },
      // Generic types
      { from: /<any>/g, to: '<unknown>' },
      // Parameter types in arrow functions
      { from: /\(\s*\w+:\s*any\s*\)/g, to: (match) => match.replace(': any', ': unknown') },
      // Return types
      { from: /\):\s*any\s*=>/g, to: '): unknown =>' },
      // Object properties
      { from: /\w+:\s*any;/g, to: (match) => match.replace(': any;', ': unknown;') }
    ];
    
    fixes.forEach(fix => {
      const matches = content.match(fix.from);
      if (matches) {
        if (typeof fix.to === 'function') {
          content = content.replace(fix.from, fix.to);
        } else {
          content = content.replace(fix.from, fix.to);
        }
        fileFixed += matches.length;
      }
    });
    
    // Specific context-based fixes
    if (content.includes('React.ChangeEvent') || content.includes('ChangeEvent')) {
      content = content.replace(/e:\s*any/g, 'e: React.ChangeEvent<HTMLInputElement>');
      if (content !== fs.readFileSync(filePath, 'utf8')) fileFixed++;
    }
    
    if (content.includes('error') && content.includes(': any')) {
      content = content.replace(/error:\s*any/g, 'error: Error | unknown');
      if (content !== fs.readFileSync(filePath, 'utf8')) fileFixed++;
    }
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} any types`);
    }
  });
  
  console.log(`\n🎉 Total any type fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixAnyTypes();
}

module.exports = { fixAnyTypes };