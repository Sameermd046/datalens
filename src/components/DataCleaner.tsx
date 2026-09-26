import React, { useState } from 'react';
import {
  Sparkles,
  Undo2,
  RotateCcw,
  Trash2,
  Scissors,
  Type,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { CleaningStep, ColumnProfile } from '../types/dataset';
import {
  removeDuplicateRows,
  removeDuplicatesByColumn,
  removeEmptyRows,
  removeEmptyColumns,
  trimWhitespace,
  standardizeCase,
  findAndReplace,
  fillMissingNumeric,
  fillMissingCategorical,
  dropRowsWithMissing,
  filterOutliersOrNegative
} from '../utils/dataCleaner';

interface DataCleanerProps {
  originalData: Record<string, any>[];
  cleanedData: Record<string, any>[];
  columns: ColumnProfile[];
  cleaningSteps: CleaningStep[];
  onApplyCleaning: (newData: Record<string, any>[], step: CleaningStep) => void;
  onUndo: () => void;
  onReset: () => void;
}

export const DataCleaner: React.FC<DataCleanerProps> = ({
  originalData,
  cleanedData,
  columns,
  cleaningSteps,
  onApplyCleaning,
  onUndo,
  onReset
}) => {
  // Local state for interactive tools
  const [selectedCol, setSelectedCol] = useState(columns[0]?.name || '');
  const [textCol, setTextCol] = useState(columns.find(c => c.detectedType === 'string')?.name || columns[0]?.name || '');
  const [numCol, setNumCol] = useState(columns.find(c => c.detectedType === 'integer' || c.detectedType === 'decimal')?.name || columns[0]?.name || '');

  // Find & replace inputs
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Imputation inputs
  const [numImputeStrategy, setNumImputeStrategy] = useState<'mean' | 'median' | 'zero' | 'custom'>('mean');
  const [customNumVal, setCustomNumVal] = useState<number>(0);

  const [catImputeStrategy, setCatImputeStrategy] = useState<'mode' | 'custom'>('mode');
  const [customCatVal, setCustomCatVal] = useState<string>('Unknown');

  // Stats calculation
  const originalRows = originalData.length;
  const currentRows = cleanedData.length;
  const rowsRemoved = originalRows - currentRows;
  const totalCellsModified = cleaningSteps.reduce((acc, s) => acc + s.cellsModified, 0);

  const numericCols = columns.filter(c => c.detectedType === 'integer' || c.detectedType === 'decimal');
  const stringCols = columns.filter(c => c.detectedType === 'string');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Ledger: Original vs Cleaned Metrics */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Dataset Transformation Ledger
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Cleaned Data Pipeline</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Original Dataset Untouched
              </span>
            </h2>
          </div>

          {/* Action buttons: Undo and Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={cleaningSteps.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                cleaningSteps.length > 0
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
              title="Undo last cleaning transformation"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo Last ({cleaningSteps.length})</span>
            </button>

            <button
              onClick={onReset}
              disabled={cleaningSteps.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                cleaningSteps.length > 0
                  ? 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 cursor-pointer'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
              title="Reset all cleaning operations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Cleaning</span>
            </button>
          </div>
        </div>

        {/* 4 Delta Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Original Records</span>
            <div className="text-lg font-bold font-mono text-slate-200 mt-0.5">
              {originalRows.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Immutable base state</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cleaned Records</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {currentRows.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {((currentRows / (originalRows || 1)) * 100).toFixed(1)}% retained
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Rows Removed</span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${rowsRemoved > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {rowsRemoved.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Duplicates / Empty / Outliers</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Cells Normalized</span>
            <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
              {totalCellsModified.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Trimmed / Imputed / Replaced</span>
          </div>
        </div>
      </div>

      {/* Grid of Cleaning Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tool 1: Deduplication & Empty Structural Removal */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                1. Structural Cleanup
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Prune exact duplicate records, empty rows, or obsolete empty columns across the dataset.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                const res = removeDuplicateRows(cleanedData);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Remove Duplicate Rows</span>
              <span className="text-[10px] text-slate-400 font-mono">Exact hash</span>
            </button>

            <button
              onClick={() => {
                const res = removeEmptyRows(cleanedData);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Remove Empty Rows</span>
              <span className="text-[10px] text-slate-400 font-mono">All-null</span>
            </button>

            <button
              onClick={() => {
                const res = removeEmptyColumns(cleanedData);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Remove 100% Empty Columns</span>
              <span className="text-[10px] text-slate-400 font-mono">Zero variance</span>
            </button>
          </div>
        </div>

        {/* Tool 2: Deduplication by Column (Unique ID enforcement) */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                2. Enforce Unique Column
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Ensure column (e.g. order_id, customer_id, email) contains strictly unique values by keeping first occurrence.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-mono">Select Key Column</label>
              <select
                value={selectedCol}
                onChange={e => setSelectedCol(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {columns.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.detectedType}) {c.duplicateCount > 0 ? `· ${c.duplicateCount} dups` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                if (!selectedCol) return;
                const res = removeDuplicatesByColumn(cleanedData, selectedCol);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Enforce Uniqueness on "{selectedCol}"
            </button>
          </div>
        </div>

        {/* Tool 3: Text Standardization & Trim */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                3. Text Hygiene & Case
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Trim hidden leading/trailing spaces and normalize letter casing across categorical entries.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                const res = trimWhitespace(cleanedData);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Trim Whitespace</span>
              <span className="text-[10px] text-slate-400 font-mono">All text columns</span>
            </button>

            {stringCols.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <select
                  value={textCol}
                  onChange={e => setTextCol(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none"
                >
                  {stringCols.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      if (!textCol) return;
                      const res = standardizeCase(cleanedData, textCol, 'lowercase');
                      onApplyCleaning(res.data, res.step);
                    }}
                    className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer text-center"
                  >
                    lower
                  </button>
                  <button
                    onClick={() => {
                      if (!textCol) return;
                      const res = standardizeCase(cleanedData, textCol, 'uppercase');
                      onApplyCleaning(res.data, res.step);
                    }}
                    className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer text-center"
                  >
                    UPPER
                  </button>
                  <button
                    onClick={() => {
                      if (!textCol) return;
                      const res = standardizeCase(cleanedData, textCol, 'titlecase');
                      onApplyCleaning(res.data, res.step);
                    }}
                    className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors cursor-pointer text-center"
                  >
                    Title Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tool 4: Missing Numeric Values Imputation */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                4. Numeric Missing Values
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Impute null or empty numbers using statistical center (Mean, Median), Zero, or custom constant.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {numericCols.length > 0 ? (
              <>
                <select
                  value={numCol}
                  onChange={e => setNumCol(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  {numericCols.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.nullCount > 0 ? `(${c.nullCount} nulls)` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-4 gap-1">
                  {(['mean', 'median', 'zero', 'custom'] as const).map(strat => (
                    <button
                      key={strat}
                      onClick={() => setNumImputeStrategy(strat)}
                      className={`py-1 px-1.5 rounded text-[11px] font-medium transition-colors capitalize ${
                        numImputeStrategy === strat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {strat}
                    </button>
                  ))}
                </div>

                {numImputeStrategy === 'custom' && (
                  <input
                    type="number"
                    value={customNumVal}
                    onChange={e => setCustomNumVal(Number(e.target.value))}
                    placeholder="Custom fill number"
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                  />
                )}

                <button
                  onClick={() => {
                    if (!numCol) return;
                    const res = fillMissingNumeric(cleanedData, numCol, numImputeStrategy, customNumVal);
                    onApplyCleaning(res.data, res.step);
                  }}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Apply Imputation to "{numCol}"
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">No numeric columns detected.</p>
            )}
          </div>
        </div>

        {/* Tool 5: Missing Categorical Imputation */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                5. Categorical Missing Values
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Impute missing string categories with the statistical Mode (most frequent) or custom string.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {stringCols.length > 0 ? (
              <>
                <select
                  value={textCol}
                  onChange={e => setTextCol(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none"
                >
                  {stringCols.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.nullCount > 0 ? `(${c.nullCount} nulls)` : ''}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setCatImputeStrategy('mode')}
                    className={`py-1 px-1.5 rounded text-[11px] font-medium transition-colors ${
                      catImputeStrategy === 'mode' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Mode (Most Frequent)
                  </button>
                  <button
                    onClick={() => setCatImputeStrategy('custom')}
                    className={`py-1 px-1.5 rounded text-[11px] font-medium transition-colors ${
                      catImputeStrategy === 'custom' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Custom Label
                  </button>
                </div>

                {catImputeStrategy === 'custom' && (
                  <input
                    type="text"
                    value={customCatVal}
                    onChange={e => setCustomCatVal(e.target.value)}
                    placeholder="e.g. Unknown or N/A"
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
                  />
                )}

                <button
                  onClick={() => {
                    if (!textCol) return;
                    const res = fillMissingCategorical(cleanedData, textCol, catImputeStrategy, customCatVal);
                    onApplyCleaning(res.data, res.step);
                  }}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Impute Missing in "{textCol}"
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-500 italic">No categorical columns detected.</p>
            )}
          </div>
        </div>

        {/* Tool 6: Find & Replace & Row Dropping */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                6. Find & Replace / Drop Rows
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Substitute substrings or remove incomplete rows that contain null values.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={findText}
                onChange={e => setFindText(e.target.value)}
                placeholder="Find text..."
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              />
              <input
                type="text"
                value={replaceText}
                onChange={e => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200"
              />
            </div>

            <button
              onClick={() => {
                if (!findText || !selectedCol) return;
                const res = findAndReplace(cleanedData, selectedCol, findText, replaceText);
                onApplyCleaning(res.data, res.step);
                setFindText('');
              }}
              disabled={!findText}
              className={`w-full py-1 px-3 rounded text-xs font-medium transition-colors ${
                findText
                  ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Replace in "{selectedCol}"
            </button>

            <button
              onClick={() => {
                const res = dropRowsWithMissing(cleanedData);
                onApplyCleaning(res.data, res.step);
              }}
              className="w-full py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Drop Incomplete Rows (Any Null)
            </button>
          </div>
        </div>
      </div>

      {/* Cleaning History Audit Trail */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Audit Trail: Cleaning History ({cleaningSteps.length} Operations Applied)
          </h3>
        </div>

        {cleaningSteps.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cleaningSteps.map((step, idx) => (
              <div
                key={step.id}
                className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px] w-6">#{idx + 1}</span>
                  <span className="text-slate-200 font-sans">{step.description}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>Rows: {step.rowsBefore} → {step.rowsAfter}</span>
                  {step.cellsModified > 0 && <span className="text-blue-400">+{step.cellsModified} cells</span>}
                  <span className="text-slate-600">{step.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic py-2">
            No transformations applied yet. Select any cleaning tool above to normalize records.
          </p>
        )}
      </div>
    </div>
  );
};
