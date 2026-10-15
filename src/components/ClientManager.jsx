import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Building2, Plus, Edit2, Trash2, Video, Image as ImageIcon } from 'lucide-react';

export default function ClientManager({ onEditClient, onNewClient }) {
  const { clients, deliverables, deleteClient, getClientColor } = usePlanner();

  const handleDelete = (client) => {
    const count = deliverables.filter(d => d.client === client.name).length;
    if (
      window.confirm(
        `Are you sure you want to delete "${client.name}"?\nWarning: This will also remove ${count} associated deliverables!`
      )
    ) {
      deleteClient(client.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Brand Portfolio & Deliverables Quota</h3>
            <p className="text-xs text-slate-500">
              Manage client branding, deliverables quotas, and weekly target distributions.
            </p>
          </div>
        </div>

        <button
          onClick={onNewClient}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map(client => {
          const color = getClientColor(client.name);
          const clientDeliverables = deliverables.filter(d => d.client === client.name);
          const reelsCount = clientDeliverables.filter(d => d.format === 'Reel').length;
          const postsCount = clientDeliverables.filter(d => d.format === 'Post').length;
          const totalQuota = (client.postsQuota || 0) + (client.reelsQuota || 0);

          return (
            <div
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-soft hover:shadow-card transition-all overflow-hidden flex flex-col justify-between"
            >
              {/* Header color accent */}
              <div className="h-2 w-full" style={{ backgroundColor: color }}></div>

              <div className="p-5 flex-1 flex flex-col">
                {/* Brand Title and Abbr */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-xs shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {client.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">{client.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">Brand ID: {client.id}</span>
                    </div>
                  </div>

                  {/* Edit/Delete actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditClient(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit Brand"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quotas Box */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-400 font-medium text-[10px] block">Posts Target</span>
                    <span className="text-sm font-black text-blue-600">{client.postsQuota}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px] block">Reels Target</span>
                    <span className="text-sm font-black text-purple-600">{client.reelsQuota}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium text-[10px] block">Total Target</span>
                    <span className="text-sm font-black text-slate-900">{totalQuota}</span>
                  </div>
                </div>

                {/* Weekly Target Plan */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">Weekly Post Allocation:</div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    {(client.weeks || [0, 0, 0, 0]).map((w, idx) => (
                      <div key={idx} className="bg-slate-100/70 rounded-lg py-1 border border-slate-200/50">
                        <span className="text-[9px] text-slate-400 block font-bold">W{idx + 1}</span>
                        <span className="font-bold text-slate-800">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actual Deliverables stats */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Live Pipeline:</span>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-purple-600">{reelsCount} Reels</span>
                    <span>•</span>
                    <span className="text-blue-600">{postsCount} Posts</span>
                    <span className="bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded text-[10px]">
                      {clientDeliverables.length} Total
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Brand Card */}
        <div
          onClick={onNewClient}
          className="bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 hover:bg-orange-50/20 transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] group"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-orange-100 text-slate-400 group-hover:text-orange-600 flex items-center justify-center transition-colors mb-3">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 group-hover:text-orange-600 transition-colors">
            Add Another Brand
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Configure new client deliverable quotas, custom brand palette, and weekly targets.
          </p>
        </div>
      </div>
    </div>
  );
}
