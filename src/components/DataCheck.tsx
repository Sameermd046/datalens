import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  ArrowRight,
  Search,
  Filter
} from 'lucide-react';
import { ColumnProfile, DataQualityReport } from '../types/dataset';

interface DataCheckProps {
  columns: ColumnProfile[];
  qualityReport: DataQualityReport;
  totalRowCount: number;
  duplicateRowCount: number;
  onNavigateClean: () => void;
}

export const DataCheck: React.FC<DataCheckProps> = ({
  columns,
  qualityReport,
  totalRowCount,
  duplicateRowCount,
  onNavigateClean
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<ColumnProfile | null>(columns[0] || null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'danger' | 'warning' | 'good'>('all');

  const filteredColumns = columns.filter(col => {
    const matchesSearch = col.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || col.qualityStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Quality Score & Factor Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Quality Gauge */}
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border font-mono ${
              qualityReport.overallScore >= 80
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : qualityReport.overallScore >= 60
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
            }`}>
              <span className="text-2xl font-bold leading-none">{qualityReport.overallScore}</span>
              <span className="text-[10px] text-slate-400 font-sans mt-0.5">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-100">
                  Data Quality Index: {qualityReport.rating}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-medium ${
                  qualityReport.overallScore >= 80
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : qualityReport.overallScore >= 60
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {qualityReport.overallScore}% score
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Evaluated against completeness, record uniqueness, schema validity, and string consistency benchmarks across {totalRowCount.toLocaleString()} records.
              </p>
            </div>
          </div>

          {/* Clean Data Action CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateClean}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span>Remediate in Clean Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Score Pillars */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Completeness</span>
              <span className="font-mono text-slate-200">{qualityReport.breakdown.completeness}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${qualityReport.breakdown.completeness}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Uniqueness</span>
              <span className="font-mono text-slate-200">{qualityReport.breakdown.uniqueness}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${qualityReport.breakdown.uniqueness}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Validity</span>
              <span className="font-mono text-slate-200">{qualityReport.breakdown.validity}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${qualityReport.breakdown.validity}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Consistency</span>
              <span className="font-mono text-slate-200">{qualityReport.breakdown.consistency}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-500 h-1.5 rounded-full"
                style={{ width: `${qualityReport.breakdown.consistency}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detected Issues List */}
      {qualityReport.issues.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Detected Data Hygiene Issues ({qualityReport.issues.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qualityReport.issues.map((issue) => (
              <div
                key={issue.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      issue.severity === 'high' ? 'bg-rose-400' : issue.severity === 'medium' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    <span className="text-xs font-semibold text-slate-200">{issue.title}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {issue.affectedCount} rows ({issue.affectedPercentage}%)
                  </span>
                </div>
                <p className="text-xs text-slate-400">{issue.description}</p>
                <div className="text-[11px] text-blue-400/90 bg-blue-950/20 px-2 py-1 rounded border border-blue-900/30">
                  <strong className="text-blue-300">Action:</strong> {issue.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Column-by-Column Profiling Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        {/* Table Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search columns..."
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'all' ? 'bg-slate-800 text-slate-200 font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({columns.length})
              </button>
              <button
                onClick={() => setStatusFilter('danger')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'danger' ? 'bg-rose-950/50 text-rose-300 font-medium border border-rose-800/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Danger ({columns.filter(c => c.qualityStatus === 'danger').length})
              </button>
              <button
                onClick={() => setStatusFilter('warning')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'warning' ? 'bg-amber-950/50 text-amber-300 font-medium border border-amber-800/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Warning ({columns.filter(c => c.qualityStatus === 'warning').length})
              </button>
              <button
                onClick={() => setStatusFilter('good')}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === 'good' ? 'bg-emerald-950/50 text-emerald-300 font-medium border border-emerald-800/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Good ({columns.filter(c => c.qualityStatus === 'good').length})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing {filteredColumns.length} of {columns.length} columns
          </div>
        </div>

        {/* Data Quality Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 border-b border-slate-800 font-medium text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Column Name</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3">Missing</th>
                <th className="py-2.5 px-3">Unique</th>
                <th className="py-2.5 px-3">Stats / Top Values</th>
                <th className="py-2.5 px-3">Quality</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredColumns.map(col => {
                const isSelected = selectedColumn?.name === col.name;

                return (
                  <tr
                    key={col.name}
                    onClick={() => setSelectedColumn(col)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        {col.isPotentialId && (
                          <span className="text-[10px] font-mono px-1 rounded bg-blue-950 text-blue-400 border border-blue-800/50">
                            KEY
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-blue-400 font-medium">
                      {col.detectedType}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={col.nullPercentage > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                        {col.nullPercentage}%
                      </span>
                      <span className="text-slate-600 text-[11px] ml-1">({col.nullCount})</span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-300">
                      <span>{col.uniqueCount.toLocaleString()}</span>
                      <span className="text-slate-600 text-[11px] ml-1">({col.uniquePercentage}%)</span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-400 font-sans max-w-xs truncate">
                      {col.detectedType === 'integer' || col.detectedType === 'decimal' ? (
                        <span>
                          Avg: <strong className="text-slate-200 font-mono">{col.mean}</strong> · Min: {col.min} · Max: {col.max}
                        </span>
                      ) : col.topValues && col.topValues.length > 0 ? (
                        <span>
                          Top: <strong className="text-slate-200 font-mono">{col.topValues[0].value}</strong> ({col.topValues[0].percentage}%)
                        </span>
                      ) : col.minDate ? (
                        <span>
                          {col.minDate} → {col.maxDate}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                        col.qualityStatus === 'good'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : col.qualityStatus === 'warning'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      }`}>
                        {col.qualityStatus === 'good' ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                        <span className="capitalize">{col.qualityStatus}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedColumn(col);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-sans"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Column Deep-Dive Panel */}
      {selectedColumn && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">Column Deep-Dive</span>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span>{selectedColumn.name}</span>
                <span className="text-xs font-mono font-normal text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/50">
                  {selectedColumn.detectedType}
                </span>
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-400">
              {totalRowCount} rows profile
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 uppercase">Null Count</span>
              <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.nullCount}</div>
              <span className="text-[10px] text-slate-500 font-mono">{selectedColumn.nullPercentage}%</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-400 uppercase">Unique Values</span>
              <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.uniqueCount}</div>
              <span className="text-[10px] text-slate-500 font-mono">{selectedColumn.uniquePercentage}%</span>
            </div>

            {selectedColumn.mean !== undefined && (
              <>
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase">Mean (Average)</span>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.mean}</div>
                  <span className="text-[10px] text-slate-500 font-mono">Sum: {selectedColumn.sum?.toLocaleString()}</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase">Median</span>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.median}</div>
                  <span className="text-[10px] text-slate-500 font-mono">50th percentile</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase">Std Deviation</span>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.stdDev}</div>
                  <span className="text-[10px] text-slate-500 font-mono">Variance spread</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase">Range (Min - Max)</span>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">{selectedColumn.min} → {selectedColumn.max}</div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedColumn.hasOutliers ? `${selectedColumn.outlierCount} outliers` : 'No outliers'}
                  </span>
                </div>
              </>
            )}

            {selectedColumn.topValues && selectedColumn.topValues.length > 0 && (
              <div className="col-span-2 sm:col-span-4 md:col-span-6 bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Top Value Frequency</span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                  {selectedColumn.topValues.map((v, i) => (
                    <div key={i} className="bg-slate-900/60 p-2 rounded border border-slate-800 text-xs">
                      <div className="font-semibold text-slate-200 truncate">{v.value || '(empty)'}</div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-1">
                        <span>{v.count} rows</span>
                        <span className="text-blue-400">{v.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
