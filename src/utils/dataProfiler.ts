import { ColumnProfile, DataIssue, DataQualityReport, DataType } from '../types/dataset';

export function detectValueType(val: any): DataType {
  if (val === null || val === undefined || val === '') {
    return 'string';
  }

  if (typeof val === 'boolean') {
    return 'boolean';
  }

  const str = String(val).trim();
  if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
    return 'boolean';
  }

  // Number checks
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'integer' : 'decimal';
  }

  // Check if string represents a number (avoid treating date strings like "2026-01-05" as numbers)
  if (/^-?\d+$/.test(str)) {
    return 'integer';
  }
  if (/^-?\d+\.\d+$/.test(str)) {
    return 'decimal';
  }

  // Date / Datetime checks
  // ISO or YYYY-MM-DD or MM/DD/YYYY
  const isDatePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str) || /^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(str);
  if (isDatePattern) {
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      return str.includes(':') || str.includes('T') ? 'datetime' : 'date';
    }
  }

  return 'string';
}

export function detectColumnType(values: any[]): DataType {
  const nonNulls = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'string';

  let intCount = 0;
  let decCount = 0;
  let boolCount = 0;
  let dateCount = 0;
  let datetimeCount = 0;
  let strCount = 0;

  for (const v of nonNulls) {
    const t = detectValueType(v);
    if (t === 'integer') intCount++;
    else if (t === 'decimal') decCount++;
    else if (t === 'boolean') boolCount++;
    else if (t === 'date') dateCount++;
    else if (t === 'datetime') datetimeCount++;
    else strCount++;
  }

  const total = nonNulls.length;
  if ((intCount + decCount) / total >= 0.85) {
    return decCount > 0 ? 'decimal' : 'integer';
  }
  if (boolCount / total >= 0.85) return 'boolean';
  if ((dateCount + datetimeCount) / total >= 0.85) {
    return datetimeCount > 0 ? 'datetime' : 'date';
  }

  return 'string';
}

function calculateMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(arr: number[], mean: number): number {
  if (arr.length <= 1) return 0;
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function profileDataset(data: Record<string, any>[]): {
  columns: ColumnProfile[];
  qualityReport: DataQualityReport;
  duplicateRowCount: number;
} {
  if (!data || data.length === 0) {
    return {
      columns: [],
      qualityReport: {
        overallScore: 100,
        rating: 'Excellent',
        breakdown: { completeness: 100, uniqueness: 100, validity: 100, consistency: 100 },
        explanation: ['No data loaded yet'],
        issues: []
      },
      duplicateRowCount: 0
    };
  }

  const rowCount = data.length;
  const colNames = Object.keys(data[0]);

  // Check duplicate rows across entire dataset
  const rowHashList = data.map(r => JSON.stringify(r));
  const uniqueRowHashes = new Set(rowHashList);
  const duplicateRowCount = rowCount - uniqueRowHashes.size;

  const columnProfiles: ColumnProfile[] = [];
  const detectedIssues: DataIssue[] = [];

  if (duplicateRowCount > 0) {
    detectedIssues.push({
      id: 'issue_dup_rows',
      severity: duplicateRowCount > rowCount * 0.05 ? 'high' : 'medium',
      type: 'duplicate_rows',
      title: 'Identical Duplicate Rows Found',
      description: `${duplicateRowCount} row(s) (${((duplicateRowCount / rowCount) * 100).toFixed(1)}%) are complete duplicate entries.`,
      affectedCount: duplicateRowCount,
      affectedPercentage: Number(((duplicateRowCount / rowCount) * 100).toFixed(1)),
      recommendation: 'Remove duplicate rows in the Clean Data tab to avoid double-counting metrics.'
    });
  }

  let totalCellCount = rowCount * colNames.length;
  let totalNullCells = 0;
  let totalWhitespaceCells = 0;
  let totalOutlierCount = 0;

  for (const colName of colNames) {
    const rawValues = data.map(r => r[colName]);
    const nullCount = rawValues.filter(v => v === null || v === undefined || v === '').length;
    totalNullCells += nullCount;
    const nullPercentage = Number(((nullCount / rowCount) * 100).toFixed(1));

    const nonNullValues = rawValues.filter(v => v !== null && v !== undefined && v !== '');
    const detectedType = detectColumnType(nonNullValues);

    // Unique count & counts
    const valueMap = new Map<string, number>();
    let whitespaceCount = 0;

    for (const v of nonNullValues) {
      const strVal = String(v);
      if (typeof v === 'string' && (v.startsWith(' ') || v.endsWith(' '))) {
        whitespaceCount++;
      }
      const trimmed = strVal.trim();
      valueMap.set(trimmed, (valueMap.get(trimmed) || 0) + 1);
    }
    totalWhitespaceCells += whitespaceCount;

    const uniqueCount = valueMap.size;
    const uniquePercentage = rowCount > 0 ? Number(((uniqueCount / rowCount) * 100).toFixed(1)) : 0;
    const duplicateCount = nonNullValues.length - uniqueCount;

    // Checks
    const lowerName = colName.toLowerCase();
    const isPotentialId =
      (lowerName.endsWith('id') || lowerName.startsWith('id') || lowerName.includes('_id') || lowerName === 'key' || lowerName === 'code') &&
      uniquePercentage >= 80;
    const isConstant = nonNullValues.length > 0 && uniqueCount === 1;
    const isHighCardinality = !isPotentialId && detectedType === 'string' && uniquePercentage > 85 && rowCount > 20;

    // Numeric statistics
    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;
    let median: number | undefined;
    let stdDev: number | undefined;
    let sum: number | undefined;
    let hasOutliers = false;
    let outlierCount = 0;
    let hasNegativeValues = false;

    if (detectedType === 'integer' || detectedType === 'decimal') {
      const numVals = nonNullValues
        .map(v => (typeof v === 'number' ? v : parseFloat(String(v))))
        .filter(v => !isNaN(v));

      if (numVals.length > 0) {
        min = Math.min(...numVals);
        max = Math.max(...numVals);
        sum = Number(numVals.reduce((acc, v) => acc + v, 0).toFixed(2));
        mean = Number((sum / numVals.length).toFixed(2));
        median = Number(calculateMedian(numVals).toFixed(2));
        stdDev = Number(calculateStdDev(numVals, mean).toFixed(2));

        if (min < 0) {
          hasNegativeValues = true;
          // Suspicious if it is a price/sales/rating/experience/quantity
          if (
            lowerName.includes('sales') ||
            lowerName.includes('price') ||
            lowerName.includes('amount') ||
            lowerName.includes('salary') ||
            lowerName.includes('rating') ||
            lowerName.includes('quantity') ||
            lowerName.includes('experience')
          ) {
            detectedIssues.push({
              id: `issue_neg_${colName}`,
              severity: 'medium',
              type: 'negative_values',
              column: colName,
              title: `Suspicious Negative Values in "${colName}"`,
              description: `Found values below zero (min: ${min}) in financial/metric field "${colName}".`,
              affectedCount: numVals.filter(v => v < 0).length,
              affectedPercentage: Number(((numVals.filter(v => v < 0).length / rowCount) * 100).toFixed(1)),
              recommendation: 'Verify if negative values represent refunds/adjustments, or filter out invalid entries.'
            });
          }
        }

        // Outlier detection using IQR (Interquartile Range)
        if (numVals.length >= 8) {
          const sorted = [...numVals].sort((a, b) => a - b);
          const q1 = sorted[Math.floor(sorted.length * 0.25)];
          const q3 = sorted[Math.floor(sorted.length * 0.75)];
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;

          const outliers = numVals.filter(v => v < lowerBound || v > upperBound);
          if (outliers.length > 0 && iqr > 0) {
            hasOutliers = true;
            outlierCount = outliers.length;
            totalOutlierCount += outlierCount;

            detectedIssues.push({
              id: `issue_outlier_${colName}`,
              severity: outlierCount > rowCount * 0.05 ? 'medium' : 'low',
              type: 'outliers',
              column: colName,
              title: `Statistical Outliers Detected in "${colName}"`,
              description: `${outlierCount} value(s) deviate significantly from normal IQR distribution (Q1: ${q1}, Q3: ${q3}).`,
              affectedCount: outlierCount,
              affectedPercentage: Number(((outlierCount / rowCount) * 100).toFixed(1)),
              recommendation: 'Inspect extreme records in Data Check to ensure they are legitimate values rather than entry errors.'
            });
          }
        }
      }
    }

    // Categorical top values
    let topValues: { value: string; count: number; percentage: number }[] | undefined;
    if (detectedType === 'string' || detectedType === 'boolean') {
      const sortedEntries = Array.from(valueMap.entries()).sort((a, b) => b[1] - a[1]);
      topValues = sortedEntries.slice(0, 5).map(([value, count]) => ({
        value,
        count,
        percentage: Number(((count / (nonNullValues.length || 1)) * 100).toFixed(1))
      }));
    }

    // Date range
    let minDate: string | undefined;
    let maxDate: string | undefined;
    if (detectedType === 'date' || detectedType === 'datetime') {
      const timestamps = nonNullValues
        .map(v => Date.parse(String(v)))
        .filter(t => !isNaN(t));
      if (timestamps.length > 0) {
        minDate = new Date(Math.min(...timestamps)).toISOString().split('T')[0];
        maxDate = new Date(Math.max(...timestamps)).toISOString().split('T')[0];
      }
    }

    // Column specific issues
    const colIssues: string[] = [];
    if (nullCount > 0) {
      colIssues.push(`${nullPercentage}% missing values (${nullCount} rows)`);
      detectedIssues.push({
        id: `issue_missing_${colName}`,
        severity: nullPercentage > 20 ? 'high' : nullPercentage > 5 ? 'medium' : 'low',
        type: 'missing_values',
        column: colName,
        title: `Missing Values in "${colName}"`,
        description: `Column has ${nullCount} missing or empty cells (${nullPercentage}% of records).`,
        affectedCount: nullCount,
        affectedPercentage: nullPercentage,
        recommendation: detectedType === 'integer' || detectedType === 'decimal'
          ? 'Impute with Mean, Median, Zero, or drop incomplete rows in Clean Data.'
          : 'Impute with Mode or a default category label in Clean Data.'
      });
    }

    if (whitespaceCount > 0) {
      colIssues.push(`${whitespaceCount} cells with leading/trailing spaces`);
      detectedIssues.push({
        id: `issue_ws_${colName}`,
        severity: 'low',
        type: 'trailing_whitespace',
        column: colName,
        title: `Leading / Trailing Whitespace in "${colName}"`,
        description: `${whitespaceCount} values have un-trimmed whitespace, which will break exact grouping & joining.`,
        affectedCount: whitespaceCount,
        affectedPercentage: Number(((whitespaceCount / rowCount) * 100).toFixed(1)),
        recommendation: 'Use Trim Whitespace in the Clean Data tab.'
      });
    }

    if (isPotentialId && duplicateCount > 0) {
      colIssues.push(`Potential ID column has ${duplicateCount} non-unique values`);
      detectedIssues.push({
        id: `issue_dupid_${colName}`,
        severity: 'high',
        type: 'duplicate_ids',
        column: colName,
        title: `Duplicate Key Identifiers in "${colName}"`,
        description: `Column is designated as an identifier but contains ${duplicateCount} duplicate entries.`,
        affectedCount: duplicateCount,
        affectedPercentage: Number(((duplicateCount / rowCount) * 100).toFixed(1)),
        recommendation: 'Enforce key uniqueness by removing duplicate keys in Clean Data.'
      });
    }

    if (isConstant) {
      colIssues.push('Constant value across all rows (zero variance)');
      detectedIssues.push({
        id: `issue_const_${colName}`,
        severity: 'medium',
        type: 'constant_column',
        column: colName,
        title: `Constant Column "${colName}"`,
        description: 'Contains only one single unique value across all records, providing zero analytical variance.',
        affectedCount: rowCount,
        affectedPercentage: 100,
        recommendation: 'Consider removing constant columns to clean up schema clutter.'
      });
    }

    if (nonNullValues.length === 0) {
      colIssues.push('100% empty column');
      detectedIssues.push({
        id: `issue_empty_${colName}`,
        severity: 'high',
        type: 'empty_column',
        column: colName,
        title: `Entirely Empty Column "${colName}"`,
        description: 'Column has zero non-null values across the entire dataset.',
        affectedCount: rowCount,
        affectedPercentage: 100,
        recommendation: 'Drop this empty column in the Clean Data tab.'
      });
    }

    // Determine quality status
    let qualityStatus: 'good' | 'warning' | 'danger' = 'good';
    if (nullPercentage > 15 || (isPotentialId && duplicateCount > 0) || nonNullValues.length === 0) {
      qualityStatus = 'danger';
    } else if (nullPercentage > 0 || whitespaceCount > 0 || hasOutliers || isConstant) {
      qualityStatus = 'warning';
    }

    columnProfiles.push({
      name: colName,
      detectedType,
      currentType: detectedType,
      totalCount: rowCount,
      nullCount,
      nullPercentage,
      uniqueCount,
      uniquePercentage,
      duplicateCount,
      min,
      max,
      mean,
      median,
      stdDev,
      sum,
      topValues,
      minDate,
      maxDate,
      isPotentialId,
      isConstant,
      isHighCardinality,
      hasWhitespace: whitespaceCount > 0,
      hasOutliers,
      outlierCount,
      hasNegativeValues,
      qualityStatus,
      issues: colIssues
    });
  }

  // Calculate Data Quality Score
  // Completeness (0-100): based on null cells ratio
  const completeness = Math.max(0, Math.round(100 - (totalNullCells / (totalCellCount || 1)) * 100));
  // Uniqueness (0-100): based on duplicate rows and duplicate IDs
  const uniquenessPenalty = (duplicateRowCount / rowCount) * 100;
  const uniqueness = Math.max(0, Math.round(100 - uniquenessPenalty));
  // Validity (0-100): based on outliers and negatives
  const validityPenalty = Math.min(30, (totalOutlierCount / (rowCount || 1)) * 50);
  const validity = Math.max(0, Math.round(100 - validityPenalty));
  // Consistency (0-100): based on whitespace
  const consistencyPenalty = Math.min(25, (totalWhitespaceCells / (totalCellCount || 1)) * 100);
  const consistency = Math.max(0, Math.round(100 - consistencyPenalty));

  const weightedScore = Math.round(
    completeness * 0.40 +
    uniqueness * 0.25 +
    validity * 0.20 +
    consistency * 0.15
  );

  const overallScore = Math.min(100, Math.max(10, weightedScore));

  let rating: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
  if (overallScore >= 90) rating = 'Excellent';
  else if (overallScore >= 75) rating = 'Good';
  else if (overallScore >= 55) rating = 'Fair';
  else rating = 'Poor';

  const explanation: string[] = [
    `Completeness (${completeness}%): ${totalNullCells} null cells across ${totalCellCount} total cells (${((totalNullCells / (totalCellCount || 1)) * 100).toFixed(1)}% missingness).`,
    `Uniqueness (${uniqueness}%): ${duplicateRowCount} complete duplicate rows identified in dataset.`,
    `Validity (${validity}%): ${totalOutlierCount} statistical outlier values flagged across numeric distributions.`,
    `Consistency (${consistency}%): ${totalWhitespaceCells} text cells with un-trimmed leading/trailing whitespace.`
  ];

  return {
    columns: columnProfiles,
    qualityReport: {
      overallScore,
      rating,
      breakdown: { completeness, uniqueness, validity, consistency },
      explanation,
      issues: detectedIssues
    },
    duplicateRowCount
  };
}
