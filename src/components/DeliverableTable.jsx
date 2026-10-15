import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Video, Image as ImageIcon, Edit2, Trash2, Copy, ClipboardCopy, Check, ArrowUpDown } from 'lucide-react';

export default function DeliverableTable({ items, onEdit }) {
  const { getClientColor, updateStatus, deleteDeliverable, duplicateDeliverable, addToast } = usePlanner();
  const [copiedId, setCopiedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(true);

  const handleCopyCaption = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Caption copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteClick = (id) => {
    if (confirmDeleteId === id) {
      deleteDeliverable(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => {
        setConfirmDeleteId(prev => (prev === id ? null : prev));
      }, 3500);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  const statusStyles = {
    'Scheduled': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Creation': 'bg-amber-50 text-amber-700 border-amber-200',
    'Planned': 'bg-purple-50 text-purple-700 border-purple-200',
    'Posted': 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              <th className="py-3 px-4 cursor-pointer hover:text-slate-800" onClick={() => handleSort('client')}>
                <div className="flex items-center gap-1">
                  <span>Brand</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('format')}>
                <div className="flex items-center gap-1">
                  <span>Format</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('date')}>
                <div className="flex items-center gap-1">
                  <span>Date & Week</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[240px] cursor-pointer hover:text-slate-800" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  <span>Title & Content Specs</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 min-w-[200px]">Caption & Message</th>
              <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {sortedItems.map(item => {
              const color = getClientColor(item.client);
              const isDeleting = confirmDeleteId === item.id;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  {/* Brand */}
                  <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: color }}></span>
                      <span>{item.client}</span>
                    </div>
                  </td>

                  {/* Format */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.format === 'Reel' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Video className="w-2.5 h-2.5" /> Reel
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <ImageIcon className="w-2.5 h-2.5" /> Post
                      </span>
                    )}
                  </td>

                  {/* Date & Week */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{item.date}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{item.week}</div>
                  </td>

                  {/* Title & Asset */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{item.title}</div>
                    {item.asset && (
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span className="text-orange-600 font-medium">📐 {item.asset}</span>
                      </div>
                    )}
                  </td>

                  {/* Caption */}
                  <td className="py-3 px-4">
                    {item.caption ? (
                      <div className="flex items-center justify-between gap-2 max-w-xs">
                        <span className="line-clamp-1 italic text-slate-600 text-[11px]">"{item.caption}"</span>
                        <button
                          onClick={() => handleCopyCaption(item.id, item.caption)}
                          className="text-slate-400 hover:text-slate-700 p-1 shrink-0 rounded hover:bg-slate-200 transition-colors"
                          title="Copy caption text to clipboard"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300 italic text-[11px]">No caption</span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-1 ${
                        statusStyles[item.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Creation">In Creation</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Posted">Posted</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Duplicate */}
                      <button
                        onClick={() => duplicateDeliverable(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Duplicate as new deliverable"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit deliverable"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Safe 2-Step Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className={`p-1 rounded transition-all flex items-center gap-1 ${
                          isDeleting
                            ? 'bg-rose-600 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs animate-pulse'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                        title={isDeleting ? 'Click again to confirm delete' : 'Delete deliverable'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isDeleting && <span>Confirm?</span>}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
