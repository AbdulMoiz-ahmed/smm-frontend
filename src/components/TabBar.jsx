import React, { useMemo } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { LayoutGrid, Calendar, Table2, Building2, Layers, Clock } from 'lucide-react';

export default function TabBar({ activeTab, onSelectTab }) {
  const { clients, deliverables, getClientColor } = usePlanner();

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const pendingTillTodayCount = useMemo(() => {
    return deliverables.filter(d => d.date && d.date <= todayStr && d.status !== 'Posted').length;
  }, [deliverables, todayStr]);

  return (
    <div className="bg-white border-b border-slate-200 sticky top-[95px] z-20 shadow-xs mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none no-scrollbar">
          {/* Master Planner Tab */}
          <button
            onClick={() => onSelectTab('master')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'master'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Planner</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === 'master' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {deliverables.length}
            </span>
          </button>

          {/* Daily Operations / Today's Tasks Tab */}
          <button
            onClick={() => onSelectTab('daily')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'daily'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900 hover:bg-orange-50/80 border border-transparent hover:border-orange-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'daily' ? 'text-white' : 'text-orange-500'}`} />
            <span>Daily Tasks</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'daily'
                  ? 'bg-orange-700 text-white'
                  : pendingTillTodayCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
              title={`${pendingTillTodayCount} pending deliverables till today`}
            >
              {pendingTillTodayCount}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Dynamic Client Tabs */}
          {clients.map(client => {
            const count = deliverables.filter(d => d.client === client.name).length;
            const isSelected = activeTab === `client-${client.id}`;
            const color = getClientColor(client.name);

            return (
              <button
                key={client.id}
                onClick={() => onSelectTab(`client-${client.id}`)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-orange-50 text-orange-950 font-bold ring-1 ring-orange-400/50 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                ></span>
                <span>{client.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isSelected ? 'bg-orange-200 text-orange-900' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div className="h-4 w-px bg-slate-200 mx-1"></div>

          {/* Calendar View Tab */}
          <button
            onClick={() => onSelectTab('calendar')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'calendar'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>

          {/* Quota Matrix Tab */}
          <button
            onClick={() => onSelectTab('quotas')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'quotas'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Quota Matrix</span>
          </button>

          {/* Manage Brands Tab */}
          <button
            onClick={() => onSelectTab('clients')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'clients'
                ? 'bg-slate-900 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Manage Brands</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === 'clients' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {clients.length}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
