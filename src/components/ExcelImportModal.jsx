import React, { useState, useRef, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { parseExcelWorkbook } from '../utils/excelParser';
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Video,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Database
} from 'lucide-react';

export default function ExcelImportModal({ isOpen, onClose }) {
  const { importData, dbType } = usePlanner();

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Configuration options
  const [importScope, setImportScope] = useState('full'); // 'full' | 'client'
  const [selectedClientName, setSelectedClientName] = useState('');
  const [importMode, setImportMode] = useState('replace_all'); // 'replace_all' | 'replace_client' | 'append'
  const [previewSearch, setPreviewSearch] = useState('');

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const parsed = parseExcelWorkbook(buffer);

      if (parsed.deliverables.length === 0 && parsed.clients.length === 0) {
        throw new Error('No deliverables or client sheets found in this Excel spreadsheet. Please ensure standard columns (Date, Title, Format, Status) exist.');
      }

      setParsedData(parsed);
      // Default selected client to first brand found
      if (parsed.clients.length > 0) {
        setSelectedClientName(parsed.clients[0].name);
      }
    } catch (err) {
      console.error('Error parsing excel:', err);
      setError(err.message || 'Failed to read Excel spreadsheet');
      setParsedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Determine which deliverables and clients to feed
  const activeDeliverables = useMemo(() => {
    if (!parsedData) return [];
    if (importScope === 'client' && selectedClientName) {
      return parsedData.deliverables.filter(d => d.client === selectedClientName);
    }
    return parsedData.deliverables;
  }, [parsedData, importScope, selectedClientName]);

  const activeClients = useMemo(() => {
    if (!parsedData) return [];
    if (importScope === 'client' && selectedClientName) {
      const found = parsedData.clients.find(c => c.name === selectedClientName);
      if (found) return [found];
      return [{
        id: `c_${selectedClientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: selectedClientName,
        color: '#8b5cf6',
        postsQuota: 0,
        reelsQuota: 0,
        weeks: [0, 0, 0, 0]
      }];
    }
    return parsedData.clients;
  }, [parsedData, importScope, selectedClientName]);

  // Filter preview deliverables by search term
  const previewDeliverables = useMemo(() => {
    if (!previewSearch.trim()) return activeDeliverables;
    const q = previewSearch.toLowerCase();
    return activeDeliverables.filter(
      d =>
        (d.title || '').toLowerCase().includes(q) ||
        (d.client || '').toLowerCase().includes(q) ||
        (d.caption || '').toLowerCase().includes(q) ||
        (d.status || '').toLowerCase().includes(q)
    );
  }, [activeDeliverables, previewSearch]);

  const handleImportSubmit = async () => {
    if (!parsedData || activeDeliverables.length === 0) return;
    setIsImporting(true);

    try {
      // Determine backend mode
      let modeToSend = 'replace_all';
      if (importScope === 'client') {
        modeToSend = importMode === 'append' ? 'append' : 'replace_client';
      } else {
        modeToSend = importMode === 'append' ? 'append' : 'replace_all';
      }

      const payload = {
        mode: modeToSend,
        client_name: importScope === 'client' ? selectedClientName : null,
        clients: activeClients,
        deliverables: activeDeliverables
      };

      const result = await importData(payload);
      if (result) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetModal = () => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setPreviewSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Import Excel Spreadsheet
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  .xlsx / .xls / .csv
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Feed full master sheets or client-wise deliverable updates directly into {dbType || 'MongoDB'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Step 1: Upload Dropzone if no file selected */}
          {!parsedData ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                isProcessing
                  ? 'border-orange-400 bg-orange-50/20'
                  : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-slate-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={e => handleFile(e.target.files[0])}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />

              {isProcessing ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-800">Parsing Excel Sheets & Deliverables...</p>
                  <p className="text-xs text-slate-500">Extracting quotas, dates, formats, and workflow statuses</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Drag & Drop your Excel file here, or <span className="text-emerald-600 underline">Browse</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Supports Multi-Sheet Master Workbooks (with Master Planner & Brand tabs) or single-sheet deliverable exports.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                    <span>Compatible with: Untitled spreadsheet (3).xlsx</span>
                    <span>•</span>
                    <span>Auto-detects Excel serial dates</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Config and Preview */
            <div className="space-y-5">
              {/* Loaded File Bar */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{file?.name || 'Excel Spreadsheet'}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                        {parsedData.deliverables.length} Deliverables Detected
                      </span>
                    </h5>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Found {parsedData.clients.length} Brands: {parsedData.clients.map(c => c.name).join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetModal}
                  className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Import Configuration Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* 1. Scope Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    1. Select Import Scope
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-400 transition-all">
                      <input
                        type="radio"
                        name="importScope"
                        value="full"
                        checked={importScope === 'full'}
                        onChange={() => setImportScope('full')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Full Workbook ({parsedData.deliverables.length} items across all brands)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Imports all detected sheets and client quotas at once.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-400 transition-all">
                      <input
                        type="radio"
                        name="importScope"
                        value="client"
                        checked={importScope === 'client'}
                        onChange={() => setImportScope('client')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-900 block">
                          Client-Wise Import (Select specific brand)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Target only one specific client's sheet or delivery updates.
                        </span>

                        {importScope === 'client' && (
                          <div className="mt-2.5">
                            <select
                              value={selectedClientName}
                              onChange={e => setSelectedClientName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {parsedData.clients.map(c => {
                                const count = (parsedData.deliverablesByClient[c.name] || []).length;
                                return (
                                  <option key={c.name} value={c.name}>
                                    {c.name} ({count} deliverables)
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2. Import Strategy Mode */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">
                    2. Import Strategy / Database Action
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-400 transition-all">
                      <input
                        type="radio"
                        name="importMode"
                        value="replace"
                        checked={importMode !== 'append'}
                        onChange={() => setImportMode(importScope === 'client' ? 'replace_client' : 'replace_all')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {importScope === 'client'
                            ? `Replace "${selectedClientName}" Deliverables (Recommended)`
                            : 'Clean Overwrite (Replace entire database)'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {importScope === 'client'
                            ? `Cleans out existing deliverables for ${selectedClientName} and loads new sheet, keeping other brands untouched.`
                            : 'Wipes current deliverables & clients and seeds fresh from this workbook.'}
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-white cursor-pointer hover:border-emerald-400 transition-all">
                      <input
                        type="radio"
                        name="importMode"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Append / Merge into Existing Data
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Keeps all current deliverables intact and adds these new entries.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Summary KPI Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium text-[10px] block">Items To Feed</span>
                  <span className="text-base font-black text-slate-900">{activeDeliverables.length}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium text-[10px] block">Brands Affected</span>
                  <span className="text-base font-black text-orange-600">{activeClients.length}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium text-[10px] block">Content Split</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span className="text-purple-600 flex items-center gap-0.5"><Video className="w-3 h-3" /> {activeDeliverables.filter(d => d.format === 'Reel').length}</span>
                    <span>/</span>
                    <span className="text-blue-600 flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> {activeDeliverables.filter(d => d.format === 'Post').length}</span>
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-medium text-[10px] block">Detected Dates</span>
                  <span className="text-[11px] font-bold text-slate-700 truncate block mt-0.5">
                    {parsedData.summary.dateRange}
                  </span>
                </div>
              </div>

              {/* Interactive Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-700 text-xs">
                    Live Data Preview ({previewDeliverables.length} rows)
                  </span>

                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter preview items..."
                      value={previewSearch}
                      onChange={e => setPreviewSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-56 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold sticky top-0 text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-2.5">Week</th>
                        <th className="py-2 px-3">Brand</th>
                        <th className="py-2 px-2.5">Format</th>
                        <th className="py-2 px-3">Title / Hook</th>
                        <th className="py-2 px-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewDeliverables.slice(0, 30).map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{d.date}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap text-slate-500 font-medium">{d.week}</td>
                          <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{d.client}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.format === 'Reel'
                                  ? 'bg-purple-50 text-purple-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {d.format}
                            </span>
                          </td>
                          <td className="py-2 px-3 max-w-xs truncate font-medium text-slate-900" title={d.title}>
                            {d.title}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.status === 'Scheduled'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : d.status === 'In Creation'
                                  ? 'bg-amber-50 text-amber-700'
                                  : d.status === 'Posted'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            Cancel
          </button>

          {parsedData && (
            <button
              onClick={handleImportSubmit}
              disabled={isImporting || activeDeliverables.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Feeding Data into {dbType}...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>
                    Feed {activeDeliverables.length} Deliverables to Database
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
