import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Download,
  Terminal,
  AlertCircle,
  Clock,
  Database,
  Layers,
  Sparkles,
  Plus,
  Table as TableIcon,
  Check,
  FolderPlus,
  Trash2,
  FilePlus2,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  AreaChart as AreaIcon,
  Columns,
  Table,
  Sliders
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import { ColumnProfile } from '../types/dataset';
import {
  executeSQLQuery,
  generateSuggestedQueries,
  SQLQueryResult,
  dbManager,
  DatabaseMeta
} from '../utils/sqlEngine';
import { exportToCSV } from '../utils/exportUtils';

interface SQLEditorProps {
  activeDataset: Record<string, any>[];
  cleanedDataset: Record<string, any>[];
  filteredDataset: Record<string, any>[];
  columns: ColumnProfile[];
  datasetName?: string | null;
  onRemoveDataset?: () => void;
}

type ResultViewMode = 'split' | 'table' | 'visual';
type ChartType = 'pie' | 'bar' | 'line' | 'area';

const CHART_PALETTE = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6366F1'  // Indigo
];

export const SQLEditor: React.FC<SQLEditorProps> = ({
  activeDataset,
  cleanedDataset,
  filteredDataset,
  columns,
  datasetName,
  onRemoveDataset
}) => {
  // Infer primary table name (e.g. 'customers.csv' -> 'customers')
  const defaultTableName = datasetName
    ? datasetName.split('.')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : 'customers';

  const [activeDb, setActiveDb] = useState<string>(() => dbManager.getCurrentDatabase());
  const [databasesList, setDatabasesList] = useState<string[]>(() => dbManager.getDatabases());
  const [dbMetadata, setDbMetadata] = useState<DatabaseMeta[]>(() => dbManager.getMetadata());

  // New Database Modal
  const [isNewDbModalOpen, setIsNewDbModalOpen] = useState(false);
  const [newDbInput, setNewDbInput] = useState('');

  // Insert Table Modal
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [insertDbMode, setInsertDbMode] = useState<'existing' | 'new'>('existing');
  const [targetDbForInsert, setTargetDbForInsert] = useState(activeDb);
  const [insertNewDbName, setInsertNewDbName] = useState('');
  const [insertTableName, setInsertTableName] = useState(defaultTableName);
  const [insertSource, setInsertSource] = useState<'active' | 'cleaned' | 'filtered'>('active');
  const [insertSuccessMsg, setInsertSuccessMsg] = useState<string | null>(null);

  const [sqlText, setSqlText] = useState(`SELECT *\nFROM ${defaultTableName}\nLIMIT 25;`);
  const [queryResult, setQueryResult] = useState<SQLQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // View Mode: 'split' (Both Table & Chart), 'table', 'visual'
  const [viewMode, setViewMode] = useState<ResultViewMode>('split');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [labelCol, setLabelCol] = useState<string>('');
  const [metricCol, setMetricCol] = useState<string>('');
  const [chartLimit, setChartLimit] = useState<number>(10);

  // Refresh database list and metadata
  const refreshDbState = () => {
    setDatabasesList(dbManager.getDatabases());
    setDbMetadata(dbManager.getMetadata());
    setActiveDb(dbManager.getCurrentDatabase());
  };

  // Generate dynamic query templates based on current schema and table name
  const suggestions = generateSuggestedQueries(
    columns.map(c => ({ name: c.name, type: c.detectedType })),
    datasetName
  );

  // Helper to auto-configure charts when query result arrives
  const setupChartDefaults = (result: SQLQueryResult) => {
    if (!result || !result.data || result.data.length === 0 || !result.columns || result.columns.length === 0) {
      return;
    }

    const cols = result.columns;
    const firstRow = result.data[0];

    // Find numeric columns
    const numericCols = cols.filter(c => typeof firstRow[c] === 'number');
    // Find label/text columns
    const nonNumericCols = cols.filter(c => typeof firstRow[c] !== 'number');

    const chosenLabel = nonNumericCols.length > 0 ? nonNumericCols[0] : cols[0];
    const chosenMetric = numericCols.length > 0 ? numericCols[0] : cols.length > 1 ? cols[1] : cols[0];

    setLabelCol(chosenLabel);
    setMetricCol(chosenMetric);

    // Smart default chart type:
    // If <= 8 rows (e.g. Top 5 products/categories), default to 'pie'
    if (result.rowCount <= 8 && numericCols.length > 0) {
      setChartType('pie');
    } else if (chosenLabel.toLowerCase().includes('date') || chosenLabel.toLowerCase().includes('time')) {
      setChartType('line');
    } else {
      setChartType('bar');
    }
  };

  const runQuery = (overrideSql?: string) => {
    const queryToRun = overrideSql || sqlText;
    setIsExecuting(true);
    setTimeout(() => {
      const res = executeSQLQuery(
        queryToRun,
        activeDataset,
        cleanedDataset,
        filteredDataset,
        datasetName,
        activeDb
      );
      setQueryResult(res);
      setIsExecuting(false);
      setCurrentPage(1);
      setupChartDefaults(res);
      refreshDbState();
    }, 40);
  };

  // Synchronize on dataset change
  useEffect(() => {
    if (activeDataset.length > 0) {
      dbManager.syncActiveDataset(datasetName || null, activeDataset, cleanedDataset, filteredDataset);
      refreshDbState();
      const initialSql = `SELECT *\nFROM ${defaultTableName}\nLIMIT 25;`;
      setSqlText(initialSql);
      const res = executeSQLQuery(
        initialSql,
        activeDataset,
        cleanedDataset,
        filteredDataset,
        datasetName,
        activeDb
      );
      setQueryResult(res);
      setupChartDefaults(res);
    }
  }, [activeDataset, datasetName]);

  const handleSwitchDatabase = (newDb: string) => {
    dbManager.setCurrentDatabase(newDb);
    setActiveDb(newDb);
    refreshDbState();
    runQuery(`USE ${newDb};`);
  };

  const handleCreateDatabase = () => {
    if (!newDbInput.trim()) return;
    const clean = newDbInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    dbManager.createDatabase(clean);
    dbManager.setCurrentDatabase(clean);
    setActiveDb(clean);
    setNewDbInput('');
    setIsNewDbModalOpen(false);
    refreshDbState();
    runQuery(`USE ${clean};`);
  };

  const handleInsertTableToDatabase = () => {
    if (!insertTableName.trim()) return;
    const cleanTable = insertTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    let targetDb = targetDbForInsert.trim().toLowerCase() || activeDb;
    if (insertDbMode === 'new') {
      const cleanNew = dbManager.normalizeName(insertNewDbName);
      if (!cleanNew) return;
      dbManager.createDatabase(cleanNew);
      targetDb = cleanNew;
    }

    // Pick source data
    let dataToInsert = activeDataset;
    if (insertSource === 'cleaned') dataToInsert = cleanedDataset;
    if (insertSource === 'filtered') dataToInsert = filteredDataset;

    dbManager.insertTable(targetDb, cleanTable, dataToInsert);
    dbManager.setCurrentDatabase(targetDb);
    setActiveDb(targetDb);
    refreshDbState();

    setInsertSuccessMsg(`Table "${cleanTable}" successfully inserted into database "${targetDb}" (${dataToInsert.length} rows).`);
    setTimeout(() => {
      setInsertSuccessMsg(null);
      setIsInsertModalOpen(false);
      setInsertNewDbName('');
      setInsertDbMode('existing');
    }, 1500);

    const query = `SELECT *\nFROM ${cleanTable}\nLIMIT 25;`;
    setSqlText(query);
    runQuery(query);
  };

  const handleDeleteTable = (tableName: string) => {
    dbManager.deleteTable(activeDb, tableName);
    refreshDbState();
    runQuery('SHOW TABLES;');
  };

  const handleExportResult = () => {
    if (queryResult && queryResult.data.length > 0) {
      exportToCSV(queryResult.data, 'sql_query_result');
    }
  };

  // Get active database tables
  const currentDbTables = dbMetadata.find(d => d.name === activeDb)?.tables || [];

  const paginatedData = queryResult?.data.slice((currentPage - 1) * pageSize, currentPage * pageSize) || [];
  const totalPages = Math.ceil((queryResult?.data.length || 0) / pageSize) || 1;

  // Process data for charts
  const chartProcessedData = useMemo(() => {
    if (!queryResult || !queryResult.data || queryResult.data.length === 0) return [];
    const activeLabel = labelCol || queryResult.columns[0];
    const activeMetric = metricCol || queryResult.columns[1] || queryResult.columns[0];

    const slice = queryResult.data.slice(0, chartLimit);

    const totalMetricSum = slice.reduce((acc, row) => {
      const val = Number(row[activeMetric]);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    return slice.map((row, idx) => {
      const labelVal = row[activeLabel] !== null && row[activeLabel] !== undefined ? String(row[activeLabel]) : `Row ${idx + 1}`;
      const rawVal = Number(row[activeMetric]);
      const numVal = isNaN(rawVal) ? 1 : rawVal;
      const pct = totalMetricSum > 0 ? Number(((numVal / totalMetricSum) * 100).toFixed(1)) : 0;

      return {
        name: labelVal,
        value: numVal,
        percentage: pct,
        raw: row
      };
    });
  }, [queryResult, labelCol, metricCol, chartLimit]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Database & SQL Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              In-Memory Analytical SQL Engine
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-0.5">
              <span>DuckDB SQL & Visual Analytics Workbench</span>
              <span className="text-xs font-mono font-normal text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Multi-Database & Multi-Table Engine
              </span>
            </h2>
          </div>

          {/* Database Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Database:</span>
              <select
                value={activeDb}
                onChange={e => handleSwitchDatabase(e.target.value)}
                className="bg-slate-900 text-slate-200 font-mono font-medium rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {databasesList.map(db => (
                  <option key={db} value={db}>
                    {db} {db === 'main_db' ? '(default)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setTargetDbForInsert(activeDb);
                setInsertTableName(defaultTableName);
                setIsInsertModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-sm"
              title="Insert active dataset into a database as a table"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>+ Insert Table into DB</span>
            </button>

            <button
              onClick={() => setIsNewDbModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="Create new database"
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>+ New Database</span>
            </button>

            <button
              onClick={() => {
                setSqlText('SHOW TABLES;');
                runQuery('SHOW TABLES;');
              }}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            >
              SHOW TABLES
            </button>
            <button
              onClick={() => {
                setSqlText('SHOW DATABASES;');
                runQuery('SHOW DATABASES;');
              }}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono transition-colors cursor-pointer"
            >
              SHOW DATABASES
            </button>

            {onRemoveDataset && (
              <button
                onClick={onRemoveDataset}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Remove all datasets and clear all tables"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Remove All Datasets</span>
              </button>
            )}
          </div>
        </div>

        {/* Available Tables in Current Database Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Tables in database "<span className="text-blue-400">{activeDb}</span>":
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Click table chip to query
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentDbTables.map(t => (
              <div
                key={t.name}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 rounded-lg text-xs font-mono transition-all group"
              >
                <button
                  onClick={() => {
                    const sql = `SELECT *\nFROM ${t.name}\nLIMIT 25;`;
                    setSqlText(sql);
                    runQuery(sql);
                  }}
                  className="flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <span className="font-semibold text-blue-300 group-hover:text-blue-400">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    ({t.rowCount} rows · {t.columnCount} cols)
                  </span>
                </button>

                {t.name !== 'dataset' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(t.name);
                    }}
                    className="p-0.5 text-slate-600 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                    title={`Delete table "${t.name}"`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor & Schema Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* SQL Code Editor Area */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-slate-200">Query Editor</span>
                <span className="text-slate-600">·</span>
                <span className="text-[11px] text-slate-500">
                  Target DB: <strong className="text-blue-400 font-mono">{activeDb}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSqlText(`SELECT *\nFROM ${defaultTableName}\nLIMIT 25;`)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-xs rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => runQuery()}
                  disabled={isExecuting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* Code Textarea */}
            <textarea
              value={sqlText}
              onChange={e => setSqlText(e.target.value)}
              rows={7}
              spellCheck={false}
              className="w-full bg-[#070A10] text-emerald-300 font-mono text-xs p-4 focus:outline-none resize-y leading-relaxed"
              placeholder={`Write SQL query here (e.g. SELECT * FROM ${defaultTableName} WHERE ...)`}
            />
          </div>

          {/* Quick Query Templates */}
          {suggestions.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Instant Visual Analytics & Quick Queries
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  1-Click Execution & Visual Rendering
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => {
                  const isPie = s.title.toLowerCase().includes('pie') || s.title.toLowerCase().includes('top 5');
                  const isBar = s.title.toLowerCase().includes('bar') || s.title.toLowerCase().includes('distribution');
                  const isLine = s.title.toLowerCase().includes('line') || s.title.toLowerCase().includes('trend');

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSqlText(s.sql);
                        if (isPie) {
                          setChartType('pie');
                          setViewMode('split');
                        } else if (isBar) {
                          setChartType('bar');
                          setViewMode('split');
                        } else if (isLine) {
                          setChartType('line');
                          setViewMode('split');
                        }
                        runQuery(s.sql);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer text-left flex items-center gap-1.5 ${
                        isPie
                          ? 'bg-emerald-950/40 hover:bg-emerald-900/50 border-emerald-800/50 text-emerald-300 font-medium'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                      }`}
                    >
                      {isPie && <PieIcon className="w-3 h-3 text-emerald-400" />}
                      {isBar && <BarChart3 className="w-3 h-3 text-blue-400" />}
                      {isLine && <LineIcon className="w-3 h-3 text-purple-400" />}
                      <span>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Schema Inspector on the Right */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Columns in "{defaultTableName}"
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Click any column name to insert into query.
            </p>

            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {columns.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSqlText(prev => `${prev} ${c.name}`)}
                  className="w-full text-left p-1.5 rounded hover:bg-slate-800/70 flex items-center justify-between text-xs font-mono group transition-colors"
                >
                  <span className="text-slate-300 group-hover:text-blue-400 truncate">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-sans">{c.detectedType}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] text-slate-500 font-mono">
            <div>Current Database: <span className="text-emerald-400">{activeDb}</span></div>
            <div>Primary Table: <span className="text-blue-400">{defaultTableName}</span></div>
            <div>Aliases: <span className="text-slate-400">dataset, cleaned_dataset</span></div>
          </div>
        </div>
      </div>

      {/* Query Results & Metrics Section */}
      {queryResult && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden space-y-0 shadow-sm">
          {/* Main Results Toolbar */}
          <div className="px-4 py-3 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/70">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-semibold text-slate-200">Execution Result:</span>
              {queryResult.success ? (
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {queryResult.executionTimeMs} ms
                  </span>
                  <span>·</span>
                  <span>{queryResult.rowCount.toLocaleString()} rows returned</span>
                  <span>·</span>
                  <span>{queryResult.columnCount} columns</span>
                  {queryResult.message && (
                    <span className="text-blue-400 font-sans">({queryResult.message})</span>
                  )}
                </div>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Query Execution Failed
                </span>
              )}
            </div>

            {queryResult.success && queryResult.rowCount > 0 && (
              <div className="flex items-center gap-2">
                {/* View Mode Switcher: Split (Both) | Table | Visual */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      viewMode === 'split'
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Show Table & Related Visual Chart side-by-side"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Split (Both)</span>
                  </button>

                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Show full data table"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Table View</span>
                  </button>

                  <button
                    onClick={() => setViewMode('visual')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      viewMode === 'visual'
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Show full visual chart"
                  >
                    <PieIcon className="w-3.5 h-3.5" />
                    <span>Visual Chart</span>
                  </button>
                </div>

                <button
                  onClick={handleExportResult}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* If Error */}
          {queryResult.error && (
            <div className="p-4 bg-rose-950/40 border-b border-rose-900/50 text-xs font-mono text-rose-300">
              <div className="font-bold mb-1">DuckDB Execution Error:</div>
              <pre className="whitespace-pre-wrap">{queryResult.error}</pre>
            </div>
          )}

          {/* Results Body: Table, Chart, or Split (Both Table and Chart) */}
          {queryResult.success && queryResult.data.length > 0 && (
            <div className={`p-4 ${viewMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-2 gap-4' : ''}`}>
              {/* 1. TABLE VIEW CONTAINER */}
              {(viewMode === 'table' || viewMode === 'split') && (
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div className="px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-blue-400" />
                      <span>Data Output Table</span>
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      Showing {Math.min(queryResult.rowCount, (currentPage - 1) * pageSize + 1)} -{' '}
                      {Math.min(queryResult.rowCount, currentPage * pageSize)} of {queryResult.rowCount} rows
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[360px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 font-mono text-slate-400">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center text-slate-600 border-r border-slate-800 select-none">#</th>
                          {queryResult.columns.map(col => (
                            <th key={col} className="py-2 px-3 border-r border-slate-800/80 last:border-0 font-semibold text-slate-200">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {paginatedData.map((row, idx) => {
                          const absoluteIndex = (currentPage - 1) * pageSize + idx + 1;
                          return (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-1.5 px-3 text-center text-slate-600 border-r border-slate-800 text-[10px] select-none">
                                {absoluteIndex}
                              </td>
                              {queryResult.columns.map(col => {
                                const val = row[col];
                                const isNull = val === null || val === undefined;
                                return (
                                  <td
                                    key={col}
                                    className={`py-1.5 px-3 border-r border-slate-800/60 last:border-0 truncate max-w-[200px] ${
                                      isNull ? 'text-slate-600 italic' : 'text-slate-300'
                                    }`}
                                  >
                                    {isNull ? 'null' : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px]">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs transition-colors"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 text-xs transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. RELATED VISUAL CHART CONTAINER */}
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  {/* Chart Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-200">Related Visual</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Chart Type Selector */}
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => setChartType('pie')}
                          className={`p-1.5 rounded transition-colors ${
                            chartType === 'pie' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Pie / Donut Chart"
                        >
                          <PieIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setChartType('bar')}
                          className={`p-1.5 rounded transition-colors ${
                            chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Bar Chart"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setChartType('line')}
                          className={`p-1.5 rounded transition-colors ${
                            chartType === 'line' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Line Trend"
                        >
                          <LineIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setChartType('area')}
                          className={`p-1.5 rounded transition-colors ${
                            chartType === 'area' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title="Area Distribution"
                        >
                          <AreaIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Label Column Dropdown */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px]">
                        <span className="text-slate-500 font-mono">Label:</span>
                        <select
                          value={labelCol}
                          onChange={e => setLabelCol(e.target.value)}
                          className="bg-transparent text-slate-200 font-mono focus:outline-none cursor-pointer"
                        >
                          {queryResult.columns.map(c => (
                            <option key={c} value={c} className="bg-slate-900">{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Value Column Dropdown */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px]">
                        <span className="text-slate-500 font-mono">Value:</span>
                        <select
                          value={metricCol}
                          onChange={e => setMetricCol(e.target.value)}
                          className="bg-transparent text-slate-200 font-mono focus:outline-none cursor-pointer"
                        >
                          {queryResult.columns.map(c => (
                            <option key={c} value={c} className="bg-slate-900">{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Limit Top N */}
                      <select
                        value={chartLimit}
                        onChange={e => setChartLimit(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 font-mono focus:outline-none cursor-pointer"
                      >
                        <option value={5}>Top 5</option>
                        <option value={10}>Top 10</option>
                        <option value={20}>Top 20</option>
                        <option value={50}>Top 50</option>
                      </select>
                    </div>
                  </div>

                  {/* Render Chart */}
                  <div className="h-64 w-full pt-1">
                    {chartProcessedData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={chartProcessedData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={78}
                              paddingAngle={3}
                            >
                              {chartProcessedData.map((_, i) => (
                                <Cell key={`cell-${i}`} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#F1F5F9'
                              }}
                              formatter={(val: any, name: any, item: any) => [
                                `${Number(val).toLocaleString()} (${item.payload.percentage}%)`,
                                name
                              ]}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={32}
                              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                            />
                          </PieChart>
                        ) : chartType === 'bar' ? (
                          <BarChart data={chartProcessedData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#64748B"
                              fontSize={10}
                              tickLine={false}
                              interval={0}
                              angle={-20}
                              textAnchor="end"
                            />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#F1F5F9'
                              }}
                              formatter={(val: any) => [Number(val).toLocaleString(), metricCol]}
                            />
                            <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                              {chartProcessedData.map((_, i) => (
                                <Cell key={`bar-${i}`} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : chartType === 'line' ? (
                          <LineChart data={chartProcessedData} margin={{ top: 10, right: 10, left: -15, bottom: 15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#64748B"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#F1F5F9'
                              }}
                              formatter={(val: any) => [Number(val).toLocaleString(), metricCol]}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#10B981"
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: '#10B981' }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        ) : (
                          <AreaChart data={chartProcessedData} margin={{ top: 10, right: 10, left: -15, bottom: 15 }}>
                            <defs>
                              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#0F172A',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                fontSize: '11px',
                                color: '#F1F5F9'
                              }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#8B5CF6" fillOpacity={1} fill="url(#areaGrad)" />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                        Not enough data rows to plot visual chart.
                      </div>
                    )}
                  </div>

                  {/* Chart Summary Kicker */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      Dimension: <strong className="text-blue-300">{labelCol}</strong> · Metric: <strong className="text-emerald-300">{metricCol}</strong>
                    </span>
                    <span>
                      {chartProcessedData.length} data points
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {queryResult.success && queryResult.data.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Query executed successfully with 0 records returned.
            </div>
          )}
        </div>
      )}

      {/* Modal: Insert Table into Database */}
      {isInsertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-100">Insert Table into Database</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {activeDataset.length.toLocaleString()} rows
              </span>
            </div>

            {insertSuccessMsg ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{insertSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* 1. Target Database */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-medium">Target Database:</label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setInsertDbMode('existing')}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          insertDbMode === 'existing'
                            ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Existing DB
                      </button>
                      <button
                        type="button"
                        onClick={() => setInsertDbMode('new')}
                        className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          insertDbMode === 'new'
                            ? 'bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        + Create New DB
                      </button>
                    </div>
                  </div>

                  {insertDbMode === 'existing' ? (
                    <select
                      value={targetDbForInsert}
                      onChange={e => setTargetDbForInsert(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                    >
                      {databasesList.map(db => (
                        <option key={db} value={db}>
                          {db} {db === 'main_db' ? '(default)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={insertNewDbName}
                      onChange={e => setInsertNewDbName(e.target.value)}
                      placeholder="Enter new database name (e.g. crm_analytics)"
                      className="w-full px-3 py-2 bg-slate-950 border border-blue-500/60 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-400"
                    />
                  )}
                </div>

                {/* 2. Table Name */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Table Name in Database:</label>
                  <input
                    type="text"
                    value={insertTableName}
                    onChange={e => setInsertTableName(e.target.value)}
                    placeholder="e.g. customers, orders, users"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 font-sans">
                    You can query this table as: <code className="text-blue-300 font-mono">SELECT * FROM {insertTableName || 'table'};</code>
                  </p>
                </div>

                {/* 3. Source Dataset */}
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Source Dataset State:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInsertSource('active')}
                      className={`p-2 rounded-lg text-left transition-colors border ${
                        insertSource === 'active'
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <div className="font-semibold">Active</div>
                      <div className="text-[10px] text-slate-500">{activeDataset.length} rows</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInsertSource('cleaned')}
                      className={`p-2 rounded-lg text-left transition-colors border ${
                        insertSource === 'cleaned'
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <div className="font-semibold">Cleaned</div>
                      <div className="text-[10px] text-slate-500">{cleanedDataset.length} rows</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInsertSource('filtered')}
                      className={`p-2 rounded-lg text-left transition-colors border ${
                        insertSource === 'filtered'
                          ? 'bg-blue-600/20 text-blue-300 border-blue-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <div className="font-semibold">Filtered</div>
                      <div className="text-[10px] text-slate-500">{filteredDataset.length} rows</div>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsInsertModalOpen(false)}
                    className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertTableToDatabase}
                    disabled={!insertTableName.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <span>Insert into {targetDbForInsert}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Database */}
      {isNewDbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-400" />
                <span>Create New Database</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Creates an in-memory SQL database. You can also run <code className="text-blue-300 font-mono">CREATE DATABASE db_name;</code> in the editor.
              </p>
            </div>

            <input
              type="text"
              value={newDbInput}
              onChange={e => setNewDbInput(e.target.value)}
              placeholder="e.g. analytics_db, crm_db"
              autoFocus
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewDbModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDatabase}
                disabled={!newDbInput.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors"
              >
                Create Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
