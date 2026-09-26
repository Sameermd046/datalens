import React, { useState, useMemo, useEffect } from 'react';
import {
  ActiveTab,
  CleaningStep,
  ColumnProfile,
  DataQualityReport,
  DataType,
  SlicerFilter
} from './types/dataset';
import { profileDataset } from './utils/dataProfiler';
import { generateTraceableInsights } from './utils/insightsEngine';
import { SAMPLE_DATASETS } from './utils/sampleDatasets';
import { dbManager } from './utils/sqlEngine';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DatasetUpload } from './components/DatasetUpload';
import { DataCheck } from './components/DataCheck';
import { DataCleaner } from './components/DataCleaner';
import { DataTypes } from './components/DataTypes';
import { SQLEditor } from './components/SQLEditor';
import { Filters } from './components/Filters';
import { Dashboard } from './components/Dashboard';
import { DataTable } from './components/DataTable';
import { Insights } from './components/Insights';
import { FinalReport } from './components/FinalReport';
import { ExportModal } from './components/ExportModal';
import { Trash2, Database, AlertTriangle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  // Core Dataset Lifecycle States
  const [datasetName, setDatasetName] = useState<string | null>('ecommerce_sales_2026.csv');
  const [fileSize, setFileSize] = useState<string>('14.2 KB');
  const [originalData, setOriginalData] = useState<Record<string, any>[]>(() => SAMPLE_DATASETS[0].data);
  const [cleanedData, setCleanedData] = useState<Record<string, any>[]>(() => SAMPLE_DATASETS[0].data);
  const [cleaningSteps, setCleaningSteps] = useState<CleaningStep[]>([]);
  const [typeChanges, setTypeChanges] = useState<{ column: string; from: DataType; to: DataType }[]>([]);

  // Slicer Filters State
  const [filters, setFilters] = useState<Record<string, SlicerFilter>>({});

  // 1. Profile Dataset dynamically from cleanedData
  const { columns, qualityReport, duplicateRowCount } = useMemo(() => {
    return profileDataset(cleanedData);
  }, [cleanedData]);

  // 2. Filter dataset using active dynamic slicers
  const filteredData = useMemo(() => {
    let result = [...cleanedData];
    const activeSlicers = Object.values(filters).filter(f => f.isActive);

    if (activeSlicers.length === 0) return result;

    for (const f of activeSlicers) {
      const col = f.column;
      const t = f.type;

      if (t === 'string' && f.selectedCategories && f.selectedCategories.length > 0) {
        const allowed = new Set(f.selectedCategories);
        result = result.filter(r => allowed.has(String(r[col] ?? '').trim()));
      } else if ((t === 'integer' || t === 'decimal') && f.minNumeric !== undefined && f.maxNumeric !== undefined) {
        result = result.filter(r => {
          const val = Number(r[col]);
          return !isNaN(val) && val >= f.minNumeric! && val <= f.maxNumeric!;
        });
      } else if ((t === 'date' || t === 'datetime') && f.startDate && f.endDate) {
        const startTs = Date.parse(f.startDate);
        const endTs = Date.parse(f.endDate) + 86400000; // include end day
        result = result.filter(r => {
          const ts = Date.parse(String(r[col] ?? ''));
          return !isNaN(ts) && ts >= startTs && ts <= endTs;
        });
      } else if (t === 'boolean' && f.booleanValue !== null && f.booleanValue !== undefined) {
        result = result.filter(r => Boolean(r[col]) === f.booleanValue);
      }
    }

    return result;
  }, [cleanedData, filters]);

  // Handle file ingestion
  const handleDatasetLoaded = (name: string, size: string, data: Record<string, any>[]) => {
    setDatasetName(name);
    setFileSize(size);
    setOriginalData(data);
    setCleanedData(data);
    setCleaningSteps([]);
    setTypeChanges([]);
    setFilters({});
    dbManager.syncActiveDataset(name, data, data, data);
    setActiveTab('check');
  };

  // 1-Click Sample dataset switch
  const handleLoadSample = (sampleId: string) => {
    const s = SAMPLE_DATASETS.find(item => item.id === sampleId);
    if (s) {
      setDatasetName(s.name);
      setFileSize('12.4 KB');
      setOriginalData(s.data);
      setCleanedData(s.data);
      setCleaningSteps([]);
      setTypeChanges([]);
      setFilters({});
      dbManager.syncActiveDataset(s.name, s.data, s.data, s.data);
      setActiveTab('dashboard');
    }
  };

  // Cleaning transformation application
  const handleApplyCleaning = (newData: Record<string, any>[], step: CleaningStep) => {
    setCleanedData(newData);
    setCleaningSteps(prev => [step, ...prev]);
    dbManager.syncActiveDataset(datasetName, newData, newData, filteredData);
  };

  // Undo last cleaning operation
  const handleUndoCleaning = () => {
    if (cleaningSteps.length === 0) return;
    const remainingSteps = cleaningSteps.slice(1);
    setCleanedData(originalData);
    setCleaningSteps(remainingSteps);
    dbManager.syncActiveDataset(datasetName, originalData, originalData, filteredData);
  };

  // Reset all cleaning operations to original uploaded data
  const handleResetCleaning = () => {
    setCleanedData(originalData);
    setCleaningSteps([]);
    setTypeChanges([]);
    dbManager.syncActiveDataset(datasetName, originalData, originalData, filteredData);
  };

  // Update dynamic slicer
  const handleUpdateFilter = (colName: string, updatedFilter: SlicerFilter) => {
    setFilters(prev => ({
      ...prev,
      [colName]: updatedFilter
    }));
  };

  // Reset all slicer filters
  const handleResetFilters = () => {
    setFilters({});
  };

  // Reset workspace
  const handleResetWorkspace = () => {
    setCleanedData(originalData);
    setCleaningSteps([]);
    setTypeChanges([]);
    setFilters({});
  };

  // Clear / Remove Dataset completely
  const handleConfirmRemoveDataset = () => {
    setDatasetName(null);
    setFileSize('');
    setOriginalData([]);
    setCleanedData([]);
    setCleaningSteps([]);
    setTypeChanges([]);
    setFilters({});
    dbManager.clearAll();
    setActiveTab('import');
    setIsRemoveModalOpen(false);
  };

  // Type change handler
  const handleApplyTypeChange = (
    newData: Record<string, any>[],
    column: string,
    fromType: DataType,
    toType: DataType,
    logMsg: string
  ) => {
    setCleanedData(newData);
    setTypeChanges(prev => [...prev, { column, from: fromType, to: toType }]);
    setCleaningSteps(prev => [
      {
        id: `step_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'type_cast',
        description: logMsg,
        rowsBefore: cleanedData.length,
        rowsAfter: newData.length,
        cellsModified: newData.length
      },
      ...prev
    ]);
  };

  const activeFiltersCount = Object.values(filters).filter(f => f.isActive).length;
  const hasDataset = originalData.length > 0;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetName={datasetName}
        rowCount={cleanedData.length}
        filteredCount={filteredData.length}
        qualityScore={qualityReport.overallScore}
        onOpenExport={() => setIsExportModalOpen(true)}
        onResetWorkspace={handleResetWorkspace}
        onLoadSample={handleLoadSample}
        onRemoveDataset={() => setIsRemoveModalOpen(true)}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasDataset={hasDataset}
          issueCount={qualityReport.issues.length}
          filterCount={activeFiltersCount}
          onRemoveDataset={() => setIsRemoveModalOpen(true)}
        />

        {/* Dynamic Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0B0F17]">
          {/* If no dataset is loaded and not on import, show clean empty state */}
          {!hasDataset && activeTab !== 'import' ? (
            <div className="max-w-md mx-auto text-center py-20 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Database className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">No Dataset Loaded</h3>
                <p className="text-xs text-slate-400">
                  Please import a CSV or Excel dataset to begin inspection, cleaning, SQL analysis, and reporting.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('import')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                Go to Import Dataset
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'import' && (
                <DatasetUpload
                  datasetName={datasetName}
                  fileSize={fileSize}
                  rawData={originalData}
                  columns={columns}
                  qualityReport={qualityReport}
                  onDatasetLoaded={handleDatasetLoaded}
                  onProceed={() => setActiveTab('check')}
                  onRemoveDataset={() => setIsRemoveModalOpen(true)}
                />
              )}

              {activeTab === 'check' && (
                <DataCheck
                  columns={columns}
                  qualityReport={qualityReport}
                  totalRowCount={cleanedData.length}
                  duplicateRowCount={duplicateRowCount}
                  onNavigateClean={() => setActiveTab('clean')}
                />
              )}

              {activeTab === 'clean' && (
                <DataCleaner
                  originalData={originalData}
                  cleanedData={cleanedData}
                  columns={columns}
                  cleaningSteps={cleaningSteps}
                  onApplyCleaning={handleApplyCleaning}
                  onUndo={handleUndoCleaning}
                  onReset={handleResetCleaning}
                />
              )}

              {activeTab === 'types' && (
                <DataTypes
                  cleanedData={cleanedData}
                  columns={columns}
                  onApplyTypeChange={handleApplyTypeChange}
                />
              )}

              {activeTab === 'sql' && (
                <SQLEditor
                  activeDataset={cleanedData}
                  cleanedDataset={cleanedData}
                  filteredDataset={filteredData}
                  columns={columns}
                  datasetName={datasetName}
                  onRemoveDataset={() => setIsRemoveModalOpen(true)}
                />
              )}

              {activeTab === 'filters' && (
                <Filters
                  columns={columns}
                  filters={filters}
                  totalRows={cleanedData.length}
                  filteredCount={filteredData.length}
                  onUpdateFilter={handleUpdateFilter}
                  onResetFilters={handleResetFilters}
                  dataset={cleanedData}
                />
              )}

              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <Dashboard
                    filteredData={filteredData}
                    columns={columns}
                    totalOriginalRows={cleanedData.length}
                    onNavigateFilters={() => setActiveTab('filters')}
                  />

                  {/* Data Table directly accessible under Dashboard */}
                  <div className="pt-4 border-t border-slate-800">
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                        High-Density Data Explorer
                      </h3>
                    </div>
                    <DataTable
                      originalData={originalData}
                      cleanedData={cleanedData}
                      filteredData={filteredData}
                      columns={columns}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <Insights
                  filteredData={filteredData}
                  columns={columns}
                  duplicateRowCount={duplicateRowCount}
                />
              )}

              {activeTab === 'report' && (
                <FinalReport
                  datasetName={datasetName || 'Active Dataset'}
                  originalData={originalData}
                  cleanedData={cleanedData}
                  filteredData={filteredData}
                  columns={columns}
                  qualityReport={qualityReport}
                  cleaningSteps={cleaningSteps}
                  typeChanges={typeChanges}
                  insights={generateTraceableInsights(filteredData, columns, duplicateRowCount)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        datasetName={datasetName || 'dataset'}
        originalData={originalData}
        cleanedData={cleanedData}
        filteredData={filteredData}
      />

      {/* Remove Dataset Confirmation Modal */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Remove All Dataset Data?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This will completely remove the active dataset and clear all filters and cleanings from memory.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-400 space-y-1">
              <div>Dataset: <span className="text-slate-200">{datasetName || 'Active'}</span></div>
              <div>Records: <span className="text-slate-200">{cleanedData.length.toLocaleString()} rows</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsRemoveModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemoveDataset}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm"
              >
                Yes, Remove Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
