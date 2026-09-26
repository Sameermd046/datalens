import { CleaningStep } from '../types/dataset';

export interface CleaningResult {
  data: Record<string, any>[];
  step: CleaningStep;
}

export function removeDuplicateRows(data: Record<string, any>[]): CleaningResult {
  const seen = new Set<string>();
  const cleaned: Record<string, any>[] = [];
  let duplicateCount = 0;

  for (const row of data) {
    const key = JSON.stringify(row);
    if (!seen.has(key)) {
      seen.add(key);
      cleaned.push({ ...row });
    } else {
      duplicateCount++;
    }
  }

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'remove_duplicates',
      description: `Removed ${duplicateCount} identical duplicate row(s)`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: 0
    }
  };
}

export function removeDuplicatesByColumn(data: Record<string, any>[], column: string): CleaningResult {
  const seen = new Set<string>();
  const cleaned: Record<string, any>[] = [];
  let dropped = 0;

  for (const row of data) {
    const val = String(row[column] ?? '');
    if (!seen.has(val)) {
      seen.add(val);
      cleaned.push({ ...row });
    } else {
      dropped++;
    }
  }

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'dedup_by_column',
      description: `Enforced uniqueness on "${column}", removed ${dropped} duplicate entry(ies)`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: 0
    }
  };
}

export function removeEmptyRows(data: Record<string, any>[]): CleaningResult {
  const cleaned = data.filter(row => {
    return Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
  });

  const dropped = data.length - cleaned.length;

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'remove_empty_rows',
      description: `Removed ${dropped} entirely empty row(s)`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: 0
    }
  };
}

