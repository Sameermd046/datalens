export type DataType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime';

export interface ColumnProfile {
  name: string;
  detectedType: DataType;
  currentType: DataType;
  totalCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  duplicateCount: number;
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  sum?: number;
  // Categorical stats
  topValues?: { value: string; count: number; percentage: number }[];
  // Date stats
  minDate?: string;
  maxDate?: string;
  // Flags & characteristics
  isPotentialId: boolean;
  isConstant: boolean;
  isHighCardinality: boolean;
  hasWhitespace: boolean;
  hasOutliers: boolean;
  outlierCount: number;
  hasNegativeValues: boolean;
  qualityStatus: 'good' | 'warning' | 'danger';
  issues: string[];
}

export interface DataIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  type:
    | 'missing_values'
    | 'duplicate_rows'
    | 'duplicate_ids'
    | 'empty_column'
    | 'constant_column'
    | 'outliers'
    | 'invalid_dates'
    | 'trailing_whitespace'
    | 'high_cardinality'
    | 'negative_values';
  column?: string;
  title: string;
  description: string;
  affectedCount: number;
  affectedPercentage: number;
  recommendation: string;
}

export interface DataQualityReport {
  overallScore: number; // 0 - 100
  rating: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  breakdown: {
    completeness: number; // missing values factor
    uniqueness: number;   // duplicates factor
    validity: number;     // invalid & outlier factor
    consistency: number;  // whitespace & types factor
  };
  explanation: string[];
  issues: DataIssue[];
}

export interface CleaningStep {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  rowsBefore: number;
  rowsAfter: number;
  cellsModified: number;
}

export interface TypeConversionResult {
  column: string;
  targetType: DataType;
  successCount: number;
  failureCount: number;
  failureSamples: string[];
}

export interface SlicerFilter {
  column: string;
  type: DataType;
  selectedCategories?: string[]; // for categorical
  minNumeric?: number;
  maxNumeric?: number;
  startDate?: string;
  endDate?: string;
  booleanValue?: boolean | null;
  isActive: boolean;
}

export interface KPICardData {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
  category: 'metric' | 'count' | 'average' | 'financial' | 'quality';
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'column' | 'line' | 'area' | 'donut' | 'scatter' | 'histogram';
  reason: string;
  xAxisKey: string;
  yAxisKey?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  data: any[];
}

export interface DataInsight {
  id: string;
  category:
    | 'DATA QUALITY'
    | 'TRENDS'
    | 'DISTRIBUTION'
    | 'OUTLIERS'
    | 'CORRELATIONS'
    | 'ANOMALIES'
    | 'BUSINESS OBSERVATIONS';
  title: string;
  description: string;
  metric?: string;
  traceableData: string;
  importance: 'high' | 'medium' | 'info';
}

export interface FinalReportData {
  generatedAt: string;
  datasetName: string;
  originalRowCount: number;
  cleanedRowCount: number;
  filteredRowCount: number;
  columnCount: number;
  qualityScore: number;
  qualityRating: string;
  cleaningSteps: CleaningStep[];
  typeChanges: { column: string; from: DataType; to: DataType }[];
  summaryStats: { metric: string; value: string }[];
  keyTrends: string[];
  topVisualizations: { title: string; explanation: string }[];
  insights: DataInsight[];
  detectedProblems: DataIssue[];
  recommendations: { fact: string; recommendation: string }[];
  executiveSummary: string;
}

export type ActiveTab =
  | 'import'
  | 'check'
  | 'clean'
  | 'types'
  | 'sql'
  | 'filters'
  | 'dashboard'
  | 'insights'
  | 'report';
