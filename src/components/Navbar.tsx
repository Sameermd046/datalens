import React from 'react';
import { Database, Download, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { ActiveTab } from '../types/dataset';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  datasetName: string | null;
  rowCount: number;
  filteredCount: number;
  qualityScore: number;
  onOpenExport: () => void;
  onResetWorkspace: () => void;
  onLoadSample: (id: string) => void;
  onRemoveDataset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  datasetName,
  rowCount,
  filteredCount,
  qualityScore,
  onOpenExport,
  onResetWorkspace,
  onLoadSample,
  onRemoveDataset
}) => {
  return (
    <header className="h-14 border-b border-slate-800 bg-[#0F172A] px-5 flex items-center justify-between z-20 shrink-0">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-100 tracking-tight">DataLens</span>
            <span className="text-xs text-blue-400 font-mono font-medium hidden sm:inline">v2.0</span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            Raw Data → Clean Data → Reliable Insights
          </p>
        </div>
      </div>

      {/* Zone 2: Active Dataset Status */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
        {datasetName ? (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-slate-200 truncate max-w-[180px]">{datasetName}</span>
            </div>
            <span className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {filteredCount.toLocaleString()} {filteredCount !== rowCount && `(of ${rowCount.toLocaleString()})`} rows
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-mono">
              Quality:{' '}
              <strong className={qualityScore >= 80 ? 'text-emerald-400' : qualityScore >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                {qualityScore}%
              </strong>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 italic">
            <span>No dataset active</span>
          </div>
        )}
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2">
        {/* Sample dataset selector dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-400 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 rounded-lg transition-colors cursor-pointer"
            title="Load sample dataset"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sample Datasets</span>
          </button>
          <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              1-Click Instant Test
            </div>
            <button
              onClick={() => onLoadSample('sales')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Retail Sales Data</span>
              <span className="text-[10px] text-slate-500 font-mono">30 rows</span>
            </button>
            <button
              onClick={() => onLoadSample('employee')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Employee HR Records</span>
              <span className="text-[10px] text-slate-500 font-mono">20 rows</span>
            </button>
            <button
              onClick={() => onLoadSample('customer')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center justify-between"
            >
              <span>SaaS Churn Analytics</span>
              <span className="text-[10px] text-slate-500 font-mono">15 rows</span>
            </button>
          </div>
        </div>

        {datasetName && (
          <>
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={onRemoveDataset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="Remove active dataset completely"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Remove Dataset</span>
            </button>

            <button
              onClick={onResetWorkspace}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset workspace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};