export function removeEmptyColumns(data: Record<string, any>[]): CleaningResult {
  if (data.length === 0) return { data, step: { id: `step_${Date.now()}`, timestamp: '', type: '', description: '', rowsBefore: 0, rowsAfter: 0, cellsModified: 0 } };

  const cols = Object.keys(data[0]);
  const emptyCols = cols.filter(c => data.every(r => r[c] === null || r[c] === undefined || String(r[c]).trim() === ''));

  if (emptyCols.length === 0) {
    return {
      data,
      step: {
        id: `step_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'remove_empty_columns',
        description: 'No completely empty columns found to remove',
        rowsBefore: data.length,
        rowsAfter: data.length,
        cellsModified: 0
      }
    };
  }

  const cleaned = data.map(r => {
    const copy = { ...r };
    emptyCols.forEach(col => delete copy[col]);
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'remove_empty_columns',
      description: `Removed ${emptyCols.length} empty column(s): ${emptyCols.join(', ')}`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: emptyCols.length * data.length
    }
  };
}

export function trimWhitespace(data: Record<string, any>[], column?: string): CleaningResult {
  let cellsModified = 0;
  const colsToTrim = column ? [column] : Object.keys(data[0] || {});

  const cleaned = data.map(row => {
    const copy = { ...row };
    for (const c of colsToTrim) {
      if (typeof copy[c] === 'string') {
        const trimmed = copy[c].trim();
        if (trimmed !== copy[c]) {
          copy[c] = trimmed;
          cellsModified++;
        }
      }
    }
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'trim_whitespace',
      description: `Trimmed whitespace across ${column ? `column "${column}"` : 'all text columns'} (${cellsModified} cell(s) updated)`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified
    }
  };
}

export function standardizeCase(
  data: Record<string, any>[],
  column: string,
  mode: 'lowercase' | 'uppercase' | 'titlecase'
): CleaningResult {
  let cellsModified = 0;

  const cleaned = data.map(row => {
    const copy = { ...row };
    const val = copy[column];
    if (typeof val === 'string' && val.length > 0) {
      let transformed = val;
      if (mode === 'lowercase') transformed = val.toLowerCase();
      else if (mode === 'uppercase') transformed = val.toUpperCase();
      else if (mode === 'titlecase') {
        transformed = val
          .toLowerCase()
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }

      if (transformed !== val) {
        copy[column] = transformed;
        cellsModified++;
      }
    }
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'case_standardization',
      description: `Standardized "${column}" to ${mode} (${cellsModified} cell(s) updated)`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified
    }
  };
}

export function findAndReplace(
  data: Record<string, any>[],
  column: string,
  findVal: string,
  replaceVal: string
): CleaningResult {
  let cellsModified = 0;

  const cleaned = data.map(row => {
    const copy = { ...row };
    const val = copy[column];
    if (val !== undefined && val !== null) {
      const strVal = String(val);
      if (strVal.includes(findVal)) {
        copy[column] = strVal.split(findVal).join(replaceVal);
        cellsModified++;
      }
    }
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'find_replace',
      description: `Replaced "${findVal}" with "${replaceVal}" in "${column}" (${cellsModified} cell(s))`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified
    }
  };
}

export function fillMissingNumeric(
  data: Record<string, any>[],
  column: string,
  strategy: 'mean' | 'median' | 'zero' | 'custom',
  customValue?: number
): CleaningResult {
  const numericValues = data
    .map(r => r[column])
    .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
    .map(Number);

  let fillValue = 0;
  if (strategy === 'zero') {
    fillValue = 0;
  } else if (strategy === 'custom') {
    fillValue = customValue ?? 0;
  } else if (strategy === 'mean') {
    const sum = numericValues.reduce((a, b) => a + b, 0);
    fillValue = numericValues.length > 0 ? Number((sum / numericValues.length).toFixed(2)) : 0;
  } else if (strategy === 'median') {
    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      fillValue = sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    }
  }

  let cellsModified = 0;
  const cleaned = data.map(row => {
    const copy = { ...row };
    const val = copy[column];
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
      copy[column] = fillValue;
      cellsModified++;
    }
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'fill_missing',
      description: `Imputed missing numeric values in "${column}" using ${strategy} (${fillValue}) across ${cellsModified} rows`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified
    }
  };
}

export function fillMissingCategorical(
  data: Record<string, any>[],
  column: string,
  strategy: 'mode' | 'custom',
  customValue?: string
): CleaningResult {
  let fillValue = customValue || 'Unknown';

  if (strategy === 'mode') {
    const freq = new Map<string, number>();
    for (const r of data) {
      const val = r[column];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        const s = String(val).trim();
        freq.set(s, (freq.get(s) || 0) + 1);
      }
    }
    let maxCount = -1;
    for (const [v, c] of freq.entries()) {
      if (c > maxCount) {
        maxCount = c;
        fillValue = v;
      }
    }
  }

  let cellsModified = 0;
  const cleaned = data.map(row => {
    const copy = { ...row };
    const val = copy[column];
    if (val === null || val === undefined || String(val).trim() === '') {
      copy[column] = fillValue;
      cellsModified++;
    }
    return copy;
  });

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'fill_missing',
      description: `Imputed missing categories in "${column}" using ${strategy} ("${fillValue}") across ${cellsModified} rows`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified
    }
  };
}

export function dropRowsWithMissing(data: Record<string, any>[], column?: string): CleaningResult {
  const cleaned = data.filter(row => {
    if (column) {
      const val = row[column];
      return val !== null && val !== undefined && String(val).trim() !== '';
    }
    return Object.values(row).every(v => v !== null && v !== undefined && String(v).trim() !== '');
  });

  const dropped = data.length - cleaned.length;

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'drop_missing_rows',
      description: `Dropped ${dropped} row(s) containing missing values ${column ? `in "${column}"` : 'in any column'}`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: 0
    }
  };
}

export function filterOutliersOrNegative(
  data: Record<string, any>[],
  column: string,
  mode: 'negative' | 'outliers'
): CleaningResult {
  if (mode === 'negative') {
    const cleaned = data.filter(r => {
      const v = Number(r[column]);
      return isNaN(v) || v >= 0;
    });
    const dropped = data.length - cleaned.length;
    return {
      data: cleaned,
      step: {
        id: `step_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'filter_negative',
        description: `Removed ${dropped} row(s) with negative values in "${column}"`,
        rowsBefore: data.length,
        rowsAfter: cleaned.length,
        cellsModified: 0
      }
    };
  }

  // mode outliers: IQR filter
  const values = data
    .map(r => Number(r[column]))
    .filter(v => !isNaN(v));

  if (values.length < 8) {
    return {
      data,
      step: {
        id: `step_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'filter_outliers',
        description: 'Dataset too small for reliable IQR outlier removal (requires $\\ge 8$ rows)',
        rowsBefore: data.length,
        rowsAfter: data.length,
        cellsModified: 0
      }
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const cleaned = data.filter(r => {
    const v = Number(r[column]);
    if (isNaN(v)) return true;
    return v >= lowerBound && v <= upperBound;
  });

  const dropped = data.length - cleaned.length;

  return {
    data: cleaned,
    step: {
      id: `step_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'filter_outliers',
      description: `Removed ${dropped} statistical outlier row(s) from "${column}" (range: [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}])`,
      rowsBefore: data.length,
      rowsAfter: cleaned.length,
      cellsModified: 0
    }
  };
}
