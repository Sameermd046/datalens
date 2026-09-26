import React from 'react';
import {
  UploadCloud,
  ShieldCheck,
  Sparkles,
  Binary,
  Terminal,
  SlidersHorizontal,
  LayoutDashboard,
  Lightbulb,
  FileText,
  Cpu,
  Trash2
} from 'lucide-react';
import { ActiveTab } from '../types/dataset';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  hasDataset: boolean;
  issueCount: number;
  filterCount: number;
  onRemoveDataset?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  hasDataset,
  issueCount,
  filterCount,
  onRemoveDataset
}) => {
  const datasetNav = [
    { id: 'import' as ActiveTab, label: 'Import Dataset', icon: UploadCloud },
    { id: 'check' as ActiveTab, label: 'Data Check', icon: ShieldCheck, badge: issueCount > 0 ? issueCount : undefined },
    { id: 'clean' as ActiveTab, label: 'Clean Data', icon: Sparkles },
    { id: 'types' as ActiveTab, label: 'Data Types', icon: Binary }
  ];

  const analyzeNav = [
    { id: 'sql' as ActiveTab, label: 'SQL Query', icon: Terminal },
    { id: 'filters' as ActiveTab, label: 'Filters / Slicers', icon: SlidersHorizontal, badge: filterCount > 0 ? filterCount : undefined },
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'insights' as ActiveTab, label: 'Insights', icon: Lightbulb },
    { id: 'report' as ActiveTab, label: 'Final Report', icon: FileText }
  ];

  return (
    <aside className="w-60 bg-[#0B0F17] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="py-4 px-3 space-y-6 overflow-y-auto">
        {/* Section: DATASET */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Dataset
          </div>
          <nav className="space-y-1">
            {datasetNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const disabled = !hasDataset && item.id !== 'import';

              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && setActiveTab(item.id)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : disabled ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {hasDataset && onRemoveDataset && (
            <div className="pt-2 px-1">
              <button
                onClick={onRemoveDataset}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer"
                title="Remove current dataset from memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Dataset</span>
              </button>
            </div>
          )}
        </div>

        {/* Section: ANALYZE */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Analyze
          </div>
          <nav className="space-y-1">
            {analyzeNav.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const disabled = !hasDataset;

              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && setActiveTab(item.id)}
                  disabled={disabled}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                      : disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : disabled ? 'text-slate-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom status badge */}
      <div className="p-3 border-t border-slate-800 bg-[#0E131F]">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <div className="truncate">
            <span className="font-medium text-slate-300">Engine Active</span>
            <div className="text-[10px] text-slate-500 font-mono">DuckDB / In-Memory SQL</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
