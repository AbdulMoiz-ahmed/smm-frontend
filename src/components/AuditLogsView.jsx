import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import {
  ScrollText,
  Search,
  RefreshCw,
  Trash2,
  Filter,
  ShieldAlert,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Layers,
  Building2,
  Database,
  ArrowRight,
  User,
  Eye,
  X,
  ChevronDown
} from 'lucide-react';

const ACTION_CONFIG = {
  USER_LOGIN: { label: 'Sign In', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: LogIn },
  LOGIN_FAILED: { label: 'Login Failed', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldAlert },
  LOGIN_DISABLED: { label: 'Login Blocked', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldAlert },
  STATUS_CHANGE: { label: 'Status Pipeline', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ArrowRight },
  DELIVERABLE_CREATED: { label: 'Content Created', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: FileText },
  DELIVERABLE_UPDATED: { label: 'Content Updated', color: 'bg-sky-50 text-sky-700 border-sky-200', icon: FileText },
  DELIVERABLE_DELETED: { label: 'Content Deleted', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Trash2 },
  DELIVERABLE_DUPLICATED: { label: 'Content Duplicated', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Layers },
  CLIENT_CREATED: { label: 'Brand Added', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Building2 },
  CLIENT_UPDATED: { label: 'Brand Updated', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Building2 },
  CLIENT_DELETED: { label: 'Brand Removed', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: Trash2 },
  SYSTEM_SEED: { label: 'Master Reset', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Database },
  DATA_IMPORTED: { label: 'Excel Import', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Database },
  DATA_EXPORTED: { label: 'Backup Export', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Database },
  LOGS_CLEARED: { label: 'Logs Purged', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: Trash2 }
};

export default function AuditLogsView() {
  const { user, isAdmin } = useAuth();
  const { addToast } = usePlanner();

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [inspectLog, setInspectLog] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const fetchLogs = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/logs?limit=200');
      if (!res.ok) throw new Error('Failed to retrieve audit logs');
      const data = await res.json();
      setLogs(data);
      if (showToast) addToast('Audit logs synchronized', 'info');
    } catch (err) {
      console.error('Error fetching logs:', err);
      addToast('Failed to load system audit logs', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle clearing logs
  const handleClearLogs = async () => {
    try {
      const token = localStorage.getItem('content_planner_auth_token');
      const res = await fetch('/api/logs', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to clear logs');
      const data = await res.json();
      addToast(`Cleared ${data.deletedCount} log entries`, 'success');
      setConfirmClearOpen(false);
      fetchLogs();
    } catch (err) {
      console.error('Error clearing logs:', err);
      addToast('Error clearing logs archive', 'error');
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'All' && log.action !== actionFilter) return false;
      if (entityFilter !== 'All' && log.entityType !== entityFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const actorName = log.actor?.name?.toLowerCase() || '';
        const actorEmail = log.actor?.email?.toLowerCase() || '';
        const details = log.details?.toLowerCase() || '';
        const action = log.action?.toLowerCase() || '';
        const entityId = log.entityId?.toLowerCase() || '';
        if (
          !actorName.includes(q) &&
          !actorEmail.includes(q) &&
          !details.includes(q) &&
          !action.includes(q) &&
          !entityId.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [logs, actionFilter, entityFilter, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = logs.length;
    const logins = logs.filter(l => l.action === 'USER_LOGIN').length;
    const failedLogins = logs.filter(l => l.action === 'LOGIN_FAILED' || l.action === 'LOGIN_DISABLED').length;
    const deliverableActions = logs.filter(l => l.entityType === 'deliverable').length;
    const systemActions = logs.filter(l => l.entityType === 'system' || l.entityType === 'client').length;
    return { total, logins, failedLogins, deliverableActions, systemActions };
  }, [logs]);

  // Format date helper
  const formatTime = (isoStr) => {
    if (!isoStr) return 'Unknown';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  // Relative time helper
  const getRelativeTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const diff = Math.floor((new Date() - new Date(isoStr)) / 1000);
      if (diff < 30) return 'just now';
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ────────────────────────────────────────── */}
      {/* HEADER SECTION                             */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-wider">
              <ScrollText className="w-4 h-4" />
              <span>Security & Operational Audit Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              System Activity & Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Every action taken in the system is automatically recorded here in chronological order: user logins, content pipeline changes, client configurations, and data exports.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchLogs(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
              <span>Refresh Ledger</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setConfirmClearOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Archive</span>
              </button>
            )}
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Total Recorded Events</span>
              <ScrollText className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Full audit trail</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
              <span>Sign-Ins & Logins</span>
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.logins}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {stats.failedLogins > 0 ? `${stats.failedLogins} failed attempts recorded` : 'Zero failed attempts'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] font-semibold text-sky-400 flex items-center justify-between">
              <span>Content Operations</span>
              <FileText className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400 mt-1">{stats.deliverableActions}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Creations, edits & pipeline shifts</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] font-semibold text-amber-400 flex items-center justify-between">
              <span>Brand & System Events</span>
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.systemActions}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Client edits, imports & resets</div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* FILTER & SEARCH BAR                        */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search actors, actions, details..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
          >
            <option value="All">All Action Types</option>
            <option value="USER_LOGIN">User Sign-Ins (USER_LOGIN)</option>
            <option value="LOGIN_FAILED">Failed Logins (LOGIN_FAILED)</option>
            <option value="STATUS_CHANGE">Pipeline Shifts (STATUS_CHANGE)</option>
            <option value="DELIVERABLE_CREATED">Created Content (DELIVERABLE_CREATED)</option>
            <option value="DELIVERABLE_UPDATED">Updated Content (DELIVERABLE_UPDATED)</option>
            <option value="DELIVERABLE_DELETED">Deleted Content (DELIVERABLE_DELETED)</option>
            <option value="CLIENT_CREATED">Brand Clients (CLIENT_CREATED)</option>
            <option value="DATA_IMPORTED">Excel Imports (DATA_IMPORTED)</option>
            <option value="SYSTEM_SEED">System Resets (SYSTEM_SEED)</option>
          </select>

          {/* Entity Filter */}
          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="auth">Authentication</option>
            <option value="deliverable">Deliverables</option>
            <option value="client">Client Brands</option>
            <option value="system">System Operations</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0 flex items-center gap-1.5 self-end sm:self-auto">
          <span>Showing</span>
          <strong className="text-slate-800 font-bold">{filteredLogs.length}</strong>
          <span>of {logs.length} events</span>
        </div>
      </div>

      {/* ────────────────────────────────────────── */}
      {/* AUDIT LOGS LEDGER TABLE                     */}
      {/* ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <div className="text-sm font-bold text-slate-700">Loading audit ledger...</div>
            <div className="text-xs text-slate-400">Fetching live action history from MongoDB</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ScrollText className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No matching audit events found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm || actionFilter !== 'All' || entityFilter !== 'All'
                ? 'Try adjusting your search criteria or resetting filters to see more events.'
                : 'No actions have been recorded yet. Perform actions such as logging in, updating deliverable statuses, or adding content.'}
            </p>
            {(searchTerm || actionFilter !== 'All' || entityFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('All');
                  setEntityFilter('All');
                }}
                className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Actor / User</th>
                  <th className="py-3.5 px-4">Action Details</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map(log => {
                  const actionMeta = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: FileText
                  };
                  const IconComp = actionMeta.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {formatTime(log.timestamp)}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${actionMeta.color}`}
                        >
                          <IconComp className="w-3 h-3 shrink-0" />
                          <span>{actionMeta.label}</span>
                        </span>
                      </td>

                      {/* Actor Information */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                            {log.actor?.name ? log.actor.name[0] : 'S'}
                          </div>
                          <div className="leading-tight">
                            <div className="font-bold text-slate-900 text-xs">
                              {log.actor?.name || 'System / Guest'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {log.actor?.email ? (
                                <span>{log.actor.email}</span>
                              ) : log.actor?.role ? (
                                <span className="capitalize">{log.actor.role}</span>
                              ) : (
                                <span>Automated</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Details */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-medium text-slate-800 text-xs leading-relaxed">
                          {log.details}
                        </div>
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {log.metadata.newStatus && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Status: {log.metadata.newStatus}
                              </span>
                            )}
                            {log.metadata.client && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {log.metadata.client}
                              </span>
                            )}
                            {log.metadata.format && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                {log.metadata.format}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Entity Type / ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                          {log.entityType || 'General'}
                        </div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Inspect Button */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all inline-flex items-center gap-1 text-xs font-semibold"
                          title="Inspect raw payload metadata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────── */}
      {/* INSPECT LOG METADATA MODAL                 */}
      {/* ────────────────────────────────────────── */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">Audit Log Event Inspection</h3>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action</div>
                  <div className="font-bold text-slate-800 mt-0.5">{inspectLog.action}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timestamp</div>
                  <div className="font-bold text-slate-800 mt-0.5">{formatTime(inspectLog.timestamp)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Actor</div>
                  <div className="font-bold text-slate-800 mt-0.5">{inspectLog.actor?.name || 'System'}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entity</div>
                  <div className="font-bold text-slate-800 mt-0.5">{inspectLog.entityType} ({inspectLog.entityId || 'N/A'})</div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Log Summary Description</label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium leading-relaxed">
                  {inspectLog.details}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Raw Event Payload Metadata (JSON)</label>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48">
                  {JSON.stringify(
                    {
                      id: inspectLog.id,
                      action: inspectLog.action,
                      actor: inspectLog.actor,
                      details: inspectLog.details,
                      entityType: inspectLog.entityType,
                      entityId: inspectLog.entityId,
                      metadata: inspectLog.metadata,
                      timestamp: inspectLog.timestamp
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────── */}
      {/* CONFIRM CLEAR AUDIT LOGS MODAL             */}
      {/* ────────────────────────────────────────── */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Purge Audit Ledger Archive?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will delete all historical activity and security audit entries from MongoDB. A new initial "LOGS_CLEARED" entry will be recorded by your administrator profile.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearLogs}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-colors"
                >
                  Yes, Clear Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
