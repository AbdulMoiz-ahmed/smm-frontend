import React, { useState, useMemo, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Video, Image as ImageIcon, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

export default function CalendarView({ onEditDeliverable, onNewDeliverableWithDate }) {
  const { clients, deliverables, getClientColor } = usePlanner();
  const [selectedBrand, setSelectedBrand] = useState('All');

  // Compute best default month/year from deliverables or current date
  const defaultDateObj = useMemo(() => {
    if (deliverables.length > 0) {
      // Find the most frequent year-month from deliverables
      const ymCounts = {};
      deliverables.forEach(d => {
        if (d.date && /^\d{4}-\d{2}/.test(d.date)) {
          const ym = d.date.slice(0, 7);
          ymCounts[ym] = (ymCounts[ym] || 0) + 1;
        }
      });
      const sortedYm = Object.entries(ymCounts).sort((a, b) => b[1] - a[1]);
      if (sortedYm.length > 0) {
        const [bestYm] = sortedYm[0];
        const [y, m] = bestYm.split('-').map(Number);
        return new Date(y, m - 1, 1);
      }
    }
    return new Date();
  }, [deliverables]);

  const [viewDate, setViewDate] = useState(defaultDateObj);

  // Sync if deliverables drastically change (e.g. after importing another sheet)
  useEffect(() => {
    setViewDate(defaultDateObj);
  }, [defaultDateObj]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed
  const monthName = viewDate.toLocaleString('default', { month: 'long' });

  // Dynamic calendar metrics
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun .. 6 = Sat

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleResetToCurrent = () => {
    setViewDate(new Date());
  };

  const filteredDeliverables = deliverables.filter(d => {
    if (selectedBrand !== 'All' && d.client !== selectedBrand) return false;
    return true;
  });

  const getDeliverablesForDay = (dayNum) => {
    const dayStr = String(dayNum).padStart(2, '0');
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
    return filteredDeliverables.filter(d => d.date === dateStr);
  };

  const statusBorderStyles = {
    'Scheduled': 'border-emerald-500 bg-emerald-50/80 text-emerald-900',
    'In Creation': 'border-amber-500 bg-amber-50/80 text-amber-900',
    'Planned': 'border-purple-500 bg-purple-50/80 text-purple-900',
    'Posted': 'border-blue-500 bg-blue-50/80 text-blue-900',
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Total deliverables in this calendar month
  const monthDeliverablesCount = useMemo(() => {
    const ymPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return filteredDeliverables.filter(d => d.date && d.date.startsWith(ymPrefix)).length;
  }, [filteredDeliverables, currentYear, currentMonth]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
      {/* Calendar Top Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {monthName} {currentYear} Deliverables Schedule
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {monthDeliverablesCount} Scheduled
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Click any deliverable to edit or '+' to schedule content on that date
            </p>
          </div>
        </div>

        {/* Month Navigation & Filter Brand */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Month Steppers */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold text-slate-800 select-none">
              {monthName.slice(0, 3)} {currentYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleResetToCurrent}
            className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
            title="Jump to current date"
          >
            Today
          </button>

          {/* Filter Brand */}
          <div className="flex items-center gap-2">
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer shadow-xs"
            >
              <option value="All">All Brands ({deliverables.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-center text-xs font-bold text-slate-600 uppercase py-2.5 tracking-wider">
        {weekDays.map(day => (
          <div key={day} className="truncate">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-50">
        {/* Leading empty cells for month start */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/40 p-2"></div>
        ))}

        {/* 1 to daysInMonth Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayStr = String(dayNum).padStart(2, '0');
          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
          const dayItems = getDeliverablesForDay(dayNum);
          const isWeekend = (startDayOfWeek + i) % 7 === 0 || (startDayOfWeek + i) % 7 === 6;

          return (
            <div
              key={dayNum}
              className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors hover:bg-orange-50/20 group ${
                isWeekend ? 'bg-slate-50/70' : 'bg-white'
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    dayItems.length > 0
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-700 group-hover:text-orange-600'
                  }`}
                >
                  {dayNum}
                </span>

                <button
                  onClick={() => onNewDeliverableWithDate(dateStr)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded transition-all"
                  title={`Add deliverable on ${monthName} ${dayNum}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day Deliverables Pills */}
              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[130px] pr-0.5">
                {dayItems.map(item => {
                  const color = getClientColor(item.client);

                  return (
                    <div
                      key={item.id}
                      onClick={() => onEditDeliverable(item)}
                      className={`text-[10px] p-1.5 rounded-md border-l-2 cursor-pointer shadow-xs hover:shadow-sm transition-all group/item ${
                        statusBorderStyles[item.status] || 'border-slate-300 bg-white'
                      }`}
                      style={{ borderLeftColor: color }}
                    >
                      <div className="flex items-center justify-between gap-1 font-semibold leading-tight">
                        <span className="truncate" style={{ color }}>
                          {item.client}
                        </span>
                        {item.format === 'Reel' ? (
                          <Video className="w-2.5 h-2.5 text-purple-600 shrink-0" />
                        ) : (
                          <ImageIcon className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-800 font-medium truncate mt-0.5 line-clamp-1">
                        {item.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Trailing empty cells to fill the last row */}
        {Array.from({ length: (7 - ((startDayOfWeek + daysInMonth) % 7)) % 7 }).map((_, i) => (
          <div key={`trailing-${i}`} className="min-h-[110px] bg-slate-50/40 p-2"></div>
        ))}
      </div>
    </div>
  );
}
