import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import { 
  Clock, Calendar, Layers, Table2, Building2, Users, ChevronLeft, ChevronRight, 
  LogOut, Shield, Palette, Crown, ChevronDown, ChevronUp, Database, 
  FileSpreadsheet, UploadCloud, RotateCcw, CheckCircle2, PenTool, Video, Share2, Briefcase, ScrollText
} from 'lucide-react';
import { getRoleMeta } from '../utils/roles';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  isCollapsed, 
  setIsCollapsed,
  onOpenImportExcel,
  onOpenBackup,
  isMobileOpen,
  setIsMobileOpen
}) {
  const { user, isAdmin, roleMeta, hasPermission, canAccessBrand, logout } = useAuth();
  const { clients, deliverables, getClientColor, exportCSV, resetData } = usePlanner();

  const [brandsExpanded, setBrandsExpanded] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Today Date & Pending Count
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

  // Accessible brands based on assignment
  const visibleClients = useMemo(() => {
    return clients.filter(c => canAccessBrand(c.name));
  }, [clients, canAccessBrand]);

  const handleNavClick = (tabKey) => {
    onSelectTab(tabKey);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-xl ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Header / Brand Logo */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white font-black text-xl shrink-0">
              CP
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                  <span>Content Planner</span>
                </div>
                <div className="text-[10px] text-orange-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>FastAPI + MongoDB</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
          {/* SECTION 1: WORKSPACE TABS */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center justify-between">
                <span>Workspace</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${roleMeta.badgeClasses}`}>
                  {roleMeta.name}
                </span>
              </div>
            )}

            {/* Today's Tasks */}
            {hasPermission('view_daily') && (
              <button
                onClick={() => handleNavClick('daily')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'daily'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Today's Tasks & Backlog Deck"
              >
                <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'daily' ? 'text-white' : 'text-orange-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Today's Tasks</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === 'daily'
                        ? 'bg-orange-700 text-white'
                        : pendingTillTodayCount > 0
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {pendingTillTodayCount}
                    </span>
                  </div>
                )}
              </button>
            )}

            {/* Posts Calendar */}
            {hasPermission('view_calendar') && (
              <button
                onClick={() => handleNavClick('calendar')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'calendar'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Posts Calendar View"
              >
                <Calendar className={`w-4 h-4 shrink-0 ${activeTab === 'calendar' ? 'text-white' : 'text-sky-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Posts Calendar</span>
                    <span className="text-[10px] text-slate-400">Monthly</span>
                  </div>
                )}
              </button>
            )}

            {/* Master Content Planner */}
            {hasPermission('view_master') && (
              <button
                onClick={() => handleNavClick('master')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'master'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="Master Content Planner"
              >
                <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'master' ? 'text-white' : 'text-emerald-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Master Planner</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === 'master' ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {deliverables.length}
                    </span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* SECTION 2: CLIENT BRANDS */}
          {hasPermission('view_brands') && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div 
                  onClick={() => setBrandsExpanded(!brandsExpanded)}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 flex items-center justify-between cursor-pointer hover:text-slate-300 select-none"
                >
                  <span>Client Brands ({visibleClients.length})</span>
                  {brandsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              )}

              {(brandsExpanded || isCollapsed) && (
                <div className="space-y-0.5">
                  {visibleClients.map(c => {
                    const isSelected = activeTab === `client-${c.id}`;
                    const count = deliverables.filter(d => d.client === c.name).length;
                    const color = getClientColor(c.name);

                    return (
                      <button
                        key={c.id}
                        onClick={() => handleNavClick(`client-${c.id}`)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
                          isSelected
                            ? 'bg-slate-800 text-white font-bold ring-1 ring-orange-500/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                        title={`${c.name} (${count} items)`}
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs ring-2 ring-slate-900" 
                          style={{ backgroundColor: color }}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between truncate">
                            <span className="truncate">{c.name}</span>
                            <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800/60 font-semibold">
                              {count}
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: MANAGEMENT & SYSTEM */}
          {(hasPermission('view_quotas') || hasPermission('manage_brands') || hasPermission('manage_team')) && (
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 px-3 py-1 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Management</span>
                </div>
              )}

              {/* Quota Matrix */}
              {hasPermission('view_quotas') && (
                <button
                  onClick={() => handleNavClick('quotas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'quotas'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Quota vs Delivered Matrix"
                >
                  <Table2 className={`w-4 h-4 shrink-0 ${activeTab === 'quotas' ? 'text-white' : 'text-amber-400'}`} />
                  {!isCollapsed && <span>Quota Matrix</span>}
                </button>
              )}

              {/* Manage Brands */}
              {hasPermission('manage_brands') && (
                <button
                  onClick={() => handleNavClick('clients')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'clients'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Manage Client Accounts & Quotas"
                >
                  <Building2 className={`w-4 h-4 shrink-0 ${activeTab === 'clients' ? 'text-white' : 'text-violet-400'}`} />
                  {!isCollapsed && <span>Manage Brands</span>}
                </button>
              )}

              {/* Team & Permissions */}
              {hasPermission('manage_team') && (
                <button
                  onClick={() => handleNavClick('team')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'team'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title="Multi-Account Team & Permissions"
                >
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === 'team' ? 'text-white' : 'text-rose-400'}`} />
                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>Team & Roles</span>
                      <span className="text-[9px] bg-orange-500/20 text-orange-400 font-bold px-1.5 py-0.5 rounded">
                        Multi
                      </span>
                    </div>
                  )}
                </button>
              )}

              {/* Activity & Security Audit Logs */}
              <button
                onClick={() => handleNavClick('logs')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                title="System Activity & Audit Logs"
              >
                <ScrollText className={`w-4 h-4 shrink-0 ${activeTab === 'logs' ? 'text-white' : 'text-emerald-400'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>Activity Logs</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      Ledger
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* SECTION 4: DATA TOOLS */}
          {hasPermission('data_backup') && !isCollapsed && (
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Data Tools
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                <button
                  onClick={onOpenImportExcel}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 transition-all active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Import Excel</span>
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all active:scale-95"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Profile & Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/95 relative shrink-0">
          {/* User Popover Menu */}
          {showUserMenu && !isCollapsed && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl space-y-3 z-50 animate-scale-up">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-700/80 flex items-center justify-between">
                <span>Account Profile</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${roleMeta.badgeClasses}`}>
                  {roleMeta.name}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="text-[10px] text-orange-400/90 font-medium pt-0.5 truncate">
                  {user?.title || roleMeta.defaultTitle}
                </div>
              </div>

              <div className="border-t border-slate-700/80 pt-2 space-y-1.5">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold bg-slate-700/50 hover:bg-slate-700 text-slate-200 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5 text-orange-400" />
                    <span>Switch Account (Enter Password)</span>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/15 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* User Card */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex-1 flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800 transition-colors text-left overflow-hidden group"
              title="Click to switch role or view profile"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`} 
                  alt={user?.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              {!isCollapsed && (
                <div className="truncate flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.name || 'Authenticated User'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <span className="font-semibold text-orange-400">
                      {user?.title || roleMeta.name}
                    </span>
                  </div>
                </div>
              )}
            </button>

            {!isCollapsed && (
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
