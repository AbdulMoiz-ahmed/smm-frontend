import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { CheckCircle2, Clock, Calendar, CheckCheck, Video, Image as ImageIcon, TrendingUp } from 'lucide-react';

export default function StatsOverview({ onFilterStatus }) {
  const { stats, deliverables } = usePlanner();

  const total = deliverables.length;
  const scheduledPercent = total > 0 ? Math.round((stats.scheduled / total) * 100) : 0;
  const inCreationPercent = total > 0 ? Math.round((stats.inCreation / total) * 100) : 0;
  const plannedPercent = total > 0 ? Math.round((stats.planned / total) * 100) : 0;
  const postedPercent = total > 0 ? Math.round((stats.posted / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Deliverables */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-soft hover:shadow-card transition-shadow">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
          <span>Total Pipeline</span>
          <span className="p-1 rounded-md bg-slate-100 text-slate-600">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.total}</div>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1 text-purple-600">
            <Video className="w-3 h-3" /> {stats.reels} Reels
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-blue-600">
            <ImageIcon className="w-3 h-3" /> {stats.posts} Posts
          </span>
        </div>
      </div>

      {/* 2. Scheduled */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Scheduled')}
        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-soft hover:shadow-card hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-xs text-emerald-700 font-medium mb-1.5">
          <span>Scheduled</span>
          <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-black text-emerald-600 tracking-tight">{stats.scheduled}</div>
        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-600 font-medium flex items-center justify-between">
          <span>{scheduledPercent}% of total</span>
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">Ready</span>
        </div>
      </div>

      {/* 3. In Creation */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('In Creation')}
        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-soft hover:shadow-card hover:border-amber-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-xs text-amber-700 font-medium mb-1.5">
          <span>In Creation</span>
          <span className="p-1 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Clock className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-black text-amber-600 tracking-tight">{stats.inCreation}</div>
        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-amber-600 font-medium flex items-center justify-between">
          <span>{inCreationPercent}% of total</span>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-semibold">In Work</span>
        </div>
      </div>

      {/* 4. Planned */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Planned')}
        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-soft hover:shadow-card hover:border-purple-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-xs text-purple-700 font-medium mb-1.5">
          <span>Planned</span>
          <span className="p-1 rounded-md bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
            <Calendar className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-black text-purple-600 tracking-tight">{stats.planned}</div>
        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-purple-600 font-medium flex items-center justify-between">
          <span>{plannedPercent}% of total</span>
          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-semibold">Upcoming</span>
        </div>
      </div>

      {/* 5. Posted */}
      <div 
        onClick={() => onFilterStatus && onFilterStatus('Posted')}
        className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-soft hover:shadow-card hover:border-blue-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-xs text-blue-700 font-medium mb-1.5">
          <span>Live Posted</span>
          <span className="p-1 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <CheckCheck className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="text-2xl font-black text-blue-600 tracking-tight">{stats.posted}</div>
        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-blue-600 font-medium flex items-center justify-between">
          <span>{postedPercent}% of total</span>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-semibold">Done</span>
        </div>
      </div>

      {/* 6. Agency Quota Progress */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3.5 text-white shadow-card flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-1">
            <span>Quota Goal</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-semibold">
              {stats.total}/{stats.totalQuota}
            </span>
          </div>
          <div className="text-xl font-black text-white tracking-tight flex items-baseline gap-1.5">
            <span>{Math.round((stats.total / (stats.totalQuota || 1)) * 100)}%</span>
            <span className="text-xs text-slate-400 font-normal">fulfilled</span>
          </div>
        </div>

        <div className="mt-2">
          <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((stats.total / (stats.totalQuota || 1)) * 100))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
            <span>Allocated: {stats.total}</span>
            <span>Target: {stats.totalQuota}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
