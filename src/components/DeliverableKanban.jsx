import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { ChevronLeft, ChevronRight, Edit2, Trash2, Video, Image as ImageIcon, Copy } from 'lucide-react';

const COLUMNS = [
  { key: 'Planned', title: 'Planned', color: 'border-purple-400 bg-purple-50 text-purple-700' },
  { key: 'In Creation', title: 'In Creation', color: 'border-amber-400 bg-amber-50 text-amber-700' },
  { key: 'Scheduled', title: 'Scheduled', color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { key: 'Posted', title: 'Live Posted', color: 'border-blue-400 bg-blue-50 text-blue-700' },
];

export default function DeliverableKanban({ items, onEdit }) {
  const { getClientColor, updateStatus, deleteDeliverable, duplicateDeliverable } = usePlanner();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getNextStatus = (currentStatus) => {
    const keys = COLUMNS.map(c => c.key);
    const idx = keys.indexOf(currentStatus);
    if (idx < keys.length - 1) return keys[idx + 1];
    return null;
  };

  const getPrevStatus = (currentStatus) => {
    const keys = COLUMNS.map(c => c.key);
    const idx = keys.indexOf(currentStatus);
    if (idx > 0) return keys[idx - 1];
    return null;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map(col => {
        const colItems = items.filter(d => d.status === col.key);

        return (
          <div key={col.key} className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col max-h-[80vh]">
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full border-2 ${col.color.split(' ')[0]}`}></span>
                <h4 className="text-xs font-bold text-slate-800">{col.title}</h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-xs">
                {colItems.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {colItems.length === 0 ? (
                <div className="bg-white/60 rounded-lg p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  No deliverables in {col.title}
                </div>
              ) : (
                colItems.map(item => {
                  const clientColor = getClientColor(item.client);
                  const prev = getPrevStatus(item.status);
                  const next = getNextStatus(item.status);
                  const isDeleting = confirmDeleteId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-soft hover:shadow-card transition-all flex flex-col justify-between group"
                    >
                      {/* Top client tag */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: clientColor }}
                          ></span>
                          <span className="text-[11px] font-bold text-slate-800 truncate">{item.client}</span>
                        </div>
                        {item.format === 'Reel' ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            <Video className="w-2.5 h-2.5" /> Reel
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            <ImageIcon className="w-2.5 h-2.5" /> Post
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 mb-1.5">
                        {item.title}
                      </h5>

                      {/* Date & Asset */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                        <span>{item.date}</span>
                        <span className="font-semibold text-slate-500 bg-slate-100 px-1 rounded">{item.week}</span>
                      </div>

                      {/* Card Footer with Actions & Move Arrows */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateDeliverable(item.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title="Duplicate as new deliverable"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                            title="Edit deliverable"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item.id)}
                            className={`p-1 rounded transition-all flex items-center gap-0.5 ${
                              isDeleting
                                ? 'bg-rose-600 text-white px-1.5 py-0.2 text-[9px] font-bold shadow-xs animate-pulse'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                            }`}
                            title={isDeleting ? 'Click again to confirm delete' : 'Delete deliverable'}
                          >
                            <Trash2 className="w-3 h-3" />
                            {isDeleting && <span>Del?</span>}
                          </button>
                        </div>

                        {/* Move Buttons */}
                        <div className="flex items-center gap-1">
                          {prev && (
                            <button
                              onClick={() => updateStatus(item.id, prev)}
                              className="px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-100 rounded border border-slate-200 flex items-center"
                              title={`Move back to ${prev}`}
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {next && (
                            <button
                              onClick={() => updateStatus(item.id, next)}
                              className="px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded border border-orange-200 flex items-center"
                              title={`Advance to ${next}`}
                            >
                              <span className="hidden sm:inline mr-0.5 text-[9px]">{next}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
