import React, { useState } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Check,
  Calendar,
  Layers,
  ChevronDown,
  X,
  Search
} from 'lucide-react';
import { ColumnProfile, DataType, SlicerFilter } from '../types/dataset';

interface FiltersProps {
  columns: ColumnProfile[];
  filters: Record<string, SlicerFilter>;
  totalRows: number;
  filteredCount: number;
  onUpdateFilter: (colName: string, filter: SlicerFilter) => void;
  onResetFilters: () => void;
  dataset: Record<string, any>[];
}

export const Filters: React.FC<FiltersProps> = ({
  columns,
  filters,
  totalRows,
  filteredCount,
  onUpdateFilter,
  onResetFilters,
  dataset
}) => {
  const [activeColumns, setActiveColumns] = useState<string[]>(() => {
    // Default pick up to 4 most interesting columns (categorical, date, primary numeric)
    const interesting = columns
      .filter(c => !c.isPotentialId && !c.isConstant && c.uniqueCount > 1)
      .slice(0, 4)
      .map(c => c.name);
    return interesting.length > 0 ? interesting : columns.slice(0, 3).map(c => c.name);
  });

  const [searchCat, setSearchCat] = useState<Record<string, string>>({});

  const toggleColumnSlicer = (colName: string) => {
    if (activeColumns.includes(colName)) {
      setActiveColumns(activeColumns.filter(c => c !== colName));
      // deactivate filter
      const f = filters[colName];
      if (f) {
        onUpdateFilter(colName, { ...f, isActive: false });
      }
    } else {
      setActiveColumns([...activeColumns, colName]);
    }
  };

  const getDistinctValues = (colName: string): { val: string; count: number }[] => {
    const map = new Map<string, number>();
    for (const r of dataset) {
      const v = String(r[colName] ?? '').trim();
      if (v) map.set(v, (map.get(v) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([val, count]) => ({ val, count }))
      .sort((a, b) => b.count - a.count);
  };

  const activeFiltersCount = Object.values(filters).filter(f => f.isActive).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Ledger: Record Retention Counter */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Dynamic Dataset Slicers
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Dynamic Filter Workbench</span>
              {activeFiltersCount > 0 && (
                <span className="text-xs font-mono font-normal text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  {activeFiltersCount} Filter{activeFiltersCount > 1 ? 's' : ''} Active
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
              <span className="text-slate-400">Showing: </span>
              <strong className="text-emerald-400">{filteredCount.toLocaleString()}</strong>
              <span className="text-slate-500"> of {totalRows.toLocaleString()} records </span>
              <span className="text-blue-400 font-semibold">
                ({((filteredCount / (totalRows || 1)) * 100).toFixed(1)}%)
              </span>
            </div>

            <button
              onClick={onResetFilters}
              disabled={activeFiltersCount === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeFiltersCount > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Column Slicer Activation Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Toggle Active Slicer Controls for This Dataset
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {columns.map(col => {
              const isTurnedOn = activeColumns.includes(col.name);
              const hasFilterActive = filters[col.name]?.isActive;

              return (
                <button
                  key={col.name}
                  onClick={() => toggleColumnSlicer(col.name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isTurnedOn
                      ? hasFilterActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                      : 'bg-slate-950/60 text-slate-500 hover:text-slate-300 border border-slate-800/80'
                  }`}
                >
                  <span>{col.name}</span>
                  <span className="text-[10px] opacity-70 font-mono">({col.detectedType})</span>
                  {hasFilterActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Slicer Controls Generated from Schema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeColumns.map(colName => {
          const colProfile = columns.find(c => c.name === colName);
          if (!colProfile) return null;

          const filter = filters[colName] || {
            column: colName,
            type: colProfile.detectedType,
            isActive: false
          };

          const type = colProfile.detectedType;

          // 1. Categorical Slicer (Multi-select dropdown with counts)
          if (type === 'string') {
            const distinct = getDistinctValues(colName);
            const query = searchCat[colName] || '';
            const filteredDistinct = distinct.filter(d => d.val.toLowerCase().includes(query.toLowerCase()));
            const selectedList = filter.selectedCategories || [];

            const toggleCategory = (catVal: string) => {
              const exists = selectedList.includes(catVal);
              const next = exists ? selectedList.filter(c => c !== catVal) : [...selectedList, catVal];
              onUpdateFilter(colName, {
                ...filter,
                selectedCategories: next,
                isActive: next.length > 0
              });
            };

            const selectAll = () => {
              onUpdateFilter(colName, {
                ...filter,
                selectedCategories: [],
                isActive: false
              });
            };

            return (
              <div
                key={colName}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-sans">{colName}</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900/50">
                      Categorical
                    </span>
                  </div>

                  {distinct.length > 5 && (
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={query}
                        onChange={e => setSearchCat({ ...searchCat, [colName]: e.target.value })}
                        placeholder={`Filter ${distinct.length} options...`}
                        className="w-full pl-7 pr-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                    {filteredDistinct.slice(0, 20).map(d => {
                      const isChecked = selectedList.includes(d.val);
                      return (
                        <div
                          key={d.val}
                          onClick={() => toggleCategory(d.val)}
                          className={`flex items-center justify-between px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                            isChecked ? 'bg-blue-600/20 text-blue-300 font-medium' : 'hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-blue-600 border-blue-500' : 'border-slate-700 bg-slate-950'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <span className="truncate">{d.val}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {selectedList.length > 0 ? `${selectedList.length} selected` : 'All selected'}
                  </span>
                  {selectedList.length > 0 && (
                    <button
                      onClick={selectAll}
                      className="text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // 2. Numeric Slicer (Min - Max Dual Range / Controls)
          if (type === 'integer' || type === 'decimal') {
            const minBound = colProfile.min ?? 0;
            const maxBound = colProfile.max ?? 100;
            const curMin = filter.minNumeric ?? minBound;
            const curMax = filter.maxNumeric ?? maxBound;

            const handleMinChange = (val: number) => {
              onUpdateFilter(colName, {
                ...filter,
                minNumeric: val,
                maxNumeric: curMax,
                isActive: val > minBound || curMax < maxBound
              });
            };

            const handleMaxChange = (val: number) => {
              onUpdateFilter(colName, {
                ...filter,
                minNumeric: curMin,
                maxNumeric: val,
                isActive: curMin > minBound || val < maxBound
              });
            };

            const resetRange = () => {
              onUpdateFilter(colName, {
                ...filter,
                minNumeric: minBound,
                maxNumeric: maxBound,
                isActive: false
              });
            };

            return (
              <div
                key={colName}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-sans">{colName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900/50">
                      Numeric Range
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                      <span>Min: {curMin.toLocaleString()}</span>
                      <span>Max: {curMax.toLocaleString()}</span>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="range"
                        min={minBound}
                        max={maxBound}
                        step={type === 'decimal' ? (maxBound - minBound) / 100 : 1}
                        value={curMin}
                        onChange={e => handleMinChange(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                      />
                      <input
                        type="range"
                        min={minBound}
                        max={maxBound}
                        step={type === 'decimal' ? (maxBound - minBound) / 100 : 1}
                        value={curMax}
                        onChange={e => handleMaxChange(Number(e.target.value))}
                        className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">
                    Bounds: [{minBound.toLocaleString()} – {maxBound.toLocaleString()}]
                  </span>
                  {(curMin > minBound || curMax < maxBound) && (
                    <button
                      onClick={resetRange}
                      className="text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Reset Range
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // 3. Date Slicer (Start - End date range selector)
          if (type === 'date' || type === 'datetime') {
            const minDate = colProfile.minDate || '2026-01-01';
            const maxDate = colProfile.maxDate || '2026-12-31';
            const startDate = filter.startDate || minDate;
            const endDate = filter.endDate || maxDate;

            return (
              <div
                key={colName}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-sans">{colName}</span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-900/50">
                      Date Range
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        min={minDate}
                        max={maxDate}
                        onChange={e => {
                          onUpdateFilter(colName, {
                            ...filter,
                            startDate: e.target.value,
                            endDate,
                            isActive: e.target.value > minDate || endDate < maxDate
                          });
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 uppercase font-mono">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        min={minDate}
                        max={maxDate}
                        onChange={e => {
                          onUpdateFilter(colName, {
                            ...filter,
                            startDate,
                            endDate: e.target.value,
                            isActive: startDate > minDate || e.target.value < maxDate
                          });
                        }}
                        className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{minDate} → {maxDate}</span>
                  {(startDate > minDate || endDate < maxDate) && (
                    <button
                      onClick={() => {
                        onUpdateFilter(colName, {
                          ...filter,
                          startDate: minDate,
                          endDate: maxDate,
                          isActive: false
                        });
                      }}
                      className="text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      Reset Date
                    </button>
                  )}
                </div>
              </div>
            );
          }

          // 4. Boolean Slicer
          if (type === 'boolean') {
            const currentBool = filter.booleanValue;

            return (
              <div
                key={colName}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 font-sans">{colName}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-900/50">
                      Boolean
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => onUpdateFilter(colName, { ...filter, booleanValue: null, isActive: false })}
                      className={`py-1.5 rounded text-xs font-medium transition-colors ${
                        currentBool === null || currentBool === undefined
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => onUpdateFilter(colName, { ...filter, booleanValue: true, isActive: true })}
                      className={`py-1.5 rounded text-xs font-medium transition-colors ${
                        currentBool === true
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      True
                    </button>
                    <button
                      onClick={() => onUpdateFilter(colName, { ...filter, booleanValue: false, isActive: true })}
                      className={`py-1.5 rounded text-xs font-medium transition-colors ${
                        currentBool === false
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      False
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 font-mono">
                  State: {currentBool === null || currentBool === undefined ? 'Unfiltered' : String(currentBool)}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
};
