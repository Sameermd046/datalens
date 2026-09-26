import { ChartConfig, ColumnProfile, KPICardData } from '../types/dataset';

export function generateDynamicKPIs(
  data: Record<string, any>[],
  columns: ColumnProfile[],
  totalOriginalRows: number
): KPICardData[] {
  const kpis: KPICardData[] = [];
  const currentCount = data.length;

  // 1. Record Volume KPI
  kpis.push({
    id: 'kpi_total_records',
    label: 'Active Records',
    value: currentCount.toLocaleString(),
    subtext: totalOriginalRows !== currentCount
      ? `Filtered (${((currentCount / (totalOriginalRows || 1)) * 100).toFixed(0)}% of ${totalOriginalRows.toLocaleString()})`
      : `${columns.length} columns active`,
    category: 'count'
  });

  if (data.length === 0) return kpis;

  // Identify high-priority numeric columns
  const numericCols = columns.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal');
  const categoricalCols = columns.filter(c => c.detectedType === 'string' && !c.isPotentialId);

  // Score numeric columns by relevance (e.g. sales, revenue, salary, spend, price, amount, total)
  const prioritizedNumerics = [...numericCols].sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const scoreCol = (name: string) => {
      if (name.includes('sales') || name.includes('revenue') || name.includes('total')) return 100;
      if (name.includes('salary') || name.includes('spend') || name.includes('cost') || name.includes('price')) return 80;
      if (name.includes('score') || name.includes('rating') || name.includes('experience') || name.includes('tenure')) return 60;
      if (name.includes('quantity') || name.includes('count') || name.includes('ticket')) return 50;
      return 10;
    };
    return scoreCol(bName) - scoreCol(aName);
  });

  // Calculate dynamic primary metric KPI
  if (prioritizedNumerics.length > 0) {
    const primaryNum = prioritizedNumerics[0];
    const vals = data
      .map(r => Number(r[primaryNum.name]))
      .filter(v => !isNaN(v) && v !== null);

    if (vals.length > 0) {
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / vals.length;
      const lowerName = primaryNum.name.toLowerCase();
      const isMonetary = lowerName.includes('sales') || lowerName.includes('revenue') || lowerName.includes('price') || lowerName.includes('salary') || lowerName.includes('spend') || lowerName.includes('cost') || lowerName.includes('amount');
      const isRatingOrScore = lowerName.includes('rating') || lowerName.includes('score');

      const formatVal = (num: number) => {
        if (isMonetary) {
          if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
          if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
          return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return isRatingOrScore ? num.toFixed(2) : Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2);
      };

      // Sum KPI (for totals, revenue, spend, volume)
      if (!isRatingOrScore) {
        kpis.push({
          id: `kpi_sum_${primaryNum.name}`,
          label: `Total ${formatLabel(primaryNum.name)}`,
          value: formatVal(sum),
          subtext: `Avg: ${formatVal(avg)} · Max: ${formatVal(Math.max(...vals))}`,
          category: 'financial'
        });
      }

      // Average KPI
      kpis.push({
        id: `kpi_avg_${primaryNum.name}`,
        label: `Avg ${formatLabel(primaryNum.name)}`,
        value: formatVal(avg),
        subtext: `Min ${formatVal(Math.min(...vals))} — Max ${formatVal(Math.max(...vals))}`,
        category: 'average'
      });
    }
  }

  // Secondary numeric KPI
  if (prioritizedNumerics.length > 1) {
    const secNum = prioritizedNumerics[1];
    const vals = data
      .map(r => Number(r[secNum.name]))
      .filter(v => !isNaN(v) && v !== null);

    if (vals.length > 0) {
      const sum = vals.reduce((a, b) => a + b, 0);
      const avg = sum / vals.length;
      const lowerName = secNum.name.toLowerCase();
      const isMonetary = lowerName.includes('salary') || lowerName.includes('price') || lowerName.includes('spend') || lowerName.includes('cost');
      const isRatingOrScore = lowerName.includes('rating') || lowerName.includes('score');

      const formatVal = (num: number) => {
        if (isMonetary) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        return isRatingOrScore ? `${num.toFixed(1)} / 5.0` : num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toFixed(1);
      };

      kpis.push({
        id: `kpi_sec_${secNum.name}`,
        label: isRatingOrScore ? `Mean ${formatLabel(secNum.name)}` : `Avg ${formatLabel(secNum.name)}`,
        value: formatVal(avg),
        subtext: isRatingOrScore ? `Distribution median: ${vals.sort((a,b)=>a-b)[Math.floor(vals.length/2)].toFixed(1)}` : `Total sum: ${sum.toLocaleString()}`,
        category: 'metric'
      });
    }
  }

  // Categorical leader KPI
  if (categoricalCols.length > 0) {
    const topCatCol = categoricalCols[0];
    const counts = new Map<string, number>();
    for (const r of data) {
      const val = String(r[topCatCol.name] ?? '').trim();
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    }
    let topVal = '';
    let maxC = 0;
    for (const [v, c] of counts.entries()) {
      if (c > maxC) {
        maxC = c;
        topVal = v;
      }
    }
    if (topVal) {
      const pct = ((maxC / data.length) * 100).toFixed(1);
      kpis.push({
        id: `kpi_top_${topCatCol.name}`,
        label: `Top ${formatLabel(topCatCol.name)}`,
        value: topVal.length > 18 ? topVal.slice(0, 16) + '...' : topVal,
        subtext: `${maxC} records (${pct}% concentration)`,
        category: 'metric'
      });
    }
  }

  return kpis.slice(0, 5);
}

