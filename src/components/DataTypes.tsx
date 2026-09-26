import React, { useState } from 'react';
import { Binary, Check, AlertCircle, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { ColumnProfile, DataType, TypeConversionResult } from '../types/dataset';
import { testTypeConversion, applyTypeConversion } from '../utils/dataConverter';

interface DataTypesProps {
  cleanedData: Record<string, any>[];
  columns: ColumnProfile[];
  onApplyTypeChange: (
    newData: Record<string, any>[],
    column: string,
    fromType: DataType,
    toType: DataType,
    logMsg: string
  ) => void;
}

const SUPPORTED_TYPES: { id: DataType; label: string; desc: string }[] = [
  { id: 'string', label: 'String / Text', desc: 'Textual, alphanumeric, codes' },
  { id: 'integer', label: 'Integer', desc: 'Whole non-decimal numbers (e.g. 10, 42)' },
  { id: 'decimal', label: 'Decimal / Float', desc: 'Continuous floating point numbers (e.g. 19.99)' },
  { id: 'boolean', label: 'Boolean', desc: 'Binary flags (true / false)' },
  { id: 'date', label: 'Date', desc: 'Calendar date (YYYY-MM-DD)' },
  { id: 'datetime', label: 'DateTime', desc: 'Timestamp with time of day' }
];

export const DataTypes: React.FC<DataTypesProps> = ({
  cleanedData,
  columns,
  onApplyTypeChange
}) => {
  const [selectedCol, setSelectedCol] = useState<string>(columns[0]?.name || '');
  const [targetType, setTargetType] = useState<DataType>('string');
  const [failurePolicy, setFailurePolicy] = useState<'null' | 'keep_original' | 'drop_row'>('null');
  const [testResult, setTestResult] = useState<TypeConversionResult | null>(null);

  const currentColProfile = columns.find(c => c.name === selectedCol) || columns[0];

  const handleRunValidation = (col: string, type: DataType) => {
    const res = testTypeConversion(cleanedData, col, type);
    setTestResult(res);
  };

  const handleApplyConversion = () => {
    if (!selectedCol) return;
    const fromType = currentColProfile?.currentType || 'string';
    const { data: updatedData, affectedRows, droppedRows } = applyTypeConversion(
      cleanedData,
      selectedCol,
      targetType,
      failurePolicy
    );

    const logMsg = `Cast column "${selectedCol}" from ${fromType} to ${targetType}. (${affectedRows} converted${
      droppedRows > 0 ? `, ${droppedRows} dropped` : ''
    })`;

    onApplyTypeChange(updatedData, selectedCol, fromType, targetType, logMsg);
    // Refresh test
    handleRunValidation(selectedCol, targetType);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              Schema Definition & Type Casting
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>Data Type Management</span>
              <span className="text-xs font-mono font-normal text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                Safe Validation Pre-flight
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Verify conversion rules before applying. Prevent silent loss of invalid entries by setting fallback policies (Null, Retain, or Drop).
          </p>
        </div>
      </div>

      {/* Main Grid: Column Schema Table & Converter Workshop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Column Schema Listing */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-200">
                Active Columns & Data Types ({columns.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Click row to cast type
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 border-b border-slate-800 font-medium text-slate-400">
                <tr>
                  <th className="py-2.5 px-4">Column Name</th>
                  <th className="py-2.5 px-3">Current Type</th>
                  <th className="py-2.5 px-3">Detected Type</th>
                  <th className="py-2.5 px-3">Unique / Sample</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {columns.map(col => {
                  const isSelected = selectedCol === col.name;
                  return (
                    <tr
                      key={col.name}
                      onClick={() => {
                        setSelectedCol(col.name);
                        setTargetType(col.detectedType);
                        handleRunValidation(col.name, col.detectedType);
                      }}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/30'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-200">
                        {col.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {col.currentType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-blue-400 font-medium">
                        {col.detectedType}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans truncate max-w-xs">
                        {col.uniqueCount} unique · Sample: {col.topValues?.[0]?.value || col.min || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`text-xs font-sans ${isSelected ? 'text-blue-400 font-semibold' : 'text-slate-500'}`}>
                          {isSelected ? 'Editing' : 'Select'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Interactive Type Casting Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Target Column</span>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                <span>{selectedCol || 'Select a column'}</span>
                {currentColProfile && (
                  <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Current: {currentColProfile.currentType}
                  </span>
                )}
              </h3>
            </div>

            {/* Target Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Convert to Data Type</label>
              <div className="space-y-1">
                {SUPPORTED_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTargetType(t.id);
                      handleRunValidation(selectedCol, t.id);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      targetType === t.id
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                        : 'bg-slate-950/60 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{t.label}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{t.desc}</div>
                    </div>
                    {targetType === t.id && <Check className="w-4 h-4 text-blue-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-flight Validation Report */}
            {testResult && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {testResult.successCount} valid rows
                  </span>
                  {testResult.failureCount > 0 && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {testResult.failureCount} invalid rows
                    </span>
                  )}
                </div>

                {testResult.failureCount > 0 && (
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="text-amber-300">Sample non-convertible entries:</p>
                    <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                      {testResult.failureSamples.map((s, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-rose-950/60 text-rose-300 rounded border border-rose-800/40">
                          "{s}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Policy for Invalid Values */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-300">If Values Cannot Be Converted:</label>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button
                  onClick={() => setFailurePolicy('null')}
                  className={`p-1.5 rounded transition-colors text-center ${
                    failurePolicy === 'null' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Set to NULL
                </button>
                <button
                  onClick={() => setFailurePolicy('keep_original')}
                  className={`p-1.5 rounded transition-colors text-center ${
                    failurePolicy === 'keep_original' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Keep Original
                </button>
                <button
                  onClick={() => setFailurePolicy('drop_row')}
                  className={`p-1.5 rounded transition-colors text-center ${
                    failurePolicy === 'drop_row' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Drop Row
                </button>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={handleApplyConversion}
            disabled={!selectedCol}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>Confirm Cast to {targetType}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
