#!/usr/bin/env node

// Script para corrigir interfaces não utilizadas
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

function fixUnusedInterfaces() {
  console.log('🔧 Starting unused interface fixes...');
  
  // Get files with unused interface issues
  const lintOutput = execSync(`cd ${FRONTEND_DIR}/.. && npm run lint 2>&1 || true`, { encoding: 'utf8' });
  
  // Extract unused interface issues
  const unusedIssues = [];
  const lines = lintOutput.split('\n');
  
  let currentFile = null;
  for (const line of lines) {
    if (line.match(/^\/app\/frontend\/src\/.*\.(tsx?|jsx?)$/)) {
      currentFile = line.trim();
    } else if (line.includes('is defined but never used') && line.includes('Props') && currentFile) {
      const match = line.match(/(\d+):(\d+)\s+error\s+'(\w+)'/);
      if (match) {
        unusedIssues.push({
          file: currentFile,
          line: parseInt(match[1]),
          interfaceName: match[3]
        });
      }
    }
  }
  
  // Group by file
  const fileGroups = {};
  unusedIssues.forEach(issue => {
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
    
    const issues = fileGroups[filePath];
    
    issues.forEach(issue => {
      const interfaceName = issue.interfaceName;
      
      // Check if interface is used in the component definition
      const componentRegex = new RegExp(`React\\.FC<${interfaceName}>|\\(.*:\\s*${interfaceName}\\)`, 'g');
      
      if (!componentRegex.test(content)) {
        // Interface is truly unused, prefix with underscore
        const interfaceRegex = new RegExp(`interface\\s+${interfaceName}`, 'g');
        if (interfaceRegex.test(content)) {
          content = content.replace(interfaceRegex, `interface _${interfaceName}`);
          fileFixed++;
        }
        
        // Also check for type definitions
        const typeRegex = new RegExp(`type\\s+${interfaceName}`, 'g');
        if (typeRegex.test(content)) {
          content = content.replace(typeRegex, `type _${interfaceName}`);
          fileFixed++;
        }
      } else {
        // Interface is used, but maybe the component isn't typed correctly
        const componentName = path.basename(filePath, path.extname(filePath));
        
        // Try to add the interface to the component
        const componentPattern = new RegExp(`const\\s+${componentName}\\s*=\\s*\\(([^)]*)\\)\\s*:\\s*JSX\\.Element\\s*=>`, 'g');
        if (componentPattern.test(content)) {
          content = content.replace(componentPattern, `const ${componentName} = ($1: ${interfaceName}): JSX.Element =>`);
          fileFixed++;
        }
      }
    });
    
    if (fileFixed > 0) {
      fs.writeFileSync(filePath, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} unused interfaces`);
    }
  });
  
  console.log(`\n🎉 Total unused interface fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixUnusedInterfaces();
}

module.exports = { fixUnusedInterfaces };