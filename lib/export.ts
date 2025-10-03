import { AssessmentSpec, AnswerMap, ExportData, AssessmentResults } from '@/types/assessment';

/**
 * Export data as JSON file download
 * @param filename - Name of the file to download
 * @param data - Data to export (will be JSON stringified)
 */
export function exportJSON(filename: string, data: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw new Error('Failed to export results. Please try again.');
  }
}

/**
 * Generate standardized export data structure
 * @param spec - Assessment specification
 * @param answers - User answers
 * @param results - Computed results
 * @returns Structured export data
 */
export function createExportData(
  spec: AssessmentSpec,
  answers: AnswerMap,
  results: AssessmentResults
): ExportData {
  return {
    version: spec.version,
    language: spec.language,
    timestamp: new Date().toISOString(),
    answers,
    scores: {
      dimensions: results.dimensions.map(dim => ({
        id: dim.id,
        score: Math.round(dim.score * 10000) / 10000, // Round to 4 decimal places
        target: Math.round(dim.target * 10000) / 10000,
        gap: Math.round(dim.gap * 10000) / 10000,
      })),
      overall: Math.round(results.overall * 10000) / 10000,
      classification: {
        level: results.classification.level,
        label: results.classification.labelKey,
      },
    },
  };
}

/**
 * Export assessment results as JSON file
 * @param spec - Assessment specification
 * @param answers - User answers
 * @param results - Computed results
 */
export function exportAssessmentResults(
  spec: AssessmentSpec,
  answers: AnswerMap,
  results: AssessmentResults
): void {
  const exportData = createExportData(spec, answers, results);
  const filename = generateFilename('dma-results');
  exportJSON(filename, exportData);
}

/**
 * Generate a timestamped filename
 * @param prefix - Filename prefix
 * @param extension - File extension (default: json)
 * @returns Formatted filename with timestamp
 */
export function generateFilename(prefix: string, extension: string = 'json'): string {
  const timestamp = new Date().toISOString()
    .slice(0, 16) // Take YYYY-MM-DDTHH:MM
    .replace(/[:T]/g, '-'); // Replace : and T with -
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Validate export data structure
 * @param data - Data to validate
 * @returns True if data is valid for export
 */
export function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  
  const exportData = data as ExportData;
  return !!(
    exportData.version &&
    exportData.language &&
    exportData.timestamp &&
    exportData.answers &&
    exportData.scores &&
    exportData.scores.dimensions &&
    typeof exportData.scores.overall === 'number' &&
    exportData.scores.classification
  );
}

/**
 * Create a summary text export (for debugging or sharing)
 * @param spec - Assessment specification
 * @param results - Computed results
 * @returns Human-readable summary text
 */
export function createSummaryText(
  spec: AssessmentSpec,
  results: AssessmentResults
): string {
  const lines: string[] = [];
  
  lines.push('DIGITAL MATURITY ASSESSMENT RESULTS');
  lines.push('=====================================');
  lines.push('');
  lines.push(`Assessment Version: ${spec.version}`);
  lines.push(`Language: ${spec.language.toUpperCase()}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');
  
  lines.push(`OVERALL SCORE: ${(results.overall * 100).toFixed(1)}%`);
  lines.push(`MATURITY LEVEL: ${results.classification.level} (${results.classification.labelKey})`);
  lines.push('');
  
  lines.push('DIMENSION SCORES:');
  lines.push('-'.repeat(50));
  
  results.dimensions.forEach(dim => {
    const dimension = spec.dimensions.find(d => d.id === dim.id);
    const name = dimension?.name || dim.id;
    const score = (dim.score * 100).toFixed(1);
    const target = (dim.target * 100).toFixed(1);
    const gap = (dim.gap * 100).toFixed(1);
    
    lines.push(`${name.padEnd(30)} ${score.padStart(6)}% (Target: ${target}%, Gap: ${gap}%)`);
  });
  
  lines.push('');
  lines.push('For detailed results, please refer to the JSON export.');
  
  return lines.join('\n');
}

/**
 * Export assessment summary as text file
 * @param spec - Assessment specification
 * @param results - Computed results
 */
export function exportSummaryText(
  spec: AssessmentSpec,
  results: AssessmentResults
): void {
  const summary = createSummaryText(spec, results);
  const filename = generateFilename('dma-summary', 'txt');
  
  const blob = new Blob([summary], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}