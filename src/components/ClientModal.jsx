import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { X } from 'lucide-react';

const COLOR_PRESETS = [
  '#8b5cf6', // Violet (Iron Battalion)
  '#f59e0b', // Amber (Chai pe Charcha)
  '#10b981', // Emerald (Pk Gelato)
  '#ef4444', // Rose/Red (Pk Broast)
  '#ec4899', // Pink (Paras)
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16'  // Lime
];

export default function ClientModal({ isOpen, onClose, clientToEdit }) {
  const { addClient, updateClient } = usePlanner();

  const [formData, setFormData] = useState({
    name: '',
    color: '#8b5cf6',
    postsQuota: 6,
    reelsQuota: 10,
    weeks: [4, 4, 4, 4]
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        color: clientToEdit.color || '#8b5cf6',
        postsQuota: clientToEdit.postsQuota ?? 6,
        reelsQuota: clientToEdit.reelsQuota ?? 10,
        weeks: clientToEdit.weeks ? [...clientToEdit.weeks] : [4, 4, 4, 4]
      });
    } else {
      setFormData({
        name: '',
        color: '#8b5cf6',
        postsQuota: 6,
        reelsQuota: 10,
        weeks: [4, 4, 4, 4]
      });
    }
    setError('');
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleWeekChange = (idx, val) => {
    const updated = [...formData.weeks];
    updated[idx] = parseInt(val, 10) || 0;
    setFormData({ ...formData, weeks: updated });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Brand name is required');
      return;
    }

    if (clientToEdit) {
      updateClient(clientToEdit.id, formData);
    } else {
      addClient(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {clientToEdit ? 'Edit Brand Details' : 'Add New Client Brand'}
            </h3>
            <p className="text-xs text-slate-500">
              Configure deliverables quotas, target distribution and brand color
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Brand Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Brand / Client Name *</label>
            <input
              type="text"
              placeholder="e.g. Iron Battalion, Chai pe Charcha"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            {error && <p className="text-rose-500 text-[10px] mt-1">{error}</p>}
          </div>

          {/* Color Picker & Presets */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Brand Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {COLOR_PRESETS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      formData.color === c ? 'scale-110 border-slate-900 shadow-sm' : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quotas: Posts & Reels */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Posts Quota (1:1)</label>
              <input
                type="number"
                min="0"
                value={formData.postsQuota}
                onChange={e => setFormData({ ...formData, postsQuota: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Reels Quota (9:16)</label>
              <input
                type="number"
                min="0"
                value={formData.reelsQuota}
                onChange={e => setFormData({ ...formData, reelsQuota: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Weekly Allocation Target */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Deliverables Per Week</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map(idx => (
                <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Week {idx + 1}</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.weeks[idx] ?? 0}
                    onChange={e => handleWeekChange(idx, e.target.value)}
                    className="w-full text-center py-1 font-bold bg-white border border-slate-200 rounded text-xs text-slate-800"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all active:scale-95"
            >
              {clientToEdit ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
