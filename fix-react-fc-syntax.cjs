#!/usr/bin/env node

// Script para corrigir sintaxe incorreta de React.FC
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = '/app/frontend/src';

function fixReactFcSyntax() {
  console.log('🔧 Fixing React.FC syntax issues...');
  
  // Get files with React.FC syntax issues
  const command = `grep -r "React.FC<{.*}" ${FRONTEND_DIR} --include="*.tsx" -l || true`;
  const output = execSync(command, { encoding: 'utf8' });
  const files = output.trim().split('\n').filter(f => f && f.length > 0);
  
  let totalFixed = 0;
  
  files.forEach(file => {
    if (!file || !fs.existsSync(file)) return;
    
    console.log(`Processing: ${path.relative(FRONTEND_DIR, file)}`);
    let content = fs.readFileSync(file, 'utf8');
    let fileFixed = 0;
    
    // Find all React.FC patterns with inline props
    const patterns = [
      // React.FC<{ prop1, prop2, ... }>
      {
        from: /export const (\w+): React\.FC<\{\s*([^}]+)\s*\}>\s*=\s*\(\s*\{([^}]+)\}\s*\):\s*JSX\.Element\s*=>/g,
        to: (match, componentName, inlineProps, destructuredProps) => {
          // Generate interface name
          const interfaceName = `_${componentName}Props`;
          
          // Clean up the props - remove default values from interface
          const propsArray = inlineProps.split(',').map(p => p.trim()).filter(p => p.length > 0);
          const interfaceProps = propsArray.map(prop => {
            // Remove default values for interface
            const cleanProp = prop.replace(/\s*=\s*[^,]+/, '');
            return `  ${cleanProp};`;
          }).join('\n');
          
          // Create interface definition
          const interfaceDefinition = `interface ${interfaceName} {\n${interfaceProps}\n}\n\n`;
          
          // Return corrected component definition
          return `${interfaceDefinition}export const ${componentName}: React.FC<${interfaceName}> = ({ ${destructuredProps} }): JSX.Element =>`;
        }
      }
    ];
    
    patterns.forEach(pattern => {
      if (pattern.from.test(content)) {
        // Find the position to insert the interface
        const componentMatch = content.match(/export const \w+: React\.FC<\{[^}]+\}/);
        if (componentMatch) {
          const componentIndex = content.indexOf(componentMatch[0]);
          
          // Find the last interface definition before the component
          const beforeComponent = content.substring(0, componentIndex);
          const lastInterfaceMatch = beforeComponent.match(/interface\s+\w+\s*{[^}]+}\s*$/);
          
          let insertIndex;
          if (lastInterfaceMatch) {
            insertIndex = beforeComponent.lastIndexOf(lastInterfaceMatch[0]) + lastInterfaceMatch[0].length + 1;
          } else {
            // Insert after imports
            const lastImportMatch = beforeComponent.match(/import[^;]+;/g);
            if (lastImportMatch) {
              insertIndex = beforeComponent.lastIndexOf(lastImportMatch[lastImportMatch.length - 1]) + lastImportMatch[lastImportMatch.length - 1].length + 2;
            } else {
              insertIndex = 0;
            }
          }
          
          // Apply the transformation
          content = content.replace(pattern.from, pattern.to);
          fileFixed++;
        }
      }
    });
    
    // Simple fix: just use proper interface reference where available
    const simplePattern = /React\.FC<\{\s*([^}=]+)\s*\}>/g;
    const simpleMatches = content.match(simplePattern);
    if (simpleMatches) {
      // Try to find existing interface
      const existingInterface = content.match(/interface\s+(\w*Props)\s*{/);
      if (existingInterface) {
        content = content.replace(simplePattern, `React.FC<${existingInterface[1]}>`);
        fileFixed++;
      }
    }
    
    if (fileFixed > 0) {
      fs.writeFileSync(file, content);
      totalFixed += fileFixed;
      console.log(`  ✅ Fixed ${fileFixed} React.FC syntax issues`);
    }
  });
  
  console.log(`\n🎉 Total React.FC fixes applied: ${totalFixed}`);
  return totalFixed;
}

// Run the fixer
if (require.main === module) {
  fixReactFcSyntax();
}

module.exports = { fixReactFcSyntax };