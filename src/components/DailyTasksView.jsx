import React, { useState, useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Video,
  Image as ImageIcon,
  ClipboardCopy,
  Check,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Plus,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

// Helper to format date string to YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to calculate days difference
function getDaysDiff(targetDateStr, todayDateStr) {
  if (!targetDateStr || !todayDateStr) return 0;
  const target = new Date(targetDateStr + 'T00:00:00');
  const today = new Date(todayDateStr + 'T00:00:00');
  const diffTime = target - today;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export default function DailyTasksView({ onEditDeliverable, onNewDeliverableWithDate }) {
  const { deliverables, clients, getClientColor, updateStatus, addToast, roleRestrictedFormat } = usePlanner();

  // Dynamic system today (YYYY-MM-DD)
  const systemTodayStr = useMemo(() => {
    return formatDate(new Date());
  }, []);

  // Mode: 'pending-till-today' | 'today' | 'tomorrow' | 'custom'
  const [activeMode, setActiveMode] = useState('pending-till-today');
  const [selectedDate, setSelectedDate] = useState(systemTodayStr);
  const [viewLayout, setViewLayout] = useState('cards'); // 'cards' | 'table'
  const [copiedId, setCopiedId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Computed Date Strings
  const tomorrowStr = useMemo(() => {
    const d = new Date(systemTodayStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  }, [systemTodayStr]);

  // Overall Metrics Calculation
  const metrics = useMemo(() => {
    const todayItems = deliverables.filter(d => d.date === systemTodayStr);
    const todayPending = todayItems.filter(d => d.status !== 'Posted');

    const tillTodayItems = deliverables.filter(d => d.date && d.date <= systemTodayStr);
    const pendingTillToday = tillTodayItems.filter(d => d.status !== 'Posted');
    const postedTillToday = tillTodayItems.filter(d => d.status === 'Posted');

    const tomorrowItems = deliverables.filter(d => d.date === tomorrowStr);
    const tomorrowPending = tomorrowItems.filter(d => d.status !== 'Posted');

    const completionRate = tillTodayItems.length > 0
      ? Math.round((postedTillToday.length / tillTodayItems.length) * 100)
      : 100;

    return {
      todayTotal: todayItems.length,
      todayPending: todayPending.length,
      pendingTillTodayCount: pendingTillToday.length,
      postedTillTodayCount: postedTillToday.length,
      tillTodayTotal: tillTodayItems.length,
      tomorrowTotal: tomorrowItems.length,
      tomorrowPending: tomorrowPending.length,
      completionRate
    };
  }, [deliverables, systemTodayStr, tomorrowStr]);

  // Handle Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
    setActiveMode('custom');
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
    setActiveMode('custom');
  };

  const handleSetToday = () => {
    setSelectedDate(systemTodayStr);
    setActiveMode('today');
  };

  const handleSetTomorrow = () => {
    setSelectedDate(tomorrowStr);
    setActiveMode('tomorrow');
  };

  const handleSetPendingTillToday = () => {
    setActiveMode('pending-till-today');
  };

  // Filter tasks based on mode and user filters
  const displayedTasks = useMemo(() => {
    let list = [];

    if (activeMode === 'pending-till-today') {
      list = deliverables.filter(d => d.date && d.date <= systemTodayStr && d.status !== 'Posted');
    } else if (activeMode === 'today') {
      list = deliverables.filter(d => d.date === systemTodayStr);
    } else if (activeMode === 'tomorrow') {
      list = deliverables.filter(d => d.date === tomorrowStr);
    } else {
      // custom date
      list = deliverables.filter(d => d.date === selectedDate);
    }

    return list.filter(item => {
      if (selectedBrand !== 'All' && item.client !== selectedBrand) return false;
      if (selectedFormat !== 'All' && item.format !== selectedFormat) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const tMatch = (item.title || '').toLowerCase().includes(q);
        const cMatch = (item.caption || '').toLowerCase().includes(q);
        const bMatch = (item.client || '').toLowerCase().includes(q);
        const aMatch = (item.asset || '').toLowerCase().includes(q);
        if (!tMatch && !cMatch && !bMatch && !aMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort chronologically, then by brand
      if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
      return (a.client || '').localeCompare(b.client || '');
    });
  }, [deliverables, activeMode, systemTodayStr, tomorrowStr, selectedDate, selectedBrand, selectedFormat, selectedStatus, search]);

  // Copy caption action
  const handleCopyCaption = (item) => {
    if (!item.caption) {
      addToast('No caption text to copy', 'info');
      return;
    }
    navigator.clipboard.writeText(item.caption);
    setCopiedId(item.id);
    addToast(`Caption copied for ${item.client}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Human date label
  const activeDateLabel = useMemo(() => {
    if (activeMode === 'pending-till-today') {
      return `All Overdue & Pending Backlog (Up to ${systemTodayStr})`;
    }
    const target = activeMode === 'today' ? systemTodayStr : (activeMode === 'tomorrow' ? tomorrowStr : selectedDate);
    const d = new Date(target + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, [activeMode, systemTodayStr, tomorrowStr, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* ────────────────────────────────────────── */}
      {/* TOP HEADER & DAILY KPI CARDS               */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-card border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Daily Maintenance Deck
              </span>
              <span className="text-xs text-slate-400">
                System Today: <strong className="text-white">{systemTodayStr}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Everyday Post Maintenance & Operations
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Track daily deliverables, copy posting captions, check production status, and mark posts live.
            </p>
          </div>

          <button
            onClick={() => onNewDeliverableWithDate && onNewDeliverableWithDate(activeMode === 'pending-till-today' ? systemTodayStr : selectedDate)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Schedule Post For This Day</span>
          </button>
        </div>

        {/* 4 Quick Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Pending Backlog Till Today */}
          <div
            onClick={handleSetPendingTillToday}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              activeMode === 'pending-till-today'
                ? 'bg-amber-500/20 border-amber-400/80 shadow-md ring-2 ring-amber-400/30'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Pending Till Today
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200">
                Backlog
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400 tracking-tight">
              {metrics.pendingTillTodayCount}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Unposted deliverables due on or before today
            </p>
          </div>

          {/* Card 2: Tasks Due Today */}
          <div
            onClick={handleSetToday}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              activeMode === 'today'
                ? 'bg-orange-500/20 border-orange-400/80 shadow-md ring-2 ring-orange-400/30'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" /> Scheduled Today
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/20 text-orange-200">
                {metrics.todayPending} Pending
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight">
              {metrics.todayTotal}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              {metrics.todayTotal === 0 ? 'Rest day — 0 releases today' : `${metrics.todayPending} posts need attention today`}
            </p>
          </div>

          {/* Card 3: Upcoming Tomorrow */}
          <div
            onClick={handleSetTomorrow}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${
              activeMode === 'tomorrow'
                ? 'bg-purple-500/20 border-purple-400/80 shadow-md ring-2 ring-purple-400/30'
                : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" /> Tomorrow's Queue
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-200">
                Next Up
              </span>
            </div>
            <div className="text-2xl font-black text-purple-300 tracking-tight">
              {metrics.tomorrowTotal}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Prepare assets ahead of release
            </p>
          </div>

          {/* Card 4: Progress Till Today */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Posted Till Today
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-bold">
                  {metrics.completionRate}%
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                {metrics.postedTillTodayCount} / {metrics.tillTodayTotal}
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* OPERATIONS TOOLBAR: TABS & DATE PICKER     */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-soft space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSetPendingTillToday}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'pending-till-today'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Pending Till Today</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeMode === 'pending-till-today' ? 'bg-amber-600 text-white' : 'bg-amber-200 text-amber-900 font-black'
              }`}>
                {metrics.pendingTillTodayCount}
              </span>
            </button>

            <button
              onClick={handleSetToday}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'today'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Today ({systemTodayStr})</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeMode === 'today' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}>
                {metrics.todayTotal}
              </span>
            </button>

            <button
              onClick={handleSetTomorrow}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'tomorrow'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/80'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Tomorrow ({tomorrowStr})</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeMode === 'tomorrow' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'
              }`}>
                {metrics.tomorrowTotal}
              </span>
            </button>
          </div>

          {/* Date Stepper & Picker (for day-by-day maintenance) */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 hover:shadow-xs transition-all"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setActiveMode('custom');
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 hover:shadow-xs transition-all"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar & Layout Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search posts, captions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Brand Filter */}
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Brands</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            {/* Format Filter */}
            {roleRestrictedFormat ? (
              <div className="px-2.5 py-1.5 text-xs bg-orange-50 border border-orange-200 rounded-lg text-orange-800 font-bold flex items-center gap-1.5 shadow-2xs">
                <span>{roleRestrictedFormat === 'Reel' ? '🎬 Reels Only' : '🎨 Posts Only'}</span>
              </div>
            ) : (
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="All">All Formats</option>
                <option value="Reel">Reels (9:16)</option>
                <option value="Post">Posts (1:1)</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Creation">In Creation</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Posted">Posted</option>
            </select>
          </div>

          {/* Card / Table Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 self-end sm:self-auto">
            <button
              onClick={() => setViewLayout('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === 'cards' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid Layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewLayout === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Checklist Table Layout"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Checklist</span>
            </button>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* SECTION HEADER & LIST OUTPUT               */}
      {/* ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{activeDateLabel}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {displayedTasks.length} {displayedTasks.length === 1 ? 'Deliverable' : 'Deliverables'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeMode === 'pending-till-today'
              ? 'These deliverables were scheduled on or before today but have not yet been marked as Posted.'
              : `Review production status, copy captions, and manage releases for this date.`}
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {displayedTasks.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center my-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            {activeMode === 'today'
              ? `No releases scheduled for today (${systemTodayStr})`
              : activeMode === 'pending-till-today'
              ? 'All caught up! Zero pending backlog till today.'
              : 'No deliverables found for this selection.'}
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {activeMode === 'today'
              ? `Today is clear! You have ${metrics.pendingTillTodayCount} pending items in your backlog, and ${metrics.tomorrowTotal} posts scheduled for tomorrow.`
              : 'Great job maintaining your schedule! Check other dates or add a new deliverable.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            {metrics.pendingTillTodayCount > 0 && activeMode !== 'pending-till-today' && (
              <button
                onClick={handleSetPendingTillToday}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Review Backlog ({metrics.pendingTillTodayCount})</span>
              </button>
            )}

            {metrics.tomorrowTotal > 0 && activeMode !== 'tomorrow' && (
              <button
                onClick={handleSetTomorrow}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Preview Tomorrow ({metrics.tomorrowTotal})</span>
              </button>
            )}

            <button
              onClick={() => onNewDeliverableWithDate && onNewDeliverableWithDate(selectedDate)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Post</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 1: CARDS LAYOUT */}
      {displayedTasks.length > 0 && viewLayout === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTasks.map(item => {
            const clientColor = getClientColor(item.client);
            const daysDiff = getDaysDiff(item.date, systemTodayStr);
            const isOverdue = daysDiff < 0 && item.status !== 'Posted';
            const isToday = daysDiff === 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-soft hover:shadow-card group ${
                  isOverdue ? 'border-amber-200 ring-1 ring-amber-300/40' : 'border-slate-200/90'
                }`}
              >
                {/* Accent top line */}
                <div className="h-1.5 w-full" style={{ backgroundColor: clientColor }}></div>

                <div className="p-4 flex-1 flex flex-col">
                  {/* Card Header: Client & Format */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: clientColor }}
                      ></span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.client}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Urgency Badge */}
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {Math.abs(daysDiff)}d overdue
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Due Today
                        </span>
                      )}

                      {/* Format Badge */}
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

                  {/* Scheduled Date */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.date || 'No Date'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                      {item.week}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-slate-900 leading-snug mb-2 line-clamp-2">
                    {item.title}
                  </h4>

                  {/* Asset Specs */}
                  {item.asset && (
                    <div className="mb-3">
                      <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                        📐 {item.asset}
                      </span>
                    </div>
                  )}

                  {/* Caption with Quick Copy */}
                  {item.caption && (
                    <div className="mt-auto pt-2.5 border-t border-slate-100">
                      <div className="flex items-start justify-between gap-1 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="line-clamp-2 italic pr-1">"{item.caption}"</p>
                        <button
                          onClick={() => handleCopyCaption(item)}
                          className="text-slate-400 hover:text-slate-700 p-1 shrink-0 rounded-lg hover:bg-slate-200/60 transition-colors"
                          title="Copy caption for publishing"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ClipboardCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Quick Status Switcher & Edit */}
                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Status:
                    </span>
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer focus:outline-none transition-all ${
                        item.status === 'Posted'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : item.status === 'Scheduled'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'In Creation'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      <option value="Planned">Planned</option>
                      <option value="In Creation">In Creation</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Posted">Posted</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Fast "Mark as Posted" 1-click button if not already posted */}
                    {item.status !== 'Posted' && (
                      <button
                        onClick={() => updateStatus(item.id, 'Posted')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all active:scale-95"
                        title="Mark as Live / Posted"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Done</span>
                      </button>
                    )}

                    {/* Edit button */}
                    <button
                      onClick={() => onEditDeliverable && onEditDeliverable(item)}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: CHECKLIST TABLE LAYOUT */}
      {displayedTasks.length > 0 && viewLayout === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Deliverable Title & Asset</th>
                  <th className="py-3 px-4">Caption</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTasks.map(item => {
                  const clientColor = getClientColor(item.client);
                  const daysDiff = getDaysDiff(item.date, systemTodayStr);
                  const isOverdue = daysDiff < 0 && item.status !== 'Posted';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOverdue ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          {isOverdue && (
                            <span className="w-2 h-2 rounded-full bg-amber-500" title="Overdue"></span>
                          )}
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: clientColor }}
                          ></span>
                          {item.client}
                        </span>
                      </td>

                      {/* Format */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.format === 'Reel' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Video className="w-2.5 h-2.5" /> Reel
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ImageIcon className="w-2.5 h-2.5" /> Post
                          </span>
                        )}
                      </td>

                      {/* Title & Asset */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{item.title}</div>
                        {item.asset && (
                          <div className="text-[10px] text-slate-500 mt-0.5">📐 {item.asset}</div>
                        )}
                      </td>

                      {/* Caption with Copy */}
                      <td className="py-3 px-4 max-w-xs">
                        {item.caption ? (
                          <div className="flex items-center gap-1.5">
                            <span className="italic text-slate-600 line-clamp-1 flex-1">
                              "{item.caption}"
                            </span>
                            <button
                              onClick={() => handleCopyCaption(item)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/60 shrink-0"
                              title="Copy caption"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <ClipboardCopy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No caption</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={e => updateStatus(item.id, e.target.value)}
                          className="text-[11px] font-bold px-2 py-1 rounded-md border cursor-pointer focus:outline-none"
                        >
                          <option value="Planned">Planned</option>
                          <option value="In Creation">In Creation</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Posted">Posted</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'Posted' && (
                            <button
                              onClick={() => updateStatus(item.id, 'Posted')}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                            >
                              Mark Live
                            </button>
                          )}
                          <button
                            onClick={() => onEditDeliverable && onEditDeliverable(item)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
