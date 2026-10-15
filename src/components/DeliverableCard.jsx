import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Video, Image as ImageIcon, Calendar, ClipboardCopy, Check, Edit2, Trash2, Copy, AlertCircle } from 'lucide-react';

export default function DeliverableCard({ item, onEdit }) {
  const { getClientColor, updateStatus, deleteDeliverable, duplicateDeliverable, addToast } = usePlanner();
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const clientColor = getClientColor(item.client);

  const handleCopyCaption = () => {
    if (!item.caption) return;
    navigator.clipboard.writeText(item.caption);
    setCopied(true);
    addToast('Caption copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      deleteDeliverable(item.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3500);
    }
  };

  // Status style maps
  const statusStyles = {
    'Scheduled': 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400',
    'In Creation': 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400',
    'Planned': 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-400',
    'Posted': 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-soft hover:shadow-card hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Client Color Accent Strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: clientColor }}></div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Card Header: Client & Format */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: clientColor }}
            ></span>
            <span className="text-xs font-bold text-slate-800 truncate">{item.client}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {item.format === 'Reel' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Video className="w-2.5 h-2.5" /> Reel
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <ImageIcon className="w-2.5 h-2.5" /> Post
              </span>
            )}
          </div>
        </div>

        {/* Date & Week tag */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
          <span className="inline-flex items-center gap-1 font-medium">
            <Calendar className="w-3 h-3 text-slate-400" />
            {item.date || 'No Date'}
          </span>
          <span>•</span>
          <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
            {item.week}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Asset specifications */}
        {item.asset && (
          <div className="mb-3">
            <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
              📐 {item.asset}
            </span>
          </div>
        )}

        {/* Caption snippet with clipboard button */}
        {item.caption && (
          <div className="mt-auto pt-2.5 border-t border-slate-100">
            <div className="flex items-start justify-between gap-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <p className="line-clamp-2 italic pr-1">"{item.caption}"</p>
              <button
                onClick={handleCopyCaption}
                className="text-slate-400 hover:text-slate-700 p-1 shrink-0 rounded hover:bg-slate-200/60 transition-colors"
                title="Copy caption text to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Status Selector & Actions */}
      <div className="bg-slate-50/70 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Status Dropdown */}
        <select
          value={item.status}
          onChange={e => updateStatus(item.id, e.target.value)}
          className={`text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none focus:ring-2 transition-all ${
            statusStyles[item.status] || 'bg-slate-100 text-slate-700'
          }`}
        >
          <option value="Planned">Planned</option>
          <option value="In Creation">In Creation</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Posted">Posted</option>
        </select>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Duplicate Button */}
          <button
            onClick={() => duplicateDeliverable(item.id)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Duplicate as new deliverable"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(item)}
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit deliverable"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* 2-Step Safe Delete Button (Zero window.confirm blocking) */}
          <button
            onClick={handleDeleteClick}
            className={`p-1 rounded transition-all flex items-center gap-1 ${
              confirmDelete
                ? 'bg-rose-600 text-white px-2 py-0.5 text-[10px] font-bold shadow-xs animate-pulse'
                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
            }`}
            title={confirmDelete ? 'Click again to confirm delete' : 'Delete deliverable'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmDelete && <span>Delete?</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
