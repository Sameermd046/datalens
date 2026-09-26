import {
  CleaningStep,
  ColumnProfile,
  DataInsight,
  DataIssue,
  DataQualityReport,
  DataType,
  FinalReportData
} from '../types/dataset';

export function generateFinalReport(
  datasetName: string,
  originalData: Record<string, any>[],
  cleanedData: Record<string, any>[],
  filteredData: Record<string, any>[],
  columns: ColumnProfile[],
  qualityReport: DataQualityReport,
  cleaningSteps: CleaningStep[],
  typeChanges: { column: string; from: DataType; to: DataType }[],
  insights: DataInsight[]
): FinalReportData {
  const originalRowCount = originalData.length;
  const cleanedRowCount = cleanedData.length;
  const filteredRowCount = filteredData.length;
  const columnCount = columns.length;

  // Important statistics summary
  const summaryStats: { metric: string; value: string }[] = [
    { metric: 'Initial Ingestion Volume', value: `${originalRowCount.toLocaleString()} rows` },
    { metric: 'Current Filtered Volume', value: `${filteredRowCount.toLocaleString()} rows (${((filteredRowCount / (cleanedRowCount || 1)) * 100).toFixed(0)}% retention)` },
    { metric: 'Active Dimension Fields', value: `${columnCount} columns` },
    { metric: 'Data Quality Rating', value: `${qualityReport.overallScore}/100 (${qualityReport.rating})` }
  ];

  const numericCols = columns.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal');
  for (const nc of numericCols.slice(0, 3)) {
    if (nc.mean !== undefined && nc.sum !== undefined) {
      summaryStats.push({
        metric: `${nc.name} (Total / Mean)`,
        value: `${nc.sum.toLocaleString()} (Mean: ${nc.mean.toLocaleString()})`
      });
    }
  }

  // Key Trends
  const trendInsights = insights.filter(i => i.category === 'TRENDS' || i.category === 'BUSINESS OBSERVATIONS');
  const keyTrends = trendInsights.length > 0
    ? trendInsights.map(t => `${t.title}: ${t.description}`)
    : ['Data distribution across primary dimensions remains stable without extreme skew across recorded cycles.'];

  // Top Visualizations
  const topVisualizations = [
    {
      title: 'Categorical Dimensional Breakdown',
      explanation: 'Evaluates distribution density across dominant classes to identify key segments.'
    },
    {
      title: 'Primary Metric Trajectory',
      explanation: 'Monitors continuity and fluctuations of core numeric indicators.'
    },
    {
      title: 'Variance & Outlier Boundaries',
      explanation: 'Flags dispersion limits and 1.5× IQR thresholds for high-leverage records.'
    }
  ];

  // Recommendations with strict DATA FACT vs RECOMMENDATION separation
  const recommendations: { fact: string; recommendation: string }[] = [];

  if (qualityReport.issues.length > 0) {
    for (const issue of qualityReport.issues) {
      recommendations.push({
        fact: `[DATA FACT] ${issue.title} — ${issue.description}`,
        recommendation: `[RECOMMENDATION] ${issue.recommendation}`
      });
    }
  } else {
    recommendations.push({
      fact: `[DATA FACT] No structural anomalies or missing attributes detected across ${originalRowCount} rows.`,
      recommendation: '[RECOMMENDATION] Maintain current ingestion format; no immediate corrective intervention required.'
    });
  }

  // Executive summary
  const executiveSummary = `DataLens analyzed "${datasetName}" comprising ${originalRowCount} original records and ${columnCount} attributes. The dataset scored an overall Data Quality Index of ${qualityReport.overallScore}/100 (${qualityReport.rating}), with ${cleaningSteps.length} automated cleaning procedures applied (resulting in ${cleanedRowCount} clean records). Analysis reveals high confidence in analytical readiness with ${qualityReport.issues.length} flagged quality observations addressed.`;

  return {
    generatedAt: new Date().toLocaleString(),
    datasetName,
    originalRowCount,
    cleanedRowCount,
    filteredRowCount,
    columnCount,
    qualityScore: qualityReport.overallScore,
    qualityRating: qualityReport.rating,
    cleaningSteps,
    typeChanges,
    summaryStats,
    keyTrends,
    topVisualizations,
    insights,
    detectedProblems: qualityReport.issues,
    recommendations,
    executiveSummary
  };
}