function formatLabel(str: string): string {
  return str
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function buildDynamicCharts(
  data: Record<string, any>[],
  columns: ColumnProfile[]
): ChartConfig[] {
  if (!data || data.length === 0 || !columns || columns.length === 0) return [];

  const charts: ChartConfig[] = [];
  const numericCols = columns.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal');
  const categoricalCols = columns.filter(c => c.detectedType === 'string' && !c.isPotentialId && (c.uniqueCount <= 40 || data.length < 50));
  const dateCols = columns.filter(c => c.detectedType === 'date' || c.detectedType === 'datetime');

  // Chart Strategy 1: Categorical + Numeric (Bar / Column chart)
  if (categoricalCols.length > 0 && numericCols.length > 0) {
    const cat = categoricalCols[0];
    const num = numericCols[0];

    const groupMap = new Map<string, { sum: number; count: number }>();
    for (const r of data) {
      const k = String(r[cat.name] ?? 'Unknown').trim();
      const val = Number(r[num.name]) || 0;
      const current = groupMap.get(k) || { sum: 0, count: 0 };
      current.sum += val;
      current.count += 1;
      groupMap.set(k, current);
    }

    const chartData = Array.from(groupMap.entries())
      .map(([key, val]) => ({
        name: key,
        value: Number(val.sum.toFixed(2)),
        average: Number((val.sum / val.count).toFixed(2)),
        count: val.count
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    charts.push({
      id: `chart_cat_num_${cat.name}_${num.name}`,
      title: `${formatLabel(num.name)} by ${formatLabel(cat.name)}`,
      type: 'bar',
      reason: `"${formatLabel(cat.name)}" is categorical and "${formatLabel(num.name)}" is numeric, so an aggregate comparison ranking highlights top contributors.`,
      xAxisKey: 'name',
      yAxisKey: 'value',
      aggregation: 'sum',
      data: chartData
    });
  }

  // Chart Strategy 2: Date + Numeric (Chronological Trend / Line chart)
  if (dateCols.length > 0 && numericCols.length > 0) {
    const dt = dateCols[0];
    const num = numericCols[0];

    const dateMap = new Map<string, { sum: number; count: number }>();
    for (const r of data) {
      const dVal = String(r[dt.name] ?? '').split('T')[0];
      if (dVal && !isNaN(Date.parse(dVal))) {
        const val = Number(r[num.name]) || 0;
        const current = dateMap.get(dVal) || { sum: 0, count: 0 };
        current.sum += val;
        current.count += 1;
        dateMap.set(dVal, current);
      }
    }

    const sortedDates = Array.from(dateMap.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );

    const trendData = sortedDates.slice(0, 30).map(([dateStr, val]) => ({
      date: dateStr,
      value: Number(val.sum.toFixed(2)),
      average: Number((val.sum / (val.count || 1)).toFixed(2)),
      count: val.count
    }));

    if (trendData.length > 1) {
      charts.push({
        id: `chart_date_trend_${dt.name}`,
        title: `${formatLabel(num.name)} Trend over Time (${formatLabel(dt.name)})`,
        type: 'line',
        reason: `"${formatLabel(dt.name)}" is a temporal sequence and "${formatLabel(num.name)}" is a continuous metric, allowing time-series trajectory tracking.`,
        xAxisKey: 'date',
        yAxisKey: 'value',
        aggregation: 'sum',
        data: trendData
      });
    }
  }

  // Chart Strategy 3: Categorical Distribution (Donut / Segmented chart)
  const pieCategory = categoricalCols.find(c => c.uniqueCount >= 2 && c.uniqueCount <= 8) || categoricalCols[0];
  if (pieCategory) {
    const countMap = new Map<string, number>();
    for (const r of data) {
      const k = String(r[pieCategory.name] ?? 'Unknown').trim();
      if (k) countMap.set(k, (countMap.get(k) || 0) + 1);
    }
    const pieData = Array.from(countMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Number(((count / (data.length || 1)) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    charts.push({
      id: `chart_donut_${pieCategory.name}`,
      title: `${formatLabel(pieCategory.name)} Share & Distribution`,
      type: 'donut',
      reason: `"${formatLabel(pieCategory.name)}" contains ${pieData.length} distinct groupings, making a proportional share breakdown optimal.`,
      xAxisKey: 'name',
      yAxisKey: 'count',
      data: pieData
    });
  }

  // Chart Strategy 4: Two Numeric Columns (Scatter / Correlation or Dual Metric)
  if (numericCols.length >= 2) {
    const xNum = numericCols[0];
    const yNum = numericCols[1];

    const scatterData = data
      .filter(r => r[xNum.name] !== null && r[yNum.name] !== null)
      .map((r, i) => ({
        index: i + 1,
        [xNum.name]: Number(r[xNum.name]),
        [yNum.name]: Number(r[yNum.name]),
        label: r.order_id || r.customer_id || r.emp_id || r.customer_name || r.full_name || `#${i + 1}`
      }))
      .slice(0, 40);

    charts.push({
      id: `chart_scatter_${xNum.name}_${yNum.name}`,
      title: `${formatLabel(yNum.name)} vs. ${formatLabel(xNum.name)} Relationship`,
      type: 'scatter',
      reason: `Both "${formatLabel(xNum.name)}" and "${formatLabel(yNum.name)}" are numeric variables, enabling scatter correlation and cluster detection.`,
      xAxisKey: xNum.name,
      yAxisKey: yNum.name,
      data: scatterData
    });
  }

  // Chart Strategy 5: Numeric Distribution / Histogram (for primary metric)
  if (numericCols.length > 0) {
    const targetCol = numericCols[numericCols.length > 1 ? 1 : 0];
    const vals = data
      .map(r => Number(r[targetCol.name]))
      .filter(v => !isNaN(v) && v !== null);

    if (vals.length >= 5) {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const bucketCount = 6;
      const step = (max - min) / bucketCount || 1;

      const buckets = Array.from({ length: bucketCount }, (_, i) => {
        const bStart = min + i * step;
        const bEnd = bStart + step;
        return {
          bin: `${bStart.toFixed(0)} - ${bEnd.toFixed(0)}`,
          count: 0
        };
      });

      for (const v of vals) {
        let bIdx = Math.floor((v - min) / step);
        if (bIdx >= bucketCount) bIdx = bucketCount - 1;
        if (bIdx >= 0) buckets[bIdx].count++;
      }

      charts.push({
        id: `chart_histogram_${targetCol.name}`,
        title: `${formatLabel(targetCol.name)} Distribution Frequency`,
        type: 'histogram',
        reason: `Displays density buckets for continuous variable "${formatLabel(targetCol.name)}" to evaluate skewness and modal concentration.`,
        xAxisKey: 'bin',
        yAxisKey: 'count',
        data: buckets
      });
    }
  }

  return charts;
}
