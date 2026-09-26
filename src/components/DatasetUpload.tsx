import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, CheckCircle2, ArrowRight, Database, Check } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ColumnProfile, DataQualityReport } from '../types/dataset';
import { SAMPLE_DATASETS } from '../utils/sampleDatasets';
import { dbManager } from '../utils/sqlEngine';

interface DatasetUploadProps {
  datasetName: string | null;
  fileSize: string;
  rawData: Record<string, any>[];
  columns: ColumnProfile[];
  qualityReport: DataQualityReport;
  onDatasetLoaded: (name: string, size: string, data: Record<string, any>[]) => void;
  onProceed: () => void;
  onRemoveDataset?: () => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  datasetName,
  fileSize,
  rawData,
  columns,
  qualityReport,
  onDatasetLoaded,
  onProceed,
  onRemoveDataset
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual database insertion state
  const [dbMode, setDbMode] = useState<'existing' | 'new'>('existing');
  const [targetDb, setTargetDb] = useState(() => dbManager.getCurrentDatabase());
  const [newDbNameInput, setNewDbNameInput] = useState('');
  const [tableNameInput, setTableNameInput] = useState(() =>
    datasetName ? datasetName.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'customers'
  );
  const [tableSavedMsg, setTableSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (datasetName) {
      setTableNameInput(datasetName.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_'));
    }
  }, [datasetName]);

