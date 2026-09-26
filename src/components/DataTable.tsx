import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Download,
  Copy,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { ColumnProfile } from '../types/dataset';
import { exportToCSV, exportToXLSX } from '../utils/exportUtils';

interface DataTableProps {
  originalData: Record<string, any>[];
  cleanedData: Record<string, any>[];
  filteredData: Record<string, any>[];
  columns: ColumnProfile[];
}

export const DataTable: React.FC<DataTableProps> = ({
  originalData,
  cleanedData,
  filteredData,
  columns
}) => {
  const [dataView, setDataView] = useState<'filtered' | 'cleaned' | 'original'>('filtered');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [showColPicker, setShowColPicker] = useState(false);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const activeData = useMemo(() => {
    if (dataView === 'original') return originalData;
    if (dataView === 'cleaned') return cleanedData;
    return filteredData;
  }, [dataView, originalData, cleanedData, filteredData]);

  const visibleColumns = useMemo(() => {
    return columns.filter(c => !hiddenColumns.includes(c.name));
  }, [columns, hiddenColumns]);

  // Search & Sort
  const processedData = useMemo(() => {
    let result = [...activeData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row => {
        return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q));
      });
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    return result;
  }, [activeData, searchQuery, sortColumn, sortDirection]);

  const totalRows = processedData.length;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;
  const paginatedRows = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const toggleCol = (name: string) => {
    if (hiddenColumns.includes(name)) {
      setHiddenColumns(hiddenColumns.filter(c => c !== name));
    } else {
      setHiddenColumns([...hiddenColumns, name]);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Dataset Tier Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => {
                setDataView('filtered');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                dataView === 'filtered'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Filtered Dataset ({filteredData.length})
            </button>
            <button
              onClick={() => {
                setDataView('cleaned');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                dataView === 'cleaned'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cleaned Dataset ({cleanedData.length})
            </button>
            <button
              onClick={() => {
                setDataView('original');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded transition-colors ${
                dataView === 'original'
                  ? 'bg-slate-800 text-slate-200 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Original Dataset ({originalData.length})
            </button>
          </div>
        </div>

        {/* Search, Column Visibility & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search all records..."
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44"
            />
          </div>

          {/* Column Visibility Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Columns ({visibleColumns.length}/{columns.length})</span>
            </button>

            {showColPicker && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-2 z-50 space-y-1 max-h-60 overflow-y-auto">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-800">
                  Toggle Columns
                </div>
                {columns.map(col => {
                  const isVisible = !hiddenColumns.includes(col.name);
                  return (
                    <div
                      key={col.name}
                      onClick={() => toggleCol(col.name)}
                      className="flex items-center justify-between px-2 py-1 rounded text-xs hover:bg-slate-800 cursor-pointer text-slate-300"
                    >
                      <span className="truncate">{col.name}</span>
                      {isVisible && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Export Button */}
          <button
            onClick={() => exportToCSV(processedData, `${dataView}_dataset_export`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export View</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/90 sticky top-0 z-10 border-b border-slate-800 font-mono text-slate-400">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center text-slate-600 border-r border-slate-800 select-none">
                #
              </th>
              {visibleColumns.map(col => {
                const isSorted = sortColumn === col.name;
                return (
                  <th
                    key={col.name}
                    onClick={() => handleSort(col.name)}
                    className="py-2.5 px-3 border-r border-slate-800/80 last:border-0 hover:bg-slate-900 cursor-pointer transition-colors select-none"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="truncate">
                        <span className="font-semibold text-slate-200">{col.name}</span>
                        <div className="text-[10px] text-blue-400 font-normal font-sans">
                          {col.detectedType}
                        </div>
                      </div>
                      <ArrowUpDown className={`w-3 h-3 shrink-0 ${isSorted ? 'text-blue-400' : 'text-slate-600'}`} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedRows.map((row, rIdx) => {
              const absIndex = (currentPage - 1) * pageSize + rIdx + 1;
              return (
                <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-2 px-3 text-center text-slate-600 border-r border-slate-800 text-[10px] select-none">
                    {absIndex}
                  </td>
                  {visibleColumns.map(col => {
                    const val = row[col.name];
                    const isNull = val === null || val === undefined;
                    const cellId = `${rIdx}_${col.name}`;
                    const isCopied = copiedCell === cellId;

                    return (
                      <td
                        key={col.name}
                        onClick={() => copyToClipboard(String(val ?? ''), cellId)}
                        title="Click to copy value"
                        className={`py-2 px-3 border-r border-slate-800/60 last:border-0 truncate max-w-xs cursor-pointer relative hover:bg-blue-950/20 ${
                          isNull ? 'text-slate-600 italic' : 'text-slate-300'
                        }`}
                      >
                        {isCopied ? (
                          <span className="text-emerald-400 font-sans text-[10px]">Copied!</span>
                        ) : isNull ? (
                          'null'
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing {Math.min(totalRows, (currentPage - 1) * pageSize + 1)} -{' '}
            {Math.min(totalRows, currentPage * pageSize)} of {totalRows.toLocaleString()} rows
          </span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
