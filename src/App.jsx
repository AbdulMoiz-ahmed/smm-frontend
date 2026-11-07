import React, { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlannerProvider, usePlanner } from './context/PlannerContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginView from './components/LoginView';
import StatsOverview from './components/StatsOverview';
import FilterBar from './components/FilterBar';
import DeliverableGrid from './components/DeliverableGrid';
import DeliverableTable from './components/DeliverableTable';
import DeliverableKanban from './components/DeliverableKanban';
import ClientDetailView from './components/ClientDetailView';
import CalendarView from './components/CalendarView';
import QuotaMatrixView from './components/QuotaMatrixView';
import ClientManager from './components/ClientManager';
import TeamManager from './components/TeamManager';
import DailyTasksView from './components/DailyTasksView';
import DeliverableModal from './components/DeliverableModal';
import ClientModal from './components/ClientModal';
import BackupModal from './components/BackupModal';
import ExcelImportModal from './components/ExcelImportModal';
import AuditLogsView from './components/AuditLogsView';
import MonthlyReportView from './components/MonthlyReportView';
import Toast from './components/Toast';
import { Clock, ArrowRight, ShieldAlert, Calendar, BarChart3, Trash2, Sparkles } from 'lucide-react';

function DashboardContent() {
  const { user, isAuthenticated, isLoadingAuth, isAdmin, hasPermission, canAccessTab } = useAuth();
  const { deliverables, clients, deleteMonthDeliverables } = usePlanner();

  // Navigation state defaults based on user's granted permissions
  const [activeTab, setActiveTab] = useState(() => {
    if (hasPermission('view_daily')) return 'daily';
    if (hasPermission('view_calendar')) return 'calendar';
    return 'master';
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table' | 'kanban'

  // Sidebar responsive state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If role/user changes or a tab is restricted, adjust to valid tab
  useEffect(() => {
    if (isAuthenticated && !canAccessTab(activeTab)) {
      if (hasPermission('view_daily')) setActiveTab('daily');
      else if (hasPermission('view_calendar')) setActiveTab('calendar');
      else if (hasPermission('view_master')) setActiveTab('master');
      else setActiveTab('master');
    }
  }, [user, activeTab, isAuthenticated, canAccessTab, hasPermission]);

  // Filter state for Master Planner
  const [filters, setFilters] = useState({
    search: '',
    brand: 'All',
    month: 'All',
    week: 'All',
    format: 'All',
    status: 'All',
    datePreset: 'All'
  });

  // Today Date & Daily Pulse Summary
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const dailyPulse = useMemo(() => {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const tomorrowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const pendingTillToday = deliverables.filter(item => item.date && item.date <= todayStr && item.status !== 'Posted').length;
    const dueToday = deliverables.filter(item => item.date === todayStr).length;
    const tomorrowCount = deliverables.filter(item => item.date === tomorrowStr).length;

    return {
      todayStr,
      pendingTillToday,
      dueToday,
      tomorrowCount
    };
  }, [deliverables, todayStr]);

  // Modal states
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [deliverableToEdit, setDeliverableToEdit] = useState(null);
  const [defaultClientForNew, setDefaultClientForNew] = useState(null);
  const [defaultDateForNew, setDefaultDateForNew] = useState(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState(null);

  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      brand: 'All',
      month: 'All',
      week: 'All',
      format: 'All',
      status: 'All',
      datePreset: 'All'
    });
  };

  const handleStatusCardClick = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleDeleteActiveMonth = async (monthKey) => {
    const found = availableMonths.find(m => m.key === monthKey);
    const label = found ? found.label : monthKey;
    const count = found ? found.count : 0;
    if (window.confirm(`Are you sure you want to permanently delete all ${count} deliverables for ${label}? All other months will remain completely intact.`)) {
      await deleteMonthDeliverables(monthKey, label);
      handleFilterChange('month', 'All');
    }
  };

  // Extract all available months from live deliverables
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

  // Deliverables filtered by selected month (for scoped KPIs and stats)
  const monthFilteredDeliverables = useMemo(() => {
    if (!filters.month || filters.month === 'All') return deliverables;
    return deliverables.filter(d => d.date && d.date.startsWith(filters.month));
  }, [deliverables, filters.month]);

  // Modal openers
  const openNewDeliverable = (clientName = null, date = null) => {
    setDeliverableToEdit(null);
    setDefaultClientForNew(clientName);
    setDefaultDateForNew(date);
    setIsDeliverableModalOpen(true);
  };

  const openEditDeliverable = (item) => {
    setDeliverableToEdit(item);
    setDefaultClientForNew(null);
    setDefaultDateForNew(null);
    setIsDeliverableModalOpen(true);
  };

  const openNewClient = () => {
    if (!isAdmin) return;
    setClientToEdit(null);
    setIsClientModalOpen(true);
  };

  const openEditClient = (client) => {
    if (!isAdmin) return;
    setClientToEdit(client);
    setIsClientModalOpen(true);
  };

  // Filtered Deliverables for Master View
  const filteredDeliverables = useMemo(() => {
    return deliverables.filter(item => {
      if (filters.brand !== 'All' && item.client !== filters.brand) return false;
      if (filters.month && filters.month !== 'All' && !(item.date && item.date.startsWith(filters.month))) return false;
      if (filters.week !== 'All' && item.week !== filters.week) return false;
      if (filters.format !== 'All' && item.format !== filters.format) return false;
      if (filters.status !== 'All' && item.status !== filters.status) return false;
      if (filters.datePreset === 'pending-till-today' && !(item.date && item.date <= todayStr && item.status !== 'Posted')) return false;
      if (filters.datePreset === 'today' && item.date !== todayStr) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const captionMatch = (item.caption || '').toLowerCase().includes(query);
        const assetMatch = (item.asset || '').toLowerCase().includes(query);
        const clientMatch = (item.client || '').toLowerCase().includes(query);
        if (!titleMatch && !captionMatch && !assetMatch && !clientMatch) return false;
      }
      return true;
    });
  }, [deliverables, filters, todayStr]);

  // Auth gatekeeper
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-orange-500/30 animate-pulse">
          CP
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying encrypted session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Check if current tab is a specific client
  const isClientTab = activeTab.startsWith('client-');
  const activeClientId = isClientTab ? activeTab.replace('client-', '') : null;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Sleek Modern Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenImportExcel={() => setIsExcelImportModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Modern Clean Header */}
        <Header
          activeTab={activeTab}
          onOpenNewDeliverable={() => openNewDeliverable()}
          onOpenNewClient={openNewClient}
          onOpenBackup={() => setIsBackupModalOpen(true)}
          onOpenImportExcel={() => setIsExcelImportModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Main Application Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          {/* VIEW 1: DAILY TASKS & TODAY'S DECK (Graphic Designer & Admin) */}
          {activeTab === 'daily' && (
            <div className="animate-fade-in">
              <DailyTasksView
                onEditDeliverable={openEditDeliverable}
                onNewDeliverableWithDate={(date) => openNewDeliverable(null, date)}
              />
            </div>
          )}

          {/* VIEW 2: POSTS CALENDAR (Graphic Designer & Admin) */}
          {activeTab === 'calendar' && (
            <div className="animate-fade-in">
              <CalendarView
                onEditDeliverable={openEditDeliverable}
                onNewDeliverableWithDate={(date) => openNewDeliverable(null, date)}
              />
            </div>
          )}

          {/* VIEW 3: MASTER PLANNER */}
          {activeTab === 'master' && (
            <div className="space-y-6 animate-fade-in">
              <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-8">
                <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
                <div className="pointer-events-none absolute right-32 bottom-[-7rem] h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[11px] font-semibold text-orange-200">
                      <Sparkles className="h-3.5 w-3.5" /> YOUR CONTENT WORKSPACE
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Your content, at a glance.</h2>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">Plan what’s next, keep an eye on today’s work, and track every brand from one place.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button onClick={() => setActiveTab('daily')} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.14]">
                      <Clock className="h-4 w-4 text-orange-300" /> Today’s tasks
                    </button>
                    <button onClick={() => openNewDeliverable()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400">
                      <span className="text-lg leading-none">+</span> Create deliverable
                    </button>
                  </div>
                </div>
                <div className="relative mt-7 grid grid-cols-1 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/[0.06] px-4 py-3"><div className="text-xs text-slate-400">Needs attention</div><div className="mt-1 text-xl font-semibold text-white">{dailyPulse.pendingTillToday}<span className="ml-2 text-xs font-medium text-slate-400">overdue or due</span></div></div>
                  <div className="rounded-2xl bg-white/[0.06] px-4 py-3"><div className="text-xs text-slate-400">Scheduled today</div><div className="mt-1 text-xl font-semibold text-white">{dailyPulse.dueToday}<span className="ml-2 text-xs font-medium text-slate-400">deliverables</span></div></div>
                  <div className="rounded-2xl bg-white/[0.06] px-4 py-3"><div className="text-xs text-slate-400">Coming tomorrow</div><div className="mt-1 text-xl font-semibold text-white">{dailyPulse.tomorrowCount}<span className="ml-2 text-xs font-medium text-slate-400">deliverables</span></div></div>
                </div>
              </section>
              {/* Top KPI Metrics Overview (Scoped to selected month if chosen) */}
              <StatsOverview
                onFilterStatus={handleStatusCardClick}
                customDeliverables={filters.month !== 'All' ? monthFilteredDeliverables : null}
              />

              {/* Month Quick-Pills Switcher (when multiple months exist in dataset) */}
              {availableMonths.length > 1 && (
                <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 px-1">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span>Select Month:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => handleFilterChange('month', 'All')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        filters.month === 'All'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      All Months ({deliverables.length})
                    </button>
                    {availableMonths.map(m => (
                      <button
                        key={m.key}
                        onClick={() => handleFilterChange('month', m.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filters.month === m.key
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-orange-50 hover:text-orange-900 text-slate-700'
                        }`}
                      >
                        <span>{m.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          filters.month === m.key ? 'bg-orange-700 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {m.count}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {filters.month !== 'All' && (
                      <button
                        onClick={() => handleDeleteActiveMonth(filters.month)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-xl transition-all cursor-pointer"
                        title="Delete only this month's deliverables"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Month Data</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('monthly-report')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Open Monthly Report</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Filter and View Layout Toolbar */}
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showBrandFilter={true}
                resultCount={filteredDeliverables.length}
              />

              {/* Deliverables Output */}
              {viewMode === 'grid' && (
                <DeliverableGrid
                  items={filteredDeliverables}
                  onEdit={openEditDeliverable}
                  onNewDeliverable={() => openNewDeliverable()}
                  onResetFilters={handleResetFilters}
                />
              )}

              {viewMode === 'table' && (
                <DeliverableTable
                  items={filteredDeliverables}
                  onEdit={openEditDeliverable}
                />
              )}

              {viewMode === 'kanban' && (
                <DeliverableKanban
                  items={filteredDeliverables}
                  onEdit={openEditDeliverable}
                />
              )}
            </div>
          )}

          {/* VIEW: MONTHLY REPORT */}
          {activeTab === 'monthly-report' && (
            <div className="animate-fade-in">
              <MonthlyReportView
                onSelectTab={setActiveTab}
                onFilterMonthInMaster={(monthYm) => {
                  setFilters(prev => ({ ...prev, month: monthYm }));
                  setActiveTab('master');
                }}
              />
            </div>
          )}

          {/* VIEW 4: CLIENT DETAIL TAB */}
          {isClientTab && (
            <div className="animate-fade-in">
              <ClientDetailView
                key={activeClientId}
                clientId={activeClientId}
                onEditDeliverable={openEditDeliverable}
                onNewDeliverableForClient={(cName) => openNewDeliverable(cName)}
              />
            </div>
          )}

          {/* VIEW 5: QUOTA MATRIX (Admin Only) */}
          {activeTab === 'quotas' && (
            <div className="animate-fade-in">
              {isAdmin ? (
                <QuotaMatrixView />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="font-bold text-slate-900">Restricted Section</h3>
                  <p className="text-xs text-slate-500">Only Agency Directors can access client contractual quota matrices.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 6: MANAGE BRANDS (Admin Only) */}
          {activeTab === 'clients' && (
            <div className="animate-fade-in">
              {isAdmin ? (
                <ClientManager
                  onEditClient={openEditClient}
                  onNewClient={openNewClient}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="font-bold text-slate-900">Restricted Section</h3>
                  <p className="text-xs text-slate-500">Only Agency Directors can manage brand accounts.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: TEAM & ROLE PERMISSIONS (Admin Only) */}
          {activeTab === 'team' && (
            <div className="animate-fade-in">
              {isAdmin ? (
                <TeamManager />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="font-bold text-slate-900">Restricted Section</h3>
                  <p className="text-xs text-slate-500">Only Agency Directors can manage team accounts and permissions.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 8: AUDIT & ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="animate-fade-in">
              <AuditLogsView />
            </div>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <DeliverableModal
        isOpen={isDeliverableModalOpen}
        onClose={() => setIsDeliverableModalOpen(false)}
        deliverableToEdit={deliverableToEdit}
        defaultClient={defaultClientForNew}
        defaultDate={defaultDateForNew}
      />

      {isAdmin && (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          clientToEdit={clientToEdit}
        />
      )}

      {isAdmin && (
        <BackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
        />
      )}

      {isAdmin && (
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlannerProvider>
        <DashboardContent />
      </PlannerProvider>
    </AuthProvider>
  );
}
