// SISMOBI Accessibility Dashboard Component
// Displays accessibility test results and provides controls

import React, { useState, useEffect } from 'react';
import { Shield, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { accessibilityTester, AccessibilityTestResult } from '../../utils/accessibilityTester';

interface AccessibilityDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ 
  isVisible, 
  onClose 
}): JSX.Element => {
  const [testResults, setTestResults] = useState<AccessibilityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [summary, setSummary] = useState(accessibilityTester.getSummary());

  useEffect(() => {
    if (isVisible) {
      loadResults();
    }
  }, [isVisible]);

  const loadResults = (): void => {
    const results = accessibilityTester.getAllResults();
    setTestResults(results);
    setSummary(accessibilityTester.getSummary());
  };

  const runAccessibilityTest = async (): Promise<void> => {
    setIsRunning(true);
    try {
      await accessibilityTester.runTests();
      loadResults();
    } catch (error) {
      console.error('Failed to run accessibility test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = (): void => {
    accessibilityTester.clearResults();
    loadResults();
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'serious': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'minor': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getImpactEmoji = (impact: string): string => {
    switch (impact) {
      case 'critical': return '🚨';
      case 'serious': return '⚠️';
      case 'moderate': return '🔶';
      case 'minor': return '🔸';
      default: return '🔍';
    }
  };

  if (!isVisible) return <></>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <h2 className="text-xl font-bold">Accessibility Dashboard</h2>
            <span className="bg-blue-800 px-2 py-1 rounded text-sm">WCAG 2.1</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={runAccessibilityTest}
              disabled={isRunning}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Testing...' : 'Run Test'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Summary Panel */}
          <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Summary
            </h3>

            <div className="space-y-4">
              {/* Overall Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Test Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Tests:</span>
                    <span className="font-medium">{summary.totalTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passed:</span>
                    <span className="text-green-600 font-medium">{summary.passedTests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="text-red-600 font-medium">{summary.failedTests}</span>
                  </div>
                </div>
              </div>

              {/* Violations Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Violations</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{summary.totalViolations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🚨 Critical:</span>
                    <span className="text-red-600 font-medium">{summary.criticalViolations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⚠️ Serious:</span>
                    <span className="text-orange-600 font-medium">{summary.seriousViolations}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={clearResults}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                >
                  Clear Results
                </button>
                <button
                  onClick={() => window.open('https://www.w3.org/WAI/WCAG21/quickref/', '_blank')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  WCAG Guidelines
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>

            {testResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No accessibility tests run yet.</p>
                <p className="text-sm">Click "Run Test" to start testing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Result Header */}
                    <div className={`p-4 ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {result.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {result.passed ? 'Passed' : `${result.totalViolations} Violations`}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(result.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        URL: {result.url}
                      </div>
                    </div>

                    {/* Violations Details */}
                    {!result.passed && (
                      <div className="p-4 space-y-3">
                        {result.violations.map((violation, vIndex) => (
                          <div key={vIndex} className="border-l-4 border-gray-300 pl-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(violation.impact)}`}>
                                {getImpactEmoji(violation.impact)} {violation.impact.toUpperCase()}
                              </span>
                              <span className="font-medium">{violation.id}</span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-2">{violation.description}</p>
                            <p className="text-sm text-blue-600 mb-2">{violation.help}</p>
                            
                            <div className="text-xs text-gray-500">
                              <span>Affected elements: {violation.elementCount}</span>
                              {violation.elements.length > 0 && (
                                <div className="mt-1">
                                  <span>Examples: </span>
                                  <code className="bg-gray-100 px-1 rounded">
                                    {violation.elements.join(', ')}
                                  </code>
                                </div>
                              )}
                            </div>
                            
                            <a
                              href={violation.helpUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Learn more →
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};