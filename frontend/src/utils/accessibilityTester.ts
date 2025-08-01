// SISMOBI Accessibility Testing Utility
// Implements axe-core for automated accessibility validation

import { run, Result, AxeResults } from 'axe-core';

interface AccessibilityTestResult {
  passed: boolean;
  violations: ViolationSummary[];
  totalViolations: number;
  timestamp: string;
  url: string;
}

interface ViolationSummary {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  elementCount: number;
  elements: string[];
}

class AccessibilityTester {
  private results: AccessibilityTestResult[] = [];

  /**
   * Run accessibility tests on current page
   */
  async runTests(): Promise<AccessibilityTestResult> {
    try {
      const axeResults: AxeResults = await run();
      
      const result: AccessibilityTestResult = {
        passed: axeResults.violations.length === 0,
        violations: this.formatViolations(axeResults.violations),
        totalViolations: axeResults.violations.length,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      this.results.push(result);
      
      // Log results to console for development
      if (process.env.NODE_ENV === 'development') {
        this.logResults(result);
      }
      
      return result;
    } catch (error) {
      console.error('Accessibility testing error:', error);
      throw error;
    }
  }

  /**
   * Run tests on specific element
   */
  async runTestsOnElement(element: Element): Promise<AccessibilityTestResult> {
    try {
      const axeResults: AxeResults = await run(element);
      
      const result: AccessibilityTestResult = {
        passed: axeResults.violations.length === 0,
        violations: this.formatViolations(axeResults.violations),
        totalViolations: axeResults.violations.length,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };

      this.results.push(result);
      
      if (process.env.NODE_ENV === 'development') {
        this.logResults(result);
      }
      
      return result;
    } catch (error) {
      console.error('Element accessibility testing error:', error);
      throw error;
    }
  }

  /**
   * Format axe violations for easier consumption
   */
  private formatViolations(violations: Result[]): ViolationSummary[] {
    return violations.map(violation => ({
      id: violation.id,
      impact: violation.impact as 'minor' | 'moderate' | 'serious' | 'critical',
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      elementCount: violation.nodes.length,
      elements: violation.nodes.map(node => node.target.join(' ')).slice(0, 5) // Limit to 5 elements
    }));
  }

  /**
   * Log accessibility results to console
   */
  private logResults(result: AccessibilityTestResult): void {
    if (result.passed) {
      console.log('✅ Accessibility: All tests passed!');
    } else {
      console.group(`❌ Accessibility: ${result.totalViolations} violations found`);
      
      result.violations.forEach(violation => {
        const emoji = this.getImpactEmoji(violation.impact);
        console.group(`${emoji} ${violation.id} (${violation.impact})`);
        console.log('Description:', violation.description);
        console.log('Help:', violation.help);
        console.log('Elements affected:', violation.elementCount);
        console.log('Example elements:', violation.elements);
        console.log('More info:', violation.helpUrl);
        console.groupEnd();
      });
      
      console.groupEnd();
    }
  }

  /**
   * Get emoji for violation impact level
   */
  private getImpactEmoji(impact: string): string {
    switch (impact) {
      case 'critical': return '🚨';
      case 'serious': return '⚠️';
      case 'moderate': return '🔶';
      case 'minor': return '🔸';
      default: return '🔍';
    }
  }

  /**
   * Get all test results
   */
  getAllResults(): AccessibilityTestResult[] {
    return [...this.results];
  }

  /**
   * Get summary of all results
   */
  getSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalViolations: number;
    criticalViolations: number;
    seriousViolations: number;
  } {
    const totalViolations = this.results.reduce((sum, result) => sum + result.totalViolations, 0);
    const criticalViolations = this.results.reduce((sum, result) => 
      sum + result.violations.filter(v => v.impact === 'critical').length, 0
    );
    const seriousViolations = this.results.reduce((sum, result) => 
      sum + result.violations.filter(v => v.impact === 'serious').length, 0
    );

    return {
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.passed).length,
      failedTests: this.results.filter(r => !r.passed).length,
      totalViolations,
      criticalViolations,
      seriousViolations
    };
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Export singleton instance
export const accessibilityTester = new AccessibilityTester();

// Export types
export type { AccessibilityTestResult, ViolationSummary };