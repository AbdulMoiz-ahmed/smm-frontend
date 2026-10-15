import React from 'react';
import DeliverableCard from './DeliverableCard';
import { Layers, Plus } from 'lucide-react';

export default function DeliverableGrid({ items, onEdit, onNewDeliverable, onResetFilters }) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center my-6">
        <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No deliverables found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No items match the currently selected filters. You can clear your filters or schedule a new deliverable.
        </p>
        <div className="flex items-center justify-center gap-3 mt-4">
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Clear Filters
            </button>
          )}
          {onNewDeliverable && (
            <button
              onClick={onNewDeliverable}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Deliverable</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map(item => (
        <DeliverableCard key={item.id} item={item} onEdit={onEdit} />
      ))}
    </div>
  );
}
