import { DataType, TypeConversionResult } from '../types/dataset';

export function testTypeConversion(
  data: Record<string, any>[],
  column: string,
  targetType: DataType
): TypeConversionResult {
  let successCount = 0;
  let failureCount = 0;
  const failureSamples: string[] = [];

  for (const row of data) {
    const val = row[column];
    if (val === null || val === undefined || val === '') {
      // nulls are preserved as empty/null
      successCount++;
      continue;
    }

    const str = String(val).trim();

    if (targetType === 'string') {
      successCount++;
    } else if (targetType === 'integer') {
      const num = Number(str);
      if (!isNaN(num) && Number.isInteger(num)) {
        successCount++;
      } else if (!isNaN(num)) {
        // floating point to integer can truncate or flag
        successCount++;
      } else {
        failureCount++;
        if (failureSamples.length < 5) failureSamples.push(str);
      }
    } else if (targetType === 'decimal') {
      const num = Number(str);
      if (!isNaN(num)) {
        successCount++;
      } else {
        failureCount++;
        if (failureSamples.length < 5) failureSamples.push(str);
      }
    } else if (targetType === 'boolean') {
      const low = str.toLowerCase();
      if (['true', 'false', '1', '0', 'yes', 'no'].includes(low)) {
        successCount++;
      } else {
        failureCount++;
        if (failureSamples.length < 5) failureSamples.push(str);
      }
    } else if (targetType === 'date' || targetType === 'datetime') {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        successCount++;
      } else {
        failureCount++;
        if (failureSamples.length < 5) failureSamples.push(str);
      }
    }
  }

  return {
    column,
    targetType,
    successCount,
    failureCount,
    failureSamples
  };
}

export function applyTypeConversion(
  data: Record<string, any>[],
  column: string,
  targetType: DataType,
  failureHandling: 'null' | 'keep_original' | 'drop_row'
): { data: Record<string, any>[]; affectedRows: number; droppedRows: number } {
  const result: Record<string, any>[] = [];
  let affectedRows = 0;
  let droppedRows = 0;

  for (const row of data) {
    const copy = { ...row };
    const val = copy[column];

    if (val === null || val === undefined || val === '') {
      result.push(copy);
      continue;
    }

    const str = String(val).trim();
    let converted: any = val;
    let isValid = false;

    if (targetType === 'string') {
      converted = String(val);
      isValid = true;
    } else if (targetType === 'integer') {
      const num = Number(str);
      if (!isNaN(num)) {
        converted = Math.round(num);
        isValid = true;
      }
    } else if (targetType === 'decimal') {
      const num = Number(str);
      if (!isNaN(num)) {
        converted = num;
        isValid = true;
      }
    } else if (targetType === 'boolean') {
      const low = str.toLowerCase();
      if (['true', '1', 'yes'].includes(low)) {
        converted = true;
        isValid = true;
      } else if (['false', '0', 'no'].includes(low)) {
        converted = false;
        isValid = true;
      }
    } else if (targetType === 'date') {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        converted = new Date(parsed).toISOString().split('T')[0];
        isValid = true;
      }
    } else if (targetType === 'datetime') {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) {
        converted = new Date(parsed).toISOString().replace('T', ' ').slice(0, 19);
        isValid = true;
      }
    }

    if (isValid) {
      if (copy[column] !== converted) {
        copy[column] = converted;
        affectedRows++;
      }
      result.push(copy);
    } else {
      // Handle invalid conversion according to user policy
      if (failureHandling === 'drop_row') {
        droppedRows++;
      } else if (failureHandling === 'null') {
        copy[column] = null;
        affectedRows++;
        result.push(copy);
      } else {
        // keep original
        result.push(copy);
      }
    }
  }

  return { data: result, affectedRows, droppedRows };
}
