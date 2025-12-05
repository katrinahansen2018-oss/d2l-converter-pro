/**
 * D2L Question Library CSV Converter
 * 
 * Transforms proprietary MCQ CSV format into D2L (Brightspace) Question Library import format.
 * 
 * Source Format (Sample.csv):
 * - Columns: Q #, Q Type, Q Text, Question, Answer, Answer Match, Notes
 * - Multiple rows per question (one per answer choice)
 * - Grouped by same (Q Text, Question) pair
 * 
 * Target Format (D2L):
 * - NewQuestion,MC,,,
 * - QuestionText,[concatenated text],,,
 * - Points,[value],,,
 * - Option,[weight],[answer text],,[feedback]
 */

export interface SourceRow {
  qNumber: string;
  qType: string;
  qText: string;
  question: string;
  answer: string;
  answerMatch: string;
  notes: string;
}

export interface QuestionGroup {
  qText: string;
  question: string;
  options: {
    answer: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface ConversionResult {
  csvContent: string;
  questionsCount: number;
  optionsCount: number;
  warnings: string[];
  skippedRows: number;
}

// Required source column headers (case-insensitive match)
// Note: 'Question' column is optional - grouping is done by Q Text only
const REQUIRED_COLUMNS = ['Q Type', 'Q Text', 'Answer', 'Answer Match', 'Notes'];

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  
  return result;
}

/**
 * Validate that required columns exist in the CSV
 */
export function validateColumns(headers: string[]): { valid: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const missing: string[] = [];
  
  for (const required of REQUIRED_COLUMNS) {
    if (!normalizedHeaders.includes(required.toLowerCase())) {
      missing.push(required);
    }
  }
  
  return { valid: missing.length === 0, missing };
}

/**
 * Find column index by name (case-insensitive)
 */
function getColumnValue(row: Record<string, string>, columnName: string): string {
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === columnName.toLowerCase());
  return key ? row[key] : '';
}

/**
 * Convert raw CSV rows to typed SourceRow objects
 */
export function loadSourceRows(rows: Record<string, string>[]): SourceRow[] {
  return rows.map(row => ({
    qNumber: getColumnValue(row, 'Q #'),
    qType: getColumnValue(row, 'Q Type'),
    qText: getColumnValue(row, 'Q Text'),
    question: getColumnValue(row, 'Question'),
    answer: getColumnValue(row, 'Answer'),
    answerMatch: getColumnValue(row, 'Answer Match'),
    notes: getColumnValue(row, 'Notes'),
  }));
}

/**
 * Group rows by Q # (Question Number) to prevent merging questions with identical Q Text
 */
export function groupQuestions(rows: SourceRow[]): { groups: QuestionGroup[]; warnings: string[]; skipped: number } {
  const warnings: string[] = [];
  let skipped = 0;
  
  // Group by Q # (question number) to ensure each question is unique
  const groupMap = new Map<string, QuestionGroup>();
  
  for (const row of rows) {
    // Validate Q # exists
    const qNumber = row.qNumber.trim();
    if (!qNumber) {
      warnings.push(`Row with Q Text "${row.qText.substring(0, 30)}..." has no Q # - skipped`);
      skipped++;
      continue;
    }
    
    // Validate question type
    const qType = row.qType.trim().toUpperCase();
    if (qType !== 'MC') {
      warnings.push(`Row with Q# "${row.qNumber}" has type "${row.qType}" (not MC) - skipped`);
      skipped++;
      continue;
    }
    
    // Create group key from Q # (unique per question)
    const groupKey = qNumber;
    
    // Determine if correct
    const isCorrect = row.answerMatch.trim().toLowerCase() === 'correct';
    
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        qText: row.qText,
        question: '', // No longer used for grouping
        options: [],
      });
    }
    
    const group = groupMap.get(groupKey)!;
    group.options.push({
      answer: row.answer,
      isCorrect,
      feedback: row.notes,
    });
  }
  
  // Check for questions with no correct answers or multiple correct
  const groups = Array.from(groupMap.values());
  for (const group of groups) {
    const correctCount = group.options.filter(o => o.isCorrect).length;
    const questionPreview = (group.qText + ' ' + group.question).substring(0, 50) + '...';
    
    if (correctCount === 0) {
      warnings.push(`Question "${questionPreview}" has no correct answer`);
    } else if (correctCount > 1) {
      warnings.push(`Question "${questionPreview}" has ${correctCount} correct answers`);
    }
  }
  
  return { groups, warnings, skipped };
}

/**
 * Escape a value for CSV output
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate D2L CSV output from grouped questions
 * 
 * D2L MC Question format:
 * - NewQuestion,MC,,,
 * - QuestionText,[text],,,
 * - Points,[value],,,
 * - Option,[weight],[answer],,[feedback]
 */
export function generateD2LCSV(groups: QuestionGroup[], points: number = 1): { csv: string; optionsCount: number } {
  const lines: string[] = [];
  let optionsCount = 0;
  
  for (const group of groups) {
    // NewQuestion row
    lines.push('NewQuestion,MC,,,');
    
    // QuestionText row - use Q Text only (Question column is optional/ignored)
    const fullText = group.qText.trim();
    lines.push(`QuestionText,${escapeCSV(fullText)},,,`);
    
    // Points row
    lines.push(`Points,${points},,,`);
    
    // Option rows
    for (const option of group.options) {
      const weight = option.isCorrect ? 100 : 0;
      const answer = escapeCSV(option.answer);
      const feedback = escapeCSV(option.feedback);
      lines.push(`Option,${weight},${answer},,${feedback}`);
      optionsCount++;
    }
    
    // Empty line between questions (as seen in D2L sample)
    lines.push(',,,,');
  }
  
  return { csv: lines.join('\n'), optionsCount };
}

/**
 * Main conversion function
 */
export function convertToD2L(csvContent: string, points: number = 1): ConversionResult {
  // Parse CSV
  const { headers, rows } = parseCSV(csvContent);
  
  // Validate columns
  const validation = validateColumns(headers);
  if (!validation.valid) {
    throw new Error(`Missing required columns: ${validation.missing.join(', ')}`);
  }
  
  // Load and type rows
  const sourceRows = loadSourceRows(rows);
  
  // Group questions
  const { groups, warnings, skipped } = groupQuestions(sourceRows);
  
  if (groups.length === 0) {
    throw new Error('No valid MC questions found in the input file');
  }
  
  // Generate output
  const { csv, optionsCount } = generateD2LCSV(groups, points);
  
  return {
    csvContent: csv,
    questionsCount: groups.length,
    optionsCount,
    warnings,
    skippedRows: skipped,
  };
}
