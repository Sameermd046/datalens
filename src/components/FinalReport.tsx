import React from 'react';
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Database
} from 'lucide-react';
import {
  CleaningStep,
  ColumnProfile,
  DataInsight,
  DataQualityReport,
  DataType,
  FinalReportData
} from '../types/dataset';
import { generateFinalReport } from '../utils/reportGenerator';
import { triggerPrintReport } from '../utils/exportUtils';

interface FinalReportProps {
  datasetName: string;
  originalData: Record<string, any>[];
  cleanedData: Record<string, any>[];
  filteredData: Record<string, any>[];
  columns: ColumnProfile[];
  qualityReport: DataQualityReport;
  cleaningSteps: CleaningStep[];
  typeChanges: { column: string; from: DataType; to: DataType }[];
  insights: DataInsight[];
}

export const FinalReport: React.FC<FinalReportProps> = ({
  datasetName,
  originalData,
  cleanedData,
  filteredData,
  columns,
  qualityReport,
  cleaningSteps,
  typeChanges,
  insights
}) => {
  const report: FinalReportData = generateFinalReport(
    datasetName,
    originalData,
    cleanedData,
    filteredData,
    columns,
    qualityReport,
    cleaningSteps,
    typeChanges,
    insights
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between print:hidden">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Document Generation
          </span>
          <h2 className="text-base font-bold text-slate-100">Executive Dataset Dossier</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerPrintReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Document Sheet */}
      <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-8 sm:p-12 space-y-8 shadow-xl text-slate-200 print:bg-white print:text-black print:border-0 print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white print:text-black">
                DataLens
              </span>
              <span className="text-xs font-mono text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40">
                Official Analysis Report
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 print:text-gray-600">
              {report.generatedAt}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 print:text-black pt-2">
            Dataset Assessment & Hygiene Audit: {report.datasetName}
          </h1>
          <p className="text-xs text-slate-400 print:text-gray-600">
            Automated single dataset ingestion, structural profiling, hygiene remediation, and exploratory intelligence.
          </p>
        </div>

        {/* Section 1: Dataset Overview */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            01. Dataset Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 print:border-gray-300">
              <span className="text-[10px] text-slate-500 block">SOURCE DATASET</span>
              <span className="font-bold text-slate-200 print:text-black truncate block mt-0.5">
                {report.datasetName}
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 print:border-gray-300">
              <span className="text-[10px] text-slate-500 block">RAW RECORDS</span>
              <span className="font-bold text-slate-200 print:text-black block mt-0.5">
                {report.originalRowCount.toLocaleString()} Rows
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 print:border-gray-300">
              <span className="text-[10px] text-slate-500 block">DIMENSION FIELDS</span>
              <span className="font-bold text-slate-200 print:text-black block mt-0.5">
                {report.columnCount} Columns
              </span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 print:border-gray-300">
              <span className="text-[10px] text-slate-500 block">FILTER RETENTION</span>
              <span className="font-bold text-emerald-400 block mt-0.5">
                {report.filteredRowCount.toLocaleString()} ({((report.filteredRowCount / (report.originalRowCount || 1)) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </section>

        {/* Section 2: Data Quality Assessment */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            02. Data Quality Rating
          </h3>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-center gap-6 print:border-gray-300">
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {report.qualityScore} <span className="text-xs text-slate-400 font-sans">/ 100</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-100 print:text-black">
                Rating: {report.qualityRating}
              </div>
              <p className="text-slate-400 print:text-gray-600">
                Synthesized from completeness ratio, duplication frequency, mathematical variance validity, and text consistency.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 & 4: Cleaning Performed & Data Type Changes */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            03. Cleaning & Type Casting Audit
          </h3>
          <div className="space-y-2">
            {report.cleaningSteps.length > 0 ? (
              report.cleaningSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs font-mono flex items-center justify-between"
                >
                  <span className="text-slate-300">
                    #{idx + 1} {step.description}
                  </span>
                  <span className="text-slate-500">
                    {step.rowsBefore} → {step.rowsAfter} rows ({step.timestamp})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No custom row mutations applied; baseline records analyzed directly.</p>
            )}

            {report.typeChanges.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">Type Cast Mutations:</span>
                {report.typeChanges.map((tc, idx) => (
                  <div key={idx} className="text-xs font-mono text-slate-400">
                    • Column "{tc.column}": cast from {tc.from} to {tc.to}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Important Statistics */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            04. Key Distribution Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            {report.summaryStats.map((st, i) => (
              <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg print:border-gray-300">
                <span className="text-[10px] text-slate-500 block truncate">{st.metric}</span>
                <span className="font-bold text-slate-200 print:text-black block mt-1">{st.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 & 7: Key Trends & Important Visualizations */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            05. Core Trends & Visual Architecture
          </h3>
          <div className="space-y-2 text-xs">
            {report.keyTrends.map((trend, i) => (
              <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 print:text-gray-800">{trend}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Traceable Insights */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            06. Traceable Statistical Insights
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {report.insights.slice(0, 6).map(ins => (
              <div key={ins.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 print:text-black">{ins.title}</span>
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 px-1 rounded">
                    {ins.category}
                  </span>
                </div>
                <p className="text-slate-400 print:text-gray-700">{ins.description}</p>
                <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                  Proof: {ins.traceableData}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 9 & 10: Data Problems & Recommended Changes */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            07. Data Problems & Prescriptive Recommendations
          </h3>
          <div className="space-y-3 text-xs">
            {report.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 print:border-gray-300">
                <div className="text-slate-300 font-mono font-medium">
                  {rec.fact}
                </div>
                <div className="text-blue-300 font-sans bg-blue-950/40 p-2 rounded border border-blue-900/40">
                  {rec.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 11: Final Summary */}
        <section className="space-y-3 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800/80 pb-1 font-mono">
            08. Executive Conclusion
          </h3>
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans print:border-gray-300">
            {report.executiveSummary}
          </div>
        </section>
      </div>
    </div>
  );
};
