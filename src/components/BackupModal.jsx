import React, { useRef, useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { X, Download, Upload, FileSpreadsheet, RotateCcw, AlertTriangle, Trash2, Calendar } from 'lucide-react';

export default function BackupModal({ isOpen, onClose }) {
  const { exportData, importData, exportCSV, resetData, deleteMonthDeliverables, clients, deliverables, dbType } = usePlanner();
  const fileInputRef = useRef(null);

  // Extract all available months from deliverables
  const availableMonths = useMemo(() => {
    const map = {};
    deliverables.forEach(d => {
      if (d.date && /^\d{4}-\d{2}/.test(d.date)) {
        const ym = d.date.slice(0, 7);
        map[ym] = (map[ym] || 0) + 1;
      }
    });
    return Object.keys(map).sort().map(ym => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        key: ym,
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        count: map[ym]
      };
    });
  }, [deliverables]);

  const [selectedMonthToDelete, setSelectedMonthToDelete] = useState(() => {
    return availableMonths.length > 0 ? availableMonths[0].key : '';
  });

  if (!isOpen) return null;

  const handleDeleteMonth = async () => {
    if (!selectedMonthToDelete) return;
    const found = availableMonths.find(m => m.key === selectedMonthToDelete);
    const label = found ? found.label : selectedMonthToDelete;
    const count = found ? found.count : 0;
    if (window.confirm(`Are you sure you want to delete all ${count} deliverables for ${label}? All other months will remain completely safe.`)) {
      await deleteMonthDeliverables(selectedMonthToDelete, label);
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const success = importData(parsed);
        if (success) {
          onClose();
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Reset all deliverables and clients back to default? All custom edits will be lost.')) {
      resetData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Backup & Data Management</h3>
            <p className="text-xs text-slate-500">
              Export data backups, import configurations, or download spreadsheet CSVs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Status info */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600 font-medium">Currently Managed in {dbType || 'MongoDB'} Database:</span>
            <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
              {clients.length} Brands • {deliverables.length} Deliverables
            </span>
          </div>

          {/* Export JSON */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">Export JSON Backup</h4>
              <p className="text-slate-500 text-[11px]">Download a full snapshot JSON of all clients and deliverables.</p>
            </div>
            <button
              onClick={exportData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </button>
          </div>

          {/* Export CSV */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">Export CSV Spreadsheet</h4>
              <p className="text-slate-500 text-[11px]">Compatible with Excel, Google Sheets, and Numbers.</p>
            </div>
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-slate-900">Import JSON Backup</h4>
              <p className="text-slate-500 text-[11px]">Restore or replace workspace data from a previous backup.</p>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Choose File</span>
              </button>
            </div>
          </div>

          {/* Delete Single Month Data */}
          {availableMonths.length > 0 && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Delete Single Month's Data
                </h4>
                <p className="text-amber-700 text-[11px]">
                  Safely remove only deliverables from a specific month without touching other months.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={selectedMonthToDelete}
                  onChange={e => setSelectedMonthToDelete(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {availableMonths.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label} ({m.count} items)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDeleteMonth}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Month</span>
                </button>
              </div>
            </div>
          )}

          {/* Reset Danger Zone */}
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Reset Workspace
              </h4>
              <p className="text-rose-600 text-[11px]">Revert to original default dataset for all 5 master brands.</p>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