  const handleSaveToDatabase = () => {
    if (!tableNameInput.trim() || rawData.length === 0) return;
    const cleanTable = tableNameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    let chosenDb = targetDb;
    if (dbMode === 'new') {
      const cleanDb = dbManager.normalizeName(newDbNameInput);
      if (!cleanDb) return;
      dbManager.createDatabase(cleanDb);
      chosenDb = cleanDb;
      setTargetDb(cleanDb);
    }

    dbManager.insertTable(chosenDb, cleanTable, rawData);
    dbManager.setCurrentDatabase(chosenDb);
    setTableSavedMsg(`Table "${cleanTable}" successfully registered in database "${chosenDb}"!`);
    setTimeout(() => setTableSavedMsg(null), 3000);
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          setIsProcessing(false);
          if (results.data && results.data.length > 0) {
            onDatasetLoaded(file.name, sizeStr, results.data as Record<string, any>[]);
          } else {
            setErrorMsg('The CSV file does not contain any readable data rows.');
          }
        },
        error: (err) => {
          setIsProcessing(false);
          setErrorMsg(`Failed to parse CSV file: ${err.message}`);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          setIsProcessing(false);

          if (json && json.length > 0) {
            onDatasetLoaded(file.name, sizeStr, json as Record<string, any>[]);
          } else {
            setErrorMsg('The Excel sheet contains no readable rows.');
          }
        } catch (err: any) {
          setIsProcessing(false);
          setErrorMsg(`Failed to parse Excel file: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setIsProcessing(false);
      setErrorMsg('Unsupported format. Please upload a standard CSV or XLSX spreadsheet.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = (sampleId: string) => {
    const s = SAMPLE_DATASETS.find(item => item.id === sampleId);
    if (s) {
      onDatasetLoaded(s.name, '12.4 KB', s.data);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto pt-4 space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">
          Single Dataset Ingestion & Profiling
        </h1>
        <p className="text-sm text-slate-400">
          Upload any CSV or XLSX file. DataLens dynamically inspects structural hygiene, column data types, missingness, and statistical distributions automatically.
        </p>
      </div>

      {/* Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv,.xlsx,.xls"
          className="hidden"
        />

        <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-blue-400 mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-200">
            {isProcessing ? 'Inspecting & profiling schema...' : 'Drop your CSV or Excel file here, or browse files'}
          </p>
          <p className="text-xs text-slate-500">Supports .CSV, .XLSX (auto-detects types, delimiters, & headers)</p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-2.5 bg-rose-950/50 border border-rose-800/60 rounded-lg text-xs text-rose-300 max-w-md mx-auto">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 1-Click Test Datasets */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Instant Test Datasets (Pre-loaded for multi-domain verification)
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_DATASETS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => loadSample(sample.id)}
              className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                  {sample.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {sample.rowCount} rows
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2">
                {sample.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Active Dataset Inspection Summary & Preview */}
      {datasetName && rawData.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Active File</span>
              <div className="text-sm font-semibold text-slate-200 truncate mt-0.5" title={datasetName}>
                {datasetName}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">{fileSize}</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Dimensions</span>
              <div className="text-sm font-semibold text-slate-200 font-mono tabular-nums mt-0.5">
                {rawData.length.toLocaleString()} Rows
              </div>
              <span className="text-[11px] text-slate-500 font-mono">{columns.length} Columns</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Quality Score</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-base font-bold font-mono ${
                  qualityReport.overallScore >= 80 ? 'text-emerald-400' : qualityReport.overallScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {qualityReport.overallScore}%
                </span>
                <span className="text-xs text-slate-400 font-medium">({qualityReport.rating})</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {qualityReport.issues.length} detected issue{qualityReport.issues.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Next Step</span>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={onProceed}
                  className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Data Check</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {onRemoveDataset && (
                  <button
                    onClick={onRemoveDataset}
                    className="py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded text-xs transition-colors cursor-pointer"
                    title="Remove dataset"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Database & Table Registration Box */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
                  Register Table in Database
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-slate-400">Database mode:</span>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDbMode('existing')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      dbMode === 'existing'
                        ? 'bg-blue-600/30 text-blue-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Existing DB
                  </button>
                  <button
                    type="button"
                    onClick={() => setDbMode('new')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      dbMode === 'new'
                        ? 'bg-blue-600/30 text-blue-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    + New DB
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono">
                  {dbMode === 'existing' ? 'Target Database' : 'New Database Name'}
                </label>
                {dbMode === 'existing' ? (
                  <select
                    value={targetDb}
                    onChange={e => setTargetDb(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    {dbManager.getDatabases().map(db => (
                      <option key={db} value={db}>
                        {db} {db === 'main_db' ? '(default)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newDbNameInput}
                    onChange={e => setNewDbNameInput(e.target.value)}
                    placeholder="e.g. analytics_db"
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-mono">Table Name in SQL</label>
                <input
                  type="text"
                  value={tableNameInput}
                  onChange={e => setTableNameInput(e.target.value)}
                  placeholder="e.g. customers"
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleSaveToDatabase}
                  className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Insert into DB</span>
                </button>
              </div>
            </div>

            {tableSavedMsg && (
              <div className="p-2 bg-emerald-950/50 border border-emerald-800/60 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{tableSavedMsg}</span>
              </div>
            )}
          </div>

          {/* Preview Table Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-200">
                  Schema & Sample Preview (First {Math.min(50, rawData.length)} of {rawData.length.toLocaleString()} rows)
                </h3>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {columns.length} columns detected
              </div>
            </div>

            {/* Scrollable preview table */}
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-mono text-[10px] text-slate-500 border-r border-slate-800/80 w-12 text-center">
                      #
                    </th>
                    {columns.map(col => (
                      <th key={col.name} className="py-2.5 px-3 border-r border-slate-800/80 last:border-0 min-w-[140px]">
                        <div className="font-semibold text-slate-200 truncate">{col.name}</div>
                        <div className="text-[10px] font-mono text-blue-400 font-normal">
                          {col.detectedType}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rawData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-1.5 px-3 text-[10px] text-slate-500 border-r border-slate-800/80 text-center select-none">
                        {idx + 1}
                      </td>
                      {columns.map(col => {
                        const val = row[col.name];
                        const isNull = val === null || val === undefined || val === '';
                        return (
                          <td
                            key={col.name}
                            className={`py-1.5 px-3 border-r border-slate-800/60 last:border-0 truncate max-w-[200px] ${
                              isNull ? 'text-slate-600 italic' : 'text-slate-300'
                            }`}
                          >
                            {isNull ? 'null' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
