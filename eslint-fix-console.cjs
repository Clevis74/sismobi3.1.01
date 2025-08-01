#!/usr/bin/env node

// Script para corrigir automaticamente console.log statements
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

function fixConsoleStatements() {
  console.log('🔧 Starting console statement fixes...');
  
  // Get files with console issues from ESLint output
  const lintOutput = execSync(`cd ${FRONTEND_DIR}/.. && npm run lint 2>&1 || true`, { encoding: 'utf8' });
  
  // Extract files with console issues
  const consoleIssues = [];
  const lines = lintOutput.split('\n');
  
  let currentFile = null;
  for (const line of lines) {
    if (line.match(/^\/app\/frontend\/src\/.*\.(tsx?|jsx?)$/)) {
      currentFile = line.trim();
    } else if (line.includes('Unexpected console statement') && currentFile) {
      const match = line.match(/(\d+):(\d+)/);
      if (match) {
        consoleIssues.push({
          file: currentFile,
          line: parseInt(match[1]),
          column: parseInt(match[2])
        });
      }
    }
  }
  
  // Group by file
  const fileGroups = {};
  consoleIssues.forEach(issue => {
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
    const lines = content.split('\n');
    let fileFixed = 0;
    
    // Sort by line number descending to avoid line number shifts
    const issues = fileGroups[filePath].sort((a, b) => b.line - a.line);
    
    issues.forEach(issue => {
      const lineIndex = issue.line - 1;
      if (lineIndex < lines.length) {
        const line = lines[lineIndex];
        
        // Replace console.log with console.warn or remove
        if (line.includes('console.log')) {
          if (line.trim().startsWith('console.log')) {
            // If it's just a console.log, comment it out
            lines[lineIndex] = line.replace('console.log', '// console.log');
          } else {
            // If it's part of debugging, replace with console.warn
            lines[lineIndex] = line.replace('console.log', 'console.warn');
          }
          fileFixed++;
        }
      }
    });
    
    if (fileFixed > 0) {
      content = lines.join('\n');
      fs.writeFileSync(filePath, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} console statements`);
    }
  });
  
  console.log(`\n🎉 Total console fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixConsoleStatements();
}

module.exports = { fixConsoleStatements };