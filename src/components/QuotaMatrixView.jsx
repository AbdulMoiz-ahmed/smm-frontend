import React from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Table2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function QuotaMatrixView() {
  const { clients, deliverables, getClientColor } = usePlanner();

  // Computations
  let totalPostsQuota = 0;
  let totalReelsQuota = 0;
  let totalOverallQuota = 0;
  let weekAllocTotals = [0, 0, 0, 0];
  let totalAllocatedSum = 0;
  let totalActualSum = 0;

  const clientStats = clients.map(c => {
    const tq = (c.postsQuota || 0) + (c.reelsQuota || 0);
    totalPostsQuota += c.postsQuota || 0;
    totalReelsQuota += c.reelsQuota || 0;
    totalOverallQuota += tq;

    const weeks = c.weeks || [0, 0, 0, 0];
    const alloc = weeks.reduce((acc, v) => acc + (v || 0), 0);
    totalAllocatedSum += alloc;
    weeks.forEach((w, i) => {
      weekAllocTotals[i] += w || 0;
    });

    const actual = deliverables.filter(d => d.client === c.name).length;
    totalActualSum += actual;

    return {
      ...c,
      totalQuota: tq,
      allocated: alloc,
      actual,
      isFulfill: actual >= tq
    };
  });

  const weeks = React.useMemo(() => {
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

  return (
    <div className="space-y-8">
      {/* 1. Monthly Agency Quota Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Table2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Agency Monthly Deliverables & Quota Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Comparison of client agreed quotas vs weekly allocation and actual pipeline
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-500">Agency Deliverable Target</span>
            <div className="text-xl font-black text-slate-900">{totalOverallQuota} Items</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Client Brand</th>
                <th className="py-3 px-3 text-center">Posts Quota</th>
                <th className="py-3 px-3 text-center">Reels Quota</th>
                <th className="py-3 px-3 text-center font-black text-slate-900">Total Quota</th>
                <th className="py-3 px-3 text-center">Wk 1 Target</th>
                <th className="py-3 px-3 text-center">Wk 2 Target</th>
                <th className="py-3 px-3 text-center">Wk 3 Target</th>
                <th className="py-3 px-3 text-center">Wk 4 Target</th>
                <th className="py-3 px-3 text-center font-bold">Planned Target</th>
                <th className="py-3 px-3 text-center font-black text-orange-600">Actual Live</th>
                <th className="py-3 px-4 text-center">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {clientStats.map(c => {
                const color = getClientColor(c.name);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-medium">{c.postsQuota}</td>
                    <td className="py-3 px-3 text-center font-medium">{c.reelsQuota}</td>
                    <td className="py-3 px-3 text-center font-black text-slate-900 bg-slate-50/80">
                      {c.totalQuota}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">{c.weeks?.[0] || 0}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{c.weeks?.[1] || 0}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{c.weeks?.[2] || 0}</td>
                    <td className="py-3 px-3 text-center text-slate-500">{c.weeks?.[3] || 0}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{c.allocated}</td>
                    <td className="py-3 px-3 text-center font-black text-orange-600 bg-orange-50/50">
                      {c.actual}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.actual >= c.totalQuota ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete ({c.actual}/{c.totalQuota})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending ({c.actual}/{c.totalQuota})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Agency Row */}
              <tr className="bg-slate-900 text-white font-black text-xs">
                <td className="py-3.5 px-4">TOTAL AGENCY DELIVERABLES</td>
                <td className="py-3.5 px-3 text-center">{totalPostsQuota}</td>
                <td className="py-3.5 px-3 text-center">{totalReelsQuota}</td>
                <td className="py-3.5 px-3 text-center text-orange-400 text-sm font-black">
                  {totalOverallQuota}
                </td>
                <td className="py-3.5 px-3 text-center text-slate-300">{weekAllocTotals[0]}</td>
                <td className="py-3.5 px-3 text-center text-slate-300">{weekAllocTotals[1]}</td>
                <td className="py-3.5 px-3 text-center text-slate-300">{weekAllocTotals[2]}</td>
                <td className="py-3.5 px-3 text-center text-slate-300">{weekAllocTotals[3]}</td>
                <td className="py-3.5 px-3 text-center text-slate-200">{totalAllocatedSum}</td>
                <td className="py-3.5 px-3 text-center text-orange-300 text-sm font-black bg-slate-800">
                  {totalActualSum}
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-400">
                  {totalActualSum >= totalOverallQuota ? '100% Fulfilled' : `${Math.round((totalActualSum / totalOverallQuota) * 100)}% Fulfilled`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Actual Deliverables Scheduled by Week */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-900">
            Actual Deliverables Scheduled Per Week Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Current live deliverables grouped by target week and brand
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Sprint Week</th>
                {clients.map(c => (
                  <th key={c.id} className="py-3 px-3 text-center">
                    {c.name}
                  </th>
                ))}
                <th className="py-3 px-4 text-center font-black text-slate-900">Week Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {weeks.map(week => {
                let weekTotal = 0;

                return (
                  <tr key={week} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{week}</td>
                    {clients.map(c => {
                      const count = deliverables.filter(d => d.client === c.name && d.week === week).length;
                      weekTotal += count;

                      return (
                        <td key={c.id} className="py-3 px-3 text-center font-medium">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              count > 0 ? 'bg-orange-50 text-orange-900' : 'text-slate-300'
                            }`}
                          >
                            {count}
                          </span>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center font-black text-slate-900 bg-slate-50">
                      {weekTotal}
                    </td>
                  </tr>
                );
              })}

              {/* Total Row */}
              <tr className="bg-slate-900 text-white font-black text-xs">
                <td className="py-3.5 px-4">Brand Total</td>
                {clients.map(c => {
                  const count = deliverables.filter(d => d.client === c.name).length;
                  return (
                    <td key={c.id} className="py-3.5 px-3 text-center text-orange-300">
                      {count}
                    </td>
                  );
                })}
                <td className="py-3.5 px-4 text-center text-orange-400 text-sm font-black bg-slate-800">
                  {deliverables.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
