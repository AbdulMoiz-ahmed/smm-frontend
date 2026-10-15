import React, { useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import FilterBar from './FilterBar';
import DeliverableGrid from './DeliverableGrid';
import DeliverableTable from './DeliverableTable';
import DeliverableKanban from './DeliverableKanban';
import { Plus, Video, Image as ImageIcon, CheckCircle, BarChart3, Calendar } from 'lucide-react';

export default function ClientDetailView({ clientId, onEditDeliverable, onNewDeliverableForClient }) {
  const { clients, deliverables, getClientColor } = usePlanner();
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    search: '',
    week: 'All',
    format: 'All',
    status: 'All'
  });

  const client = clients.find(c => c.id === clientId) || clients[0];
  const clientColor = getClientColor(client?.name);

  // Deliverables for this client
  const clientDeliverables = useMemo(() => {
    return deliverables.filter(d => d.client === client?.name);
  }, [deliverables, client]);

  // Deliverable metrics
  const clientReels = clientDeliverables.filter(d => d.format === 'Reel').length;
  const clientPosts = clientDeliverables.filter(d => d.format === 'Post').length;
  const clientScheduled = clientDeliverables.filter(d => d.status === 'Scheduled').length;
  const clientPosted = clientDeliverables.filter(d => d.status === 'Posted').length;

  const totalQuota = (client?.postsQuota || 0) + (client?.reelsQuota || 0);
  const totalActual = clientDeliverables.length;
  const progressPercent = totalQuota > 0 ? Math.round((totalActual / totalQuota) * 100) : 0;

  // Dynamically detect sprint month from client's deliverables
  const clientSprintLabel = useMemo(() => {
    for (const d of clientDeliverables) {
      if (d.date) {
        const parts = d.date.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          if (!isNaN(dt.getTime())) {
            return `${dt.toLocaleString('en-US', { month: 'long' })} Sprint`;
          }
        }
      }
    }
    return 'Active Sprint';
  }, [clientDeliverables]);

  // Filtered deliverables
  const filteredDeliverables = useMemo(() => {
    return clientDeliverables.filter(item => {
      if (filters.week !== 'All' && item.week !== filters.week) return false;
      if (filters.format !== 'All' && item.format !== filters.format) return false;
      if (filters.status !== 'All' && item.status !== filters.status) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const captionMatch = (item.caption || '').toLowerCase().includes(query);
        const assetMatch = (item.asset || '').toLowerCase().includes(query);
        if (!titleMatch && !captionMatch && !assetMatch) return false;
      }
      return true;
    });
  }, [clientDeliverables, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ search: '', week: 'All', format: 'All', status: 'All' });
  };

  if (!client) {
    return <div className="p-8 text-center text-slate-500">Client not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Brand Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: clientColor }}></div>
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Brand Info */}
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shrink-0"
              style={{ backgroundColor: clientColor }}
            >
              {client.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {client.name}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                  {clientSprintLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>Total Target: <strong>{totalQuota} Items</strong></span>
                <span>•</span>
                <span>Scheduled/Planned: <strong>{totalActual} Items</strong></span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{clientScheduled + clientPosted} Ready/Posted</span>
              </p>
            </div>
          </div>

          {/* Quick CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNewDeliverableForClient(client.name)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95"
              style={{ backgroundColor: clientColor }}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add for {client.name}</span>
            </button>
          </div>
        </div>

        {/* Quota vs Actual Mini Dashboard Strip */}
        <div className="bg-slate-50/80 border-t border-slate-200 px-5 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
          {/* Posts Quota */}
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block mb-1">Posts Quota</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-blue-600">{clientPosts}</span>
              <span className="text-slate-400 font-medium">/ {client.postsQuota} target</span>
            </div>
          </div>

          {/* Reels Quota */}
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block mb-1">Reels Quota</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-purple-600">{clientReels}</span>
              <span className="text-slate-400 font-medium">/ {client.reelsQuota} target</span>
            </div>
          </div>

          {/* Fulfillment % */}
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium block mb-1">Quota Filled</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-600">{progressPercent}%</span>
              <span className="text-slate-400 font-medium">({totalActual}/{totalQuota})</span>
            </div>
          </div>

          {/* Weekly Allocation Target */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 col-span-2 sm:col-span-3">
            <span className="text-slate-500 font-medium block mb-1">Weekly Target Plan</span>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              {(client.weeks || [0, 0, 0, 0]).map((w, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg py-1 border border-slate-100">
                  <div className="text-slate-400 font-semibold text-[10px]">Wk {idx + 1}</div>
                  <div className="font-bold text-slate-800">{w} posts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showBrandFilter={false}
      />

      {/* Deliverables Output */}
      {viewMode === 'grid' && (
        <DeliverableGrid
          items={filteredDeliverables}
          onEdit={onEditDeliverable}
          onNewDeliverable={() => onNewDeliverableForClient(client.name)}
          onResetFilters={handleResetFilters}
        />
      )}

      {viewMode === 'table' && (
        <DeliverableTable items={filteredDeliverables} onEdit={onEditDeliverable} />
      )}

      {viewMode === 'kanban' && (
        <DeliverableKanban items={filteredDeliverables} onEdit={onEditDeliverable} />
      )}
    </div>
  );
}
