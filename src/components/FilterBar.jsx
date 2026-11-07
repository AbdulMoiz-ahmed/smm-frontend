import React, { useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Search, LayoutGrid, Table, Kanban, X, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode,
  onViewModeChange,
  showBrandFilter = true,
  showMonthFilter = true,
  resultCount
}) {
  const { clients, deliverables, roleRestrictedFormat } = usePlanner();

  // Dynamically extract all available months from deliverables
  const availableMonths = useMemo(() => {
    const map = {};
    deliverables.forEach(d => {
      if (d.date && /^\d{4}-\d{2}/.test(d.date)) {
        const ym = d.date.slice(0, 7);
        map[ym] = (map[ym] || 0) + 1;
      }
    });
    return Object.keys(map).sort().map(ym => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        key: ym,
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        count: map[ym]
      };
    });
  }, [deliverables]);

  // Dynamically extract all weeks from live deliverables data (scoped to month if selected)
  const availableWeeks = useMemo(() => {
    const weeksSet = new Set(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
    const targetDeliverables = (filters.month && filters.month !== 'All')
      ? deliverables.filter(d => d.date && d.date.startsWith(filters.month))
      : deliverables;

    targetDeliverables.forEach(d => {
      if (d.week && d.week.trim()) weeksSet.add(d.week.trim());
    });
    return Array.from(weeksSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [deliverables, filters.month]);

  const hasActiveFilters =
    filters.search ||
    (showBrandFilter && filters.brand !== 'All') ||
    (filters.month && filters.month !== 'All') ||
    filters.week !== 'All' ||
    filters.format !== 'All' ||
    filters.status !== 'All' ||
    (filters.datePreset && filters.datePreset !== 'All');

  return (
    <section aria-label="Search and filter deliverables" className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      {/* Search and Dropdowns */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5 flex-1 min-w-0">
        {/* Search Input */}
        <div className="relative col-span-2 w-full sm:w-auto sm:min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            aria-label="Search deliverables"
            type="text"
            placeholder="Search titles, captions, specs..."
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-8 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400 transition-all"
          />
          {filters.search && (
              <button
                type="button"
                aria-label="Clear search"
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
            aria-label="Filter by brand"
            value={filters.brand}
            onChange={e => onFilterChange('brand', e.target.value)}
            className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Brands</option>
            {clients.map(c => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {/* Dynamic Month Filter */}
        {showMonthFilter && availableMonths.length > 0 && (
          <select
            aria-label="Filter by month"
            value={filters.month || 'All'}
            onChange={e => onFilterChange('month', e.target.value)}
            className={`w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer ${
              filters.month && filters.month !== 'All'
                ? 'bg-orange-50 border border-orange-300 text-orange-900 font-bold'
                : 'bg-slate-50 border border-slate-200 text-slate-700'
            }`}
          >
            <option value="All">All Months ({deliverables.length})</option>
            {availableMonths.map(m => (
              <option key={m.key} value={m.key}>
                📅 {m.label} ({m.count})
              </option>
            ))}
          </select>
        )}

        {/* Dynamic Week Filter */}
        <select
          aria-label="Filter by week"
          value={filters.week}
          onChange={e => onFilterChange('week', e.target.value)}
          className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
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
          <div className="col-span-2 px-2.5 py-1.5 text-xs bg-orange-50 border border-orange-200 rounded-lg text-orange-800 font-bold flex items-center gap-1.5 shadow-2xs">
            <span>{roleRestrictedFormat === 'Reel' ? '🎬 Reels Only' : '🎨 Posts Only'}</span>
          </div>
        ) : (
          <select
            aria-label="Filter by format"
            value={filters.format}
            onChange={e => onFilterChange('format', e.target.value)}
            className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
          >
            <option value="All">All Formats</option>
            <option value="Reel">Reels (9:16)</option>
            <option value="Post">Posts (1:1)</option>
          </select>
        )}

        {/* Status Filter */}
        <select
          aria-label="Filter by status"
          value={filters.status}
          onChange={e => onFilterChange('status', e.target.value)}
          className="w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Creation">In Creation</option>
          <option value="Planned">Planned</option>
          <option value="Posted">Posted</option>
        </select>

        {/* Quick Date Scope Filter */}
        <select
          aria-label="Filter by date"
          value={filters.datePreset || 'All'}
          onChange={e => onFilterChange('datePreset', e.target.value)}
          className={`w-full sm:w-auto min-w-0 px-2.5 py-2 sm:py-1.5 text-xs rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer ${
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
            type="button"
            aria-label="Clear all filters"
            onClick={onResetFilters}
            className="col-span-2 justify-center sm:justify-start inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* View Switcher (Grid, Table, Kanban) */}
      <div className="flex items-center justify-between gap-3 self-stretch lg:self-center">
        {typeof resultCount === 'number' && <p className="text-xs text-slate-500 whitespace-nowrap"><span className="font-semibold text-slate-700">{resultCount}</span> deliverables</p>}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
    </section>
  );
}
