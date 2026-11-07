import React, { useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  Calendar,
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Video,
  Image as ImageIcon,
  TrendingUp,
  BarChart3,
  Layers,
  ArrowRight,
  Filter,
  Trash2
} from 'lucide-react';

export default function MonthlyReportView({ onSelectTab, onFilterMonthInMaster }) {
  const { clients, deliverables, getClientColor, deleteMonthDeliverables } = usePlanner();

  // Extract all available months from deliverables
  const availableMonths = useMemo(() => {
    const map = {};
    deliverables.forEach(d => {
      if (d.date && /^\d{4}-\d{2}/.test(d.date)) {
        const ym = d.date.slice(0, 7);
        map[ym] = (map[ym] || 0) + 1;
      }
    });

    const sortedYms = Object.keys(map).sort().reverse(); // Most recent first
    return sortedYms.map(ym => {
      const [y, m] = ym.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      return {
        key: ym,
        label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        monthName: d.toLocaleString('en-US', { month: 'long' }),
        year: y,
        count: map[ym]
      };
    });
  }, [deliverables]);

  // Default to the first available month (most recent) or 'All'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return availableMonths.length > 0 ? availableMonths[0].key : 'All';
  });

  const [selectedBrand, setSelectedBrand] = useState('All');

  // Filter deliverables by chosen month and brand
  const monthDeliverables = useMemo(() => {
    return deliverables.filter(d => {
      if (selectedMonth !== 'All' && !(d.date && d.date.startsWith(selectedMonth))) return false;
      if (selectedBrand !== 'All' && d.client !== selectedBrand) return false;
      return true;
    });
  }, [deliverables, selectedMonth, selectedBrand]);

  // Selected month metadata
  const currentMonthMeta = useMemo(() => {
    if (selectedMonth === 'All') {
      return { label: 'All Months Combined', count: monthDeliverables.length };
    }
    const found = availableMonths.find(m => m.key === selectedMonth);
    return found || { label: selectedMonth, count: monthDeliverables.length };
  }, [selectedMonth, availableMonths, monthDeliverables]);

  // Overall Monthly Metrics
  const metrics = useMemo(() => {
    const total = monthDeliverables.length;
    const posted = monthDeliverables.filter(d => d.status === 'Posted').length;
    const scheduled = monthDeliverables.filter(d => d.status === 'Scheduled').length;
    const inCreation = monthDeliverables.filter(d => d.status === 'In Creation').length;
    const planned = monthDeliverables.filter(d => d.status === 'Planned').length;

    const reels = monthDeliverables.filter(d => d.format === 'Reel').length;
    const posts = monthDeliverables.filter(d => d.format === 'Post').length;

    const completionRate = total > 0 ? Math.round(((posted + scheduled) / total) * 100) : 0;
    const postedRate = total > 0 ? Math.round((posted / total) * 100) : 0;

    return {
      total,
      posted,
      scheduled,
      inCreation,
      planned,
      reels,
      posts,
      completionRate,
      postedRate
    };
  }, [monthDeliverables]);

  // Client Breakdown for this month
  const clientBreakdown = useMemo(() => {
    return clients.map(client => {
      const items = monthDeliverables.filter(d => d.client === client.name);
      const posted = items.filter(d => d.status === 'Posted').length;
      const scheduled = items.filter(d => d.status === 'Scheduled').length;
      const inCreation = items.filter(d => d.status === 'In Creation').length;
      const planned = items.filter(d => d.status === 'Planned').length;
      const reels = items.filter(d => d.format === 'Reel').length;
      const posts = items.filter(d => d.format === 'Post').length;

      // Week by week distribution
      const w1 = items.filter(d => d.week === 'Week 1').length;
      const w2 = items.filter(d => d.week === 'Week 2').length;
      const w3 = items.filter(d => d.week === 'Week 3').length;
      const w4 = items.filter(d => d.week === 'Week 4').length;

      const monthlyQuota = (client.postsQuota || 0) + (client.reelsQuota || 0);
      const fulfillment = monthlyQuota > 0 ? Math.round((items.length / monthlyQuota) * 100) : 0;

      return {
        ...client,
        totalInMonth: items.length,
        posted,
        scheduled,
        inCreation,
        planned,
        reels,
        posts,
        w1,
        w2,
        w3,
        w4,
        monthlyQuota,
        fulfillment
      };
    }).filter(c => selectedBrand === 'All' || c.name === selectedBrand);
  }, [clients, monthDeliverables, selectedBrand]);

  // Weekly aggregate distribution
  const weeklyDistribution = useMemo(() => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map(w => {
      const items = monthDeliverables.filter(d => d.week === w);
      const posted = items.filter(d => d.status === 'Posted').length;
      const scheduled = items.filter(d => d.status === 'Scheduled').length;
      const inCreation = items.filter(d => d.status === 'In Creation').length;
      const planned = items.filter(d => d.status === 'Planned').length;
      return {
        week: w,
        total: items.length,
        posted,
        scheduled,
        inCreation,
        planned,
        reels: items.filter(d => d.format === 'Reel').length,
        posts: items.filter(d => d.format === 'Post').length,
      };
    });
  }, [monthDeliverables]);

  // Export Month CSV
  const handleExportMonthCSV = () => {
    const headers = ['ID', 'Client', 'Date', 'Month', 'Week', 'Format', 'Title', 'Asset Type', 'Caption Focus', 'Status'];
    const rows = monthDeliverables.map(d => [
      d.id,
      `"${(d.client || '').replace(/"/g, '""')}"`,
      d.date,
      selectedMonth,
      d.week,
      d.format,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.asset || '').replace(/"/g, '""')}"`,
      `"${(d.caption || '').replace(/"/g, '""')}"`,
      d.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteCurrentMonth = async () => {
    if (selectedMonth === 'All') return;
    const count = monthDeliverables.length;
    if (window.confirm(`Are you sure you want to permanently delete all ${count} deliverables for ${currentMonthMeta.label}? All other months will remain completely intact.`)) {
      await deleteMonthDeliverables(selectedMonth, currentMonthMeta.label);
      setSelectedMonth('All');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Top Banner / Month Selector Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Monthly Deliverables & Performance Report
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  {currentMonthMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executive month-by-month content breakdown, quota completion, and delivery cadence
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0 print:hidden">
            <button
              onClick={handleExportMonthCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            {selectedMonth !== 'All' && (
              <button
                onClick={handleDeleteCurrentMonth}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all active:scale-95 cursor-pointer"
                title={`Delete all deliverables for ${currentMonthMeta.label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Month</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Selector Pills & Brand Filter */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          {/* Month Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 mr-1.5 shrink-0">Filter Month:</span>
            <button
              onClick={() => setSelectedMonth('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedMonth === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Months ({deliverables.length})
            </button>
            {availableMonths.map(m => (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedMonth === m.key
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-900 text-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{m.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  selectedMonth === m.key ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {m.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filter by Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Brand:</span>
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="All">All Client Brands</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Deliverables */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Month Deliverables</span>
            <span className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {metrics.total}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="text-purple-600 font-bold flex items-center gap-1">
              <Video className="w-3.5 h-3.5" /> {metrics.reels} Reels
            </span>
            <span>•</span>
            <span className="text-blue-600 font-bold flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" /> {metrics.posts} Posts
            </span>
          </div>
        </div>

        {/* Live Posted Rate */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>Posted to Feed</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2 tracking-tight">
            {metrics.posted}
            <span className="text-sm font-semibold text-slate-400 ml-2">/ {metrics.total}</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Completion rate</span>
            <span className="font-bold text-emerald-700">{metrics.postedRate}%</span>
          </div>
        </div>

        {/* Ready & Scheduled */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>Scheduled & Approved</span>
            <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-sky-600 mt-2 tracking-tight">
            {metrics.scheduled}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Ready for publishing</span>
            <span className="font-bold text-sky-700">
              {metrics.total > 0 ? Math.round((metrics.scheduled / metrics.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* In Production / Planned */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>In Pipeline</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2 tracking-tight">
            {metrics.inCreation + metrics.planned}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">{metrics.inCreation} Creating • {metrics.planned} Planned</span>
            <span className="font-bold text-amber-700">Active</span>
          </div>
        </div>
      </div>

      {/* Brand Quota & Deliverables Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Client Brand Breakdown ({currentMonthMeta.label})
            </h3>
            <p className="text-xs text-slate-500">
              Agreed monthly targets vs actual deliveries scheduled across weeks
            </p>
          </div>
          {onFilterMonthInMaster && selectedMonth !== 'All' && (
            <button
              onClick={() => onFilterMonthInMaster(selectedMonth)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-colors shrink-0 print:hidden"
            >
              <span>View in Master Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Client Brand</th>
                <th className="py-3 px-3 text-center">Month Target</th>
                <th className="py-3 px-3 text-center font-black text-slate-900">Scheduled in Month</th>
                <th className="py-3 px-3 text-center">Reels (9:16)</th>
                <th className="py-3 px-3 text-center">Posts (1:1)</th>
                <th className="py-3 px-3 text-center">W1</th>
                <th className="py-3 px-3 text-center">W2</th>
                <th className="py-3 px-3 text-center">W3</th>
                <th className="py-3 px-3 text-center">W4</th>
                <th className="py-3 px-3 text-center">Posted</th>
                <th className="py-3 px-4 text-center">Target Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {clientBreakdown.map(c => {
                const color = getClientColor(c.name);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-slate-500">
                      {c.monthlyQuota > 0 ? `${c.monthlyQuota} items` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm text-slate-900">
                      {c.totalInMonth}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-purple-700">
                      {c.reels}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-blue-700">
                      {c.posts}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600">{c.w1}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{c.w2}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{c.w3}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{c.w4}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {c.posted}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              c.fulfillment >= 100
                                ? 'bg-emerald-500'
                                : c.fulfillment >= 75
                                ? 'bg-sky-500'
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${Math.min(c.fulfillment, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] w-9 text-right text-slate-800">
                          {c.fulfillment}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50/90 font-black border-t-2 border-slate-200 text-slate-900">
                <td className="py-3 px-4 uppercase text-[10px] tracking-wider text-slate-500">Total Agency Output</td>
                <td className="py-3 px-3 text-center">
                  {clientBreakdown.reduce((sum, c) => sum + (c.monthlyQuota || 0), 0)}
                </td>
                <td className="py-3 px-3 text-center text-orange-600 text-sm">
                  {metrics.total}
                </td>
                <td className="py-3 px-3 text-center text-purple-700">{metrics.reels}</td>
                <td className="py-3 px-3 text-center text-blue-700">{metrics.posts}</td>
                <td className="py-3 px-3 text-center">{weeklyDistribution[0]?.total || 0}</td>
                <td className="py-3 px-3 text-center">{weeklyDistribution[1]?.total || 0}</td>
                <td className="py-3 px-3 text-center">{weeklyDistribution[2]?.total || 0}</td>
                <td className="py-3 px-3 text-center">{weeklyDistribution[3]?.total || 0}</td>
                <td className="py-3 px-3 text-center text-emerald-600">{metrics.posted}</td>
                <td className="py-3 px-4 text-center text-slate-800">
                  {metrics.completionRate}% Planned
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Weekly Cadence Distribution Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft p-5">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Weekly Production Cadence ({currentMonthMeta.label})
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Distribution of deliverables across sprint weeks in this month
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeklyDistribution.map(w => (
            <div key={w.week} className="bg-slate-50/80 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-slate-800">{w.week}</span>
                <span className="px-2 py-0.5 rounded-full font-bold text-xs bg-orange-100 text-orange-800">
                  {w.total} items
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200/80">
                <div className="flex justify-between">
                  <span>Reels:</span>
                  <span className="font-bold text-purple-700">{w.reels}</span>
                </div>
                <div className="flex justify-between">
                  <span>Posts:</span>
                  <span className="font-bold text-blue-700">{w.posts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Live Posted:</span>
                  <span className="font-bold text-emerald-600">{w.posted}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Pipeline:</span>
                  <span className="font-bold text-slate-700">{w.scheduled + w.inCreation + w.planned}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

