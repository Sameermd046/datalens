import React, { useState } from 'react';
import { Lightbulb, Database, Activity, CheckCircle, TrendingUp, Filter } from 'lucide-react';
import { ColumnProfile, DataInsight } from '../types/dataset';
import { generateTraceableInsights } from '../utils/insightsEngine';

interface InsightsProps {
  filteredData: Record<string, any>[];
  columns: ColumnProfile[];
  duplicateRowCount: number;
}

export const Insights: React.FC<InsightsProps> = ({
  filteredData,
  columns,
  duplicateRowCount
}) => {
  const insights: DataInsight[] = generateTraceableInsights(filteredData, columns, duplicateRowCount);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    'ALL',
    'DATA QUALITY',
    'BUSINESS OBSERVATIONS',
    'DISTRIBUTION',
    'TRENDS',
    'OUTLIERS',
    'CORRELATIONS'
  ];

  const filteredInsights = selectedCategory === 'ALL'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Ledger Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Empirical Calculation Engine
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Traceable Mathematical Insights</span>
              <span className="text-xs font-mono font-normal text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                100% Data-Backed · Zero Hallucination
              </span>
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {insights.length} Empirical Insights Generated
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-slate-800">
          {categories.map(cat => {
            const count = cat === 'ALL' ? insights.length : insights.filter(i => i.category === cat).length;
            if (count === 0 && cat !== 'ALL') return null;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] font-mono opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInsights.map(insight => (
          <div
            key={insight.id}
            className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/50">
                  {insight.category}
                </span>
                {insight.metric && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
                    {insight.metric}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-100">{insight.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{insight.description}</p>
            </div>

            {/* Traceable Mathematical Proof Footnote */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-950/60 p-2 rounded border border-slate-800/80">
                <Database className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug truncate">
                  <strong className="text-slate-400">Audit Trail: </strong>
                  {insight.traceableData}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
