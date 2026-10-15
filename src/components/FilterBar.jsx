import React, { useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Search, LayoutGrid, Table, Kanban, X, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  showBrandFilter = true
}) {
  const { clients, deliverables, roleRestrictedFormat } = usePlanner();

  // Dynamically extract all weeks from live deliverables data
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
    deliverables.forEach(d => {
      if (d.week && d.week.trim()) weeksSet.add(d.week.trim());
    });
    return Array.from(weeksSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [deliverables]);

  const hasActiveFilters =
    filters.search ||
    (showBrandFilter && filters.brand !== 'All') ||
    filters.week !== 'All' ||
    filters.format !== 'All' ||
    filters.status !== 'All' ||
    (filters.datePreset && filters.datePreset !== 'All');

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-soft mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Search and Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search titles, captions, specs..."
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Brand Filter */}
        {showBrandFilter && (
          <select
            value={filters.brand}
            onChange={e => onFilterChange('brand', e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Brands</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Dynamic Week Filter */}
        <select
          value={filters.week}
          onChange={e => onFilterChange('week', e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
        >
          <option value="All">All Weeks</option>
          {availableWeeks.map(w => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        {/* Format Filter */}
        {roleRestrictedFormat ? (
          <div className="px-2.5 py-1.5 text-xs bg-orange-50 border border-orange-200 rounded-lg text-orange-800 font-bold flex items-center gap-1.5 shadow-2xs">
            <span>{roleRestrictedFormat === 'Reel' ? '🎬 Reels Only' : '🎨 Posts Only'}</span>
          </div>
        ) : (
          <select
            value={filters.format}
            onChange={e => onFilterChange('format', e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Formats</option>
            <option value="Reel">Reels (9:16)</option>
            <option value="Post">Posts (1:1)</option>
          </select>
        )}

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={e => onFilterChange('status', e.target.value)}
          className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Creation">In Creation</option>
          <option value="Planned">Planned</option>
          <option value="Posted">Posted</option>
        </select>

        {/* Quick Date Scope Filter */}
        <select
          value={filters.datePreset || 'All'}
          onChange={e => onFilterChange('datePreset', e.target.value)}
          className={`px-2.5 py-1.5 text-xs rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer ${
            filters.datePreset === 'pending-till-today'
              ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold'
              : filters.datePreset === 'today'
              ? 'bg-orange-50 border border-orange-300 text-orange-900 font-bold'
              : 'bg-slate-50 border border-slate-200 text-slate-700'
          }`}
        >
          <option value="All">All Dates</option>
          <option value="pending-till-today">⚡ Pending Till Today</option>
          <option value="today">📅 Today Only</option>
        </select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* View Switcher (Grid, Table, Kanban) */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end lg:self-center">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'grid'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Grid Card View"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => onViewModeChange('table')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'table'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Table Spreadsheet View"
        >
          <Table className="w-3.5 h-3.5" />
          <span>Table</span>
        </button>

        <button
          onClick={() => onViewModeChange('kanban')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
            viewMode === 'kanban'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Kanban Board View"
        >
          <Kanban className="w-3.5 h-3.5" />
          <span>Kanban</span>
        </button>
      </div>
    </div>
  );
}
