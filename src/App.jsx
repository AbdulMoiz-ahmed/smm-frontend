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
import Toast from './components/Toast';
import { Clock, ArrowRight, ShieldAlert } from 'lucide-react';

function DashboardContent() {
  const { user, isAuthenticated, isLoadingAuth, isAdmin, hasPermission, canAccessTab } = useAuth();
  const { deliverables, clients } = usePlanner();

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
      week: 'All',
      format: 'All',
      status: 'All',
      datePreset: 'All'
    });
  };

  const handleStatusCardClick = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

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
              {/* Top KPI Metrics Overview */}
              <StatsOverview onFilterStatus={handleStatusCardClick} />

              {/* Daily Operations Quick Pulse Banner */}
              <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-orange-600 text-white shadow-sm shrink-0">
                    <Clock className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Daily Post Maintenance & Backlog</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-orange-100 text-orange-800 border border-orange-200">
                        {dailyPulse.todayStr}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <strong className="text-amber-800 font-bold">{dailyPulse.pendingTillToday} pending till today</strong>
                      <span className="mx-1.5">•</span>
                      <span>{dailyPulse.dueToday} scheduled today</span>
                      <span className="mx-1.5">•</span>
                      <span>{dailyPulse.tomorrowCount} upcoming tomorrow</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('daily')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <span>Open Daily Tasks Deck</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Filter and View Layout Toolbar */}
              <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                showBrandFilter={true}
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
