import React from 'react';
import { X, Download, FileSpreadsheet, FileText, Printer, Check } from 'lucide-react';
import { exportToCSV, exportToXLSX, triggerPrintReport } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  originalData: Record<string, any>[];
  cleanedData: Record<string, any>[];
  filteredData: Record<string, any>[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  originalData,
  cleanedData,
  filteredData
}) => {
  if (!isOpen) return null;

  const baseName = datasetName.replace(/\.[^/.]+$/, '');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">Export Dataset & Deliverables</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Option 1: Cleaned Dataset */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Cleaned Dataset</span>
                <p className="text-[11px] text-slate-400">{cleanedData.length.toLocaleString()} rows (post-hygiene)</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportToCSV(cleanedData, `${baseName}_cleaned`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportToXLSX(cleanedData, `${baseName}_cleaned`)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Current Filtered Dataset */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Filtered Dataset</span>
                <p className="text-[11px] text-slate-400">{filteredData.length.toLocaleString()} rows (active slicers)</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportToCSV(filteredData, `${baseName}_filtered`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportToXLSX(filteredData, `${baseName}_filtered`)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Original Uploaded Data */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Original Raw Dataset</span>
                <p className="text-[11px] text-slate-400">{originalData.length.toLocaleString()} rows (unmodified)</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportToCSV(originalData, `${baseName}_original`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  CSV
                </button>
                <button
                  onClick={() => exportToXLSX(originalData, `${baseName}_original`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Option 4: Final Report Print/PDF */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Final Audit Report</span>
                <p className="text-[11px] text-slate-400">Complete 11-section executive PDF/print</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  triggerPrintReport();
                }}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
