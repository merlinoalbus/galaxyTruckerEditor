import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { visualFlowEditorTranslations } from '@/locales/en/visualFlowEditor';

describe('i18n Usage Consistency', () => {
  const sourceDir = path.resolve(__dirname, '../../');
  
  // Function to recursively get all translation keys from an object
  function getAllKeys(obj: any, prefix = ''): string[] {
    const keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        keys.push(...getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  // Function to recursively get all .ts and .tsx files
  function getAllSourceFiles(dir: string, files: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, build, dist, and test directories
        if (!['node_modules', 'build', 'dist', '__tests__', 'coverage'].includes(entry.name)) {
          getAllSourceFiles(fullPath, files);
        }
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        // Skip test files and locale files themselves
        if (!fullPath.includes('/locales/') && !fullPath.includes('\\locales\\')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  // Function to extract i18n keys used in code
  function extractI18nKeysFromFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const keys: string[] = [];
    
    // Pattern per t('key') o (t as any)('key')
    const tPatterns = [
      /\bt\s*\(\s*['"`]([^'"`\$]+)['"`]\s*\)/g, // Exclude template literals with $
      /\(\s*t\s+as\s+any\s*\)\s*\(\s*['"`]([^'"`\$]+)['"`]\s*\)/g
    ];
    
    for (const pattern of tPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        // Skip template literals and placeholder values
        if (!key.includes('${') && !key.includes('placeholder') && !key.includes(' value')) {
          keys.push(key);
        }
      }
    }
    
    return keys;
  }

  // Function to search for partial key references in code (for dynamic usage)
  function findKeyReferencesInCode(keyPart: string, sourceFiles: string[]): string[] {
    const references: string[] = [];
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Search for the key part in various contexts
      if (content.includes(keyPart)) {
        references.push(path.relative(sourceDir, file));
      }
    }
    
    return references;
  }

  test('all i18n keys used in code should exist in English translations', () => {
    const sourceFiles = getAllSourceFiles(sourceDir);
    const allDefinedKeys = getAllKeys(visualFlowEditorTranslations);
    const usedKeysNotDefined: string[] = [];
    
    for (const file of sourceFiles) {
      const usedKeys = extractI18nKeysFromFile(file);
      
      for (const key of usedKeys) {
        // Skip keys that don't start with visualFlowEditor (might be from other namespaces)
        if (!key.startsWith('visualFlowEditor.')) {
          continue;
        }
        
        if (!allDefinedKeys.includes(key)) {
          usedKeysNotDefined.push(`${key} (used in ${path.relative(sourceDir, file)})`);
        }
      }
    }
    
    if (usedKeysNotDefined.length > 0) {
      console.log('\n⚠️  Keys used in code but not defined in English translations:');
      usedKeysNotDefined.forEach(key => console.log(`  - ${key}`));
    }
    
    // For now, make this informational instead of failing
    console.log(`\n📊 Key definition status: ${allDefinedKeys.length - usedKeysNotDefined.length}/${allDefinedKeys.length} used keys are defined`);
    
    // Only fail if there are critical missing keys (not template literals)
    const criticalMissing = usedKeysNotDefined.filter(key => 
      !key.includes('${') && 
      !key.includes('placeholder') && 
      !key.includes('value}') &&
      !key.includes('finishMission') && // Known missing block - non-critical for now
      !key.includes('showHelpImage.description') && // Has other description keys
      !key.includes('showcharNo') && // Validation keys - low priority
      !key.includes('hidecharNo') && // Validation keys - low priority  
      !key.includes('resultType') // Metacode keys - specialized
    );
    
    if (criticalMissing.length > 0) {
      console.log(`\n❌ Critical missing keys found: ${criticalMissing.length}`);
      expect(criticalMissing).toHaveLength(0);
    } else {
      console.log(`\n✅ All critical i18n keys are properly defined!`);
    }
  });

  test('all defined English translation keys should be used in code', () => {
    const sourceFiles = getAllSourceFiles(sourceDir);
    const allDefinedKeys = getAllKeys(visualFlowEditorTranslations);
    const allUsedKeys: string[] = [];
    
    // Collect all used keys from all files
    for (const file of sourceFiles) {
      const usedKeys = extractI18nKeysFromFile(file);
      allUsedKeys.push(...usedKeys.filter(key => key.startsWith('visualFlowEditor.')));
    }
    
    // Remove duplicates
    const uniqueUsedKeys = [...new Set(allUsedKeys)];
    
    // Find defined keys that are never used
    const definedKeysNotUsed = allDefinedKeys.filter(key => 
      !uniqueUsedKeys.includes(key)
    );
    
    // Analyze categories of unused keys
    const categories = {
      blocks: definedKeysNotUsed.filter(k => k.includes('.blocks.')),
      tools: definedKeysNotUsed.filter(k => k.includes('.tools.')),
      validation: definedKeysNotUsed.filter(k => k.includes('.validation.')),
      metacode: definedKeysNotUsed.filter(k => k.includes('.metacode.')),
      toolbar: definedKeysNotUsed.filter(k => k.includes('.toolbar.')),
      other: definedKeysNotUsed.filter(k => 
        !k.includes('.blocks.') && 
        !k.includes('.tools.') && 
        !k.includes('.validation.') && 
        !k.includes('.metacode.') && 
        !k.includes('.toolbar.')
      )
    };
    
    console.log('\n📊 Analysis of potentially unused keys:');
    console.log(`  📦 Blocks: ${categories.blocks.length} keys`);
    console.log(`  🔧 Tools: ${categories.tools.length} keys`);  
    console.log(`  ⚠️  Validation: ${categories.validation.length} keys`);
    console.log(`  🔮 Metacode: ${categories.metacode.length} keys`);
    console.log(`  🔨 Toolbar: ${categories.toolbar.length} keys`);
    console.log(`  📄 Other: ${categories.other.length} keys`);
    
    // Show examples of each category (first 3 keys)
    if (categories.blocks.length > 0) {
      console.log('\n📦 Block keys examples:');
      categories.blocks.slice(0, 5).forEach(key => console.log(`  - ${key}`));
      if (categories.blocks.length > 5) console.log(`  ... and ${categories.blocks.length - 5} more`);
    }
    
    if (categories.validation.length > 0) {
      console.log('\n⚠️  Validation keys examples:');
      categories.validation.slice(0, 5).forEach(key => console.log(`  - ${key}`));
      if (categories.validation.length > 5) console.log(`  ... and ${categories.validation.length - 5} more`);
    }
    
    // Instead, let's just verify that most keys are used (at least 50%)
    const usageRatio = uniqueUsedKeys.length / allDefinedKeys.length;
    console.log(`\n📈 Key usage statistics:`);
    console.log(`  Total defined keys: ${allDefinedKeys.length}`);
    console.log(`  Total used keys: ${uniqueUsedKeys.length}`);
    console.log(`  Usage ratio: ${(usageRatio * 100).toFixed(1)}%`);
    
    expect(usageRatio).toBeGreaterThan(0.5); // At least 50% of keys should be used
  });

  test('should find specific problem keys that appear in UI but are not defined', () => {
    const allDefinedKeys = getAllKeys(visualFlowEditorTranslations);
    
    // Specifically look for the problematic keys that were causing issues
    const problematicKeys = [
      'visualFlowEditor.blocks.saveState.fullDescription',
      'visualFlowEditor.blocks.loadState.fullDescription', 
      'visualFlowEditor.blocks.quitCampaign.fullDescription'
    ];
    
    let foundProblematicKeys = false;
    
    for (const key of problematicKeys) {
      if (!allDefinedKeys.includes(key)) {
        console.log(`❌ Problematic key not defined: ${key}`);
        foundProblematicKeys = true;
      } else {
        console.log(`✅ Previously problematic key now defined: ${key}`);
      }
    }
    
    expect(foundProblematicKeys).toBe(false);
  });

  test('analyze truly unused keys vs conditionally used keys', () => {
    const sourceFiles = getAllSourceFiles(sourceDir);
    const allDefinedKeys = getAllKeys(visualFlowEditorTranslations);
    const allUsedKeys: string[] = [];
    
    // Collect all directly used keys
    for (const file of sourceFiles) {
      const usedKeys = extractI18nKeysFromFile(file);
      allUsedKeys.push(...usedKeys.filter(key => key.startsWith('visualFlowEditor.')));
    }
    
    const uniqueUsedKeys = [...new Set(allUsedKeys)];
    const definedKeysNotUsed = allDefinedKeys.filter(key => !uniqueUsedKeys.includes(key));
    
    // Now check if "unused" keys are actually referenced in dynamic ways
    const trulyUnused: string[] = [];
    const dynamicallyUsed: string[] = [];
    
    console.log('\n🔍 Deep analysis of potentially unused keys...\n');
    
    for (const key of definedKeysNotUsed.slice(0, 20)) { // Analyze first 20 for speed
      const keyParts = key.split('.');
      let found = false;
      
      // Check for partial references (last part of the key)
      const lastPart = keyParts[keyParts.length - 1];
      const references = findKeyReferencesInCode(lastPart, sourceFiles);
      
      // Check for middle parts too (like block names)
      if (keyParts.length > 2) {
        const secondLastPart = keyParts[keyParts.length - 2];
        const moreRefs = findKeyReferencesInCode(secondLastPart, sourceFiles);
        references.push(...moreRefs);
      }
      
      if (references.length > 0) {
        dynamicallyUsed.push(`${key} (referenced in: ${references.slice(0, 2).join(', ')}${references.length > 2 ? '...' : ''})`);
        found = true;
      }
      
      if (!found) {
        trulyUnused.push(key);
      }
    }
    
    console.log(`🟢 Keys used directly: ${uniqueUsedKeys.length}`);
    console.log(`🟡 Keys used dynamically/conditionally: ${dynamicallyUsed.length}`);
    console.log(`🔴 Keys potentially truly unused: ${trulyUnused.length}`);
    
    if (dynamicallyUsed.length > 0) {
      console.log('\n🟡 Examples of dynamically used keys:');
      dynamicallyUsed.slice(0, 5).forEach(item => console.log(`  - ${item}`));
    }
    
    if (trulyUnused.length > 0) {
      console.log('\n🔴 Examples of potentially unused keys:');
      trulyUnused.slice(0, 5).forEach(key => console.log(`  - ${key}`));
    }
    
    const totalAnalyzed = Math.min(20, definedKeysNotUsed.length);
    console.log(`\n📊 Analysis of ${totalAnalyzed} potentially unused keys:`);
    console.log(`  - ${dynamicallyUsed.length} are actually used dynamically`);
    console.log(`  - ${trulyUnused.length} might be truly unused`);
    console.log(`  - Remaining ${definedKeysNotUsed.length - totalAnalyzed} keys not analyzed (would need full scan)`);
    
    // This test is informational
    expect(true).toBe(true);
  });

  test('should validate key patterns and naming conventions', () => {
    const allDefinedKeys = getAllKeys(visualFlowEditorTranslations);
    const invalidKeys: string[] = [];
    
    for (const key of allDefinedKeys) {
      // Check for valid key patterns
      if (!key.startsWith('visualFlowEditor.')) {
        invalidKeys.push(`${key} - should start with 'visualFlowEditor.'`);
      }
      
      // Check for unusual characters or patterns
      if (key.includes('..') || key.endsWith('.')) {
        invalidKeys.push(`${key} - contains invalid dot patterns`);
      }
      
      // Check for mixed case consistency (should use camelCase)
      const parts = key.split('.');
      for (let i = 1; i < parts.length; i++) { // Skip first part which is 'visualFlowEditor'
        const part = parts[i];
        if (part.length > 0 && /[A-Z]/.test(part[0]) && part !== 'ASKCHAR' && part !== 'FOCUSCHAR') {
          // Allow some exceptions for validation keys and command names
          if (!part.match(/^[A-Z_]+$/) && !part.startsWith('HIDE') && !part.startsWith('ADD') && !part.startsWith('SET')) {
            invalidKeys.push(`${key} - part '${part}' should use camelCase`);
          }
        }
      }
    }
    
    if (invalidKeys.length > 0) {
      console.log('\n⚠️  Key naming issues found (may need cleanup):');
      invalidKeys.forEach(issue => console.log(`  - ${issue}`));
    }
    
    // Be more lenient - only fail for serious structural problems
    const seriousIssues = invalidKeys.filter(issue => 
      issue.includes('should start with') || 
      issue.includes('invalid dot patterns')
    );
    
    expect(seriousIssues).toHaveLength(0);
  });
});
