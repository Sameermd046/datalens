import { ColumnProfile, DataInsight } from '../types/dataset';

export function generateTraceableInsights(
  data: Record<string, any>[],
  columns: ColumnProfile[],
  duplicateRowCount: number
): DataInsight[] {
  const insights: DataInsight[] = [];
  if (!data || data.length === 0 || !columns || columns.length === 0) return [];

  const rowCount = data.length;
  const numericCols = columns.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal');
  const categoricalCols = columns.filter(c => c.detectedType === 'string' && !c.isPotentialId);
  const dateCols = columns.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');

  // 1. DATA QUALITY INSIGHTS
  let totalNullCells = 0;
  columns.forEach(c => (totalNullCells += c.nullCount));
  const totalCells = rowCount * columns.length;
  const missingPct = ((totalNullCells / (totalCells || 1)) * 100).toFixed(1);

  if (totalNullCells > 0) {
    const highestMissingCol = [...columns].sort((a, b) => b.nullCount - a.nullCount)[0];
    insights.push({
      id: 'insight_dq_missing',
      category: 'DATA QUALITY',
      title: `${missingPct}% Total Dataset Missingness`,
      description: `Detected ${totalNullCells} null or blank cells across ${totalCells} total values. The most affected attribute is "${highestMissingCol.name}" with ${highestMissingCol.nullCount} missing entries (${highestMissingCol.nullPercentage}%).`,
      metric: `${missingPct}% missing`,
      traceableData: `Total cells: ${totalCells}, Null cells: ${totalNullCells}, Peak missing column: ${highestMissingCol.name} (${highestMissingCol.nullCount} nulls)`,
      importance: Number(missingPct) > 10 ? 'high' : 'medium'
    });
  } else {
    insights.push({
      id: 'insight_dq_clean',
      category: 'DATA QUALITY',
      title: 'Zero Missing Values Across All Attributes',
      description: `Complete data coverage observed: 100% of cells across all ${rowCount} records contain non-empty data.`,
      metric: '100% complete',
      traceableData: `Total records checked: ${rowCount}, columns: ${columns.length}`,
      importance: 'info'
    });
  }

  if (duplicateRowCount > 0) {
    insights.push({
      id: 'insight_dq_dup',
      category: 'DATA QUALITY',
      title: `${duplicateRowCount} Duplicate Rows Present`,
      description: `${duplicateRowCount} record(s) (${((duplicateRowCount / rowCount) * 100).toFixed(1)}%) share identical tuples across all fields, risking double-counting in sum and count aggregations.`,
      metric: `${duplicateRowCount} duplicates`,
      traceableData: `Row hashes evaluated: ${rowCount}, unique set size: ${rowCount - duplicateRowCount}`,
      importance: 'high'
    });
  }

  // 2. DISTRIBUTION INSIGHTS
  if (categoricalCols.length > 0) {
    const primaryCat = categoricalCols[0];
    const freqMap = new Map<string, number>();
    for (const r of data) {
      const v = String(r[primaryCat.name] ?? 'Unknown').trim();
      if (v) freqMap.set(v, (freqMap.get(v) || 0) + 1);
    }

    const sortedFreq = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedFreq.length > 0) {
      const topVal = sortedFreq[0];
      const topPct = ((topVal[1] / rowCount) * 100).toFixed(1);

      insights.push({
        id: 'insight_dist_cat',
        category: 'DISTRIBUTION',
        title: `Dominant Category: "${topVal[0]}"`,
        description: `"${topVal[0]}" represents ${topPct}% (${topVal[1]} of ${rowCount}) of records in "${primaryCat.name}". The remaining ${100 - Number(topPct)}% is spread across ${sortedFreq.length - 1} other distinct classes.`,
        metric: `${topPct}% share`,
        traceableData: `Column: ${primaryCat.name}, Distinct values: ${sortedFreq.length}, Top frequency: ${topVal[1]}`,
        importance: Number(topPct) > 40 ? 'high' : 'medium'
      });
    }
  }

  // 3. BUSINESS OBSERVATIONS & REVENUE / METRIC CONCENTRATION
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    const cat = categoricalCols[0];
    const num = numericCols[0];

    const groupSum = new Map<string, number>();
    let totalSum = 0;

    for (const r of data) {
      const k = String(r[cat.name] ?? 'Other').trim();
      const val = Number(r[num.name]) || 0;
      groupSum.set(k, (groupSum.get(k) || 0) + val);
      totalSum += val;
    }

    const sortedSums = Array.from(groupSum.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedSums.length > 0 && totalSum > 0) {
      const topEntry = sortedSums[0];
      const sharePct = ((topEntry[1] / totalSum) * 100).toFixed(1);

      insights.push({
        id: 'insight_biz_concentration',
        category: 'BUSINESS OBSERVATIONS',
        title: `Highest Value Contributor: "${topEntry[0]}"`,
        description: `"${topEntry[0]}" accounts for ${sharePct}% of cumulative ${num.name.replace(/_/g, ' ')} (${topEntry[1].toLocaleString(undefined, { maximumFractionDigits: 2 })} of ${totalSum.toLocaleString(undefined, { maximumFractionDigits: 2 })}).`,
        metric: `${sharePct}% contribution`,
        traceableData: `Aggregation: SUM(${num.name}) GROUP BY ${cat.name}, Total sum: ${totalSum.toFixed(2)}, Top group sum: ${topEntry[1].toFixed(2)}`,
        importance: 'high'
      });
    }
  }

  // 4. OUTLIERS & ANOMALIES
  const colsWithOutliers = columns.filter(c => c.hasOutliers && c.outlierCount > 0);
  if (colsWithOutliers.length > 0) {
    for (const c of colsWithOutliers.slice(0, 2)) {
      insights.push({
        id: `insight_outlier_${c.name}`,
        category: 'OUTLIERS',
        title: `${c.outlierCount} Statistical Outlier(s) in "${c.name}"`,
        description: `Identified values outside the 1.5 × IQR boundary (range: ${c.min} to ${c.max}, median: ${c.median}). These records significantly pull the arithmetic mean away from the center.`,
        metric: `${c.outlierCount} outliers`,
        traceableData: `Column: ${c.name}, Min: ${c.min}, Max: ${c.max}, Mean: ${c.mean}, Median: ${c.median}, StdDev: ${c.stdDev}`,
        importance: 'medium'
      });
    }
  }

  // 5. CORRELATIONS
  if (numericCols.length >= 2) {
    const colA = numericCols[0];
    const colB = numericCols[1];

    const pairs = data
      .map(r => ({ x: Number(r[colA.name]), y: Number(r[colB.name]) }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));

    if (pairs.length >= 6) {
      const n = pairs.length;
      const avgX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
      const avgY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

      let numR = 0;
      let denX = 0;
      let denY = 0;
      for (const p of pairs) {
        const dx = p.x - avgX;
        const dy = p.y - avgY;
        numR += dx * dy;
        denX += dx * dx;
        denY += dy * dy;
      }

      const denominator = Math.sqrt(denX * denY);
      const rCoeff = denominator !== 0 ? numR / denominator : 0;
      const rPct = (rCoeff * 100).toFixed(1);

      let strength = 'weak';
      if (Math.abs(rCoeff) >= 0.7) strength = 'strong';
      else if (Math.abs(rCoeff) >= 0.4) strength = 'moderate';

      insights.push({
        id: `insight_corr_${colA.name}_${colB.name}`,
        category: 'CORRELATIONS',
        title: `${strength.charAt(0).toUpperCase() + strength.slice(1)} Correlation: ${colA.name.replace(/_/g, ' ')} vs ${colB.name.replace(/_/g, ' ')}`,
        description: `Pearson correlation coefficient r = ${rCoeff.toFixed(2)}. ${
          rCoeff > 0 ? 'Positive relationship: higher values in one correspond with higher values in the other.' : 'Inverse relationship: increases in one tend to accompany reductions in the other.'
        }`,
        metric: `r = ${rCoeff.toFixed(2)}`,
        traceableData: `Pearson r calculation on ${n} data points between ${colA.name} and ${colB.name}, variance product: ${denominator.toFixed(2)}`,
        importance: Math.abs(rCoeff) >= 0.5 ? 'high' : 'info'
      });
    }
  }

  // 6. TRENDS
  if (dateCols.length > 0 && numericCols.length > 0) {
    const dt = dateCols[0];
    const num = numericCols[0];

    const sortedByDate = [...data]
      .filter(r => r[dt.name] && !isNaN(Date.parse(r[dt.name])))
      .sort((a, b) => new Date(a[dt.name]).getTime() - new Date(b[dt.name]).getTime());

    if (sortedByDate.length >= 6) {
      const half = Math.floor(sortedByDate.length / 2);
      const firstHalf = sortedByDate.slice(0, half);
      const secondHalf = sortedByDate.slice(half);

      const firstAvg = firstHalf.reduce((acc, r) => acc + (Number(r[num.name]) || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((acc, r) => acc + (Number(r[num.name]) || 0), 0) / secondHalf.length;

      const changePct = firstAvg !== 0 ? (((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1) : '0';
      const isPositive = Number(changePct) >= 0;

      insights.push({
        id: 'insight_temporal_trend',
        category: 'TRENDS',
        title: `${Math.abs(Number(changePct))}% ${isPositive ? 'Growth' : 'Decline'} in ${num.name.replace(/_/g, ' ')} Across Timeframe`,
        description: `Average ${num.name.replace(/_/g, ' ')} moved from ${firstAvg.toFixed(2)} in the first half of the timeline to ${secondAvg.toFixed(2)} in the second half.`,
        metric: `${isPositive ? '+' : ''}${changePct}%`,
        traceableData: `Time interval split at record ${half}. Period 1 mean: ${firstAvg.toFixed(2)}, Period 2 mean: ${secondAvg.toFixed(2)}`,
        importance: Math.abs(Number(changePct)) > 15 ? 'high' : 'medium'
      });
    }
  }

  return insights;
}
