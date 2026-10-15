import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { X, Video, Image as ImageIcon, Sparkles } from 'lucide-react';

export default function DeliverableModal({ isOpen, onClose, deliverableToEdit, defaultClient, defaultDate }) {
  const { clients, deliverables, addDeliverable, updateDeliverable, roleRestrictedFormat } = usePlanner();

  // Compute smart fallback date from existing deliverables or today
  const defaultInitialDate = defaultDate || (deliverables[0]?.date ? deliverables[0].date : new Date().toISOString().slice(0, 10));

  const [formData, setFormData] = useState({
    client: clients[0]?.name || '',
    format: roleRestrictedFormat || 'Reel',
    date: defaultInitialDate,
    week: 'Week 1',
    title: '',
    asset: (roleRestrictedFormat === 'Post' ? '1:1 Infographic Carousel' : '9:16 Coaching Video'),
    caption: '',
    status: 'Planned'
  });

  const [errors, setErrors] = useState({});

  // Auto-calculate week from date
  const computeWeek = (dateStr) => {
    if (!dateStr) return 'Week 1';
    const day = parseInt(dateStr.split('-')[2], 10);
    if (isNaN(day)) return 'Week 1';
    if (day <= 7) return 'Week 1';
    if (day <= 14) return 'Week 2';
    if (day <= 21) return 'Week 3';
    return 'Week 4';
  };

  useEffect(() => {
    const forcedFormat = roleRestrictedFormat || deliverableToEdit?.format || 'Reel';
    if (deliverableToEdit) {
      setFormData({
        client: deliverableToEdit.client || clients[0]?.name || '',
        format: forcedFormat,
        date: deliverableToEdit.date || defaultInitialDate,
        week: deliverableToEdit.week || computeWeek(deliverableToEdit.date),
        title: deliverableToEdit.title || '',
        asset: deliverableToEdit.asset || '',
        caption: deliverableToEdit.caption || '',
        status: deliverableToEdit.status || 'Planned'
      });
    } else {
      const initDate = defaultDate || defaultInitialDate;
      setFormData({
        client: defaultClient || clients[0]?.name || '',
        format: forcedFormat,
        date: initDate,
        week: computeWeek(initDate),
        title: '',
        asset: forcedFormat === 'Post' ? '1:1 Infographic Carousel' : '9:16 Cinematic Video',
        caption: '',
        status: 'Planned'
      });
    }
    setErrors({});
  }, [deliverableToEdit, defaultClient, defaultDate, defaultInitialDate, isOpen, clients, roleRestrictedFormat]);

  if (!isOpen) return null;

  const handleDateChange = (newDate) => {
    const computed = computeWeek(newDate);
    setFormData(prev => ({
      ...prev,
      date: newDate,
      week: computed
    }));
  };

  const handleFormatChange = (fmt) => {
    setFormData(prev => ({
      ...prev,
      format: fmt,
      asset: fmt === 'Reel' ? '9:16 Short-form Video' : '1:1 Infographic Carousel'
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.client) newErrors.client = 'Client is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (deliverableToEdit) {
      updateDeliverable(deliverableToEdit.id, formData);
    } else {
      addDeliverable(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {deliverableToEdit ? 'Edit Deliverable' : 'New Content Deliverable'}
            </h3>
            <p className="text-xs text-slate-500">
              {deliverableToEdit ? 'Modify scheduling, asset specifications or caption' : 'Add a new post or reel to the editorial pipeline'}
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
          {/* Row 1: Client & Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand Client *</label>
              <select
                value={formData.client}
                onChange={e => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.client && <p className="text-rose-500 text-[10px] mt-1">{errors.client}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700">Content Format</label>
                {roleRestrictedFormat && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                    {roleRestrictedFormat === 'Reel' ? '🎬 Reels Only' : '🎨 Posts Only'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={roleRestrictedFormat === 'Post'}
                  onClick={() => handleFormatChange('Reel')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    formData.format === 'Reel'
                      ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                      : roleRestrictedFormat === 'Post'
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Reel (9:16)</span>
                </button>
                <button
                  type="button"
                  disabled={roleRestrictedFormat === 'Reel'}
                  onClick={() => handleFormatChange('Post')}
                  className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    formData.format === 'Post'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                      : roleRestrictedFormat === 'Reel'
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Post (1:1)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Date, Week, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Publish Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Sprint Week</label>
              <select
                value={formData.week}
                onChange={e => setFormData({ ...formData, week: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Week 1">Week 1</option>
                <option value="Week 2">Week 2</option>
                <option value="Week 3">Week 3</option>
                <option value="Week 4">Week 4</option>
                {formData.week && !['Week 1', 'Week 2', 'Week 3', 'Week 4'].includes(formData.week) && (
                  <option value={formData.week}>{formData.week}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Workflow Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="Planned">Planned</option>
                <option value="In Creation">In Creation</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Posted">Posted</option>
              </select>
            </div>
          </div>

          {/* Row 3: Title */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Deliverable Title / Headline *</label>
            <input
              type="text"
              placeholder='e.g. "Stop rounding your back: 3 deadlift setup cues"'
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
                errors.title ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'
              }`}
            />
            {errors.title && <p className="text-rose-500 text-[10px] mt-1">{errors.title}</p>}
          </div>

          {/* Row 4: Asset Specifications */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Creative Asset Specifications</label>
            <input
              type="text"
              placeholder="e.g. 9:16 Coaching Video, 1:1 Educational Carousel, Audio Reel"
              value={formData.asset}
              onChange={e => setFormData({ ...formData, asset: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          {/* Row 5: Caption & Core Focus */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Core Message & Caption Focus</label>
            <textarea
              rows={3}
              placeholder="e.g. Fix hip height and lat lock before pulling heavy iron #PowerliftingForm"
              value={formData.caption}
              onChange={e => setFormData({ ...formData, caption: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
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
              {deliverableToEdit ? 'Save Changes' : 'Create Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
