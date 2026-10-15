import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import { 
  Plus, Menu, Sparkles, Database, FileSpreadsheet, UploadCloud, 
  RotateCcw, Crown, Palette, LogOut, CheckCircle2, PenTool, Video, Share2, Briefcase, User
} from 'lucide-react';
import { getRoleMeta } from '../utils/roles';

export default function Header({ 
  activeTab, 
  onOpenNewDeliverable, 
  onOpenNewClient, 
  onOpenBackup, 
  onOpenImportExcel,
  onToggleMobileSidebar 
}) {
  const { user, isAdmin, roleMeta, hasPermission } = useAuth();
  const { clients, deliverables, stats, dbType } = usePlanner();

  const currentViewTitle = useMemo(() => {
    if (activeTab === 'daily') return "Today's Tasks & Backlog Deck";
    if (activeTab === 'calendar') return "Content Schedule & Calendar";
    if (activeTab === 'master') return "Master Content Planner";
    if (activeTab === 'quotas') return "Client Quota Matrix";
    if (activeTab === 'clients') return "Client Brand Manager";
    if (activeTab === 'team') return "Team & Role Access Management";
    if (activeTab.startsWith('client-')) {
      const clientId = activeTab.replace('client-', '');
      const found = clients.find(c => c.id === clientId);
      return found ? `${found.name} • Brand Deliverables` : "Brand View";
    }
    return "Content Planner Dashboard";
  }, [activeTab, clients]);

  const canAddDeliverable = hasPermission('manage_deliverables') || hasPermission('attach_assets') || hasPermission('edit_copy');
  const canAddBrand = hasPermission('manage_brands');

  return (
    <header className="bg-white border-b border-slate-200/90 text-slate-800 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="leading-tight truncate">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                {currentViewTitle}
              </h1>
              <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${roleMeta.badgeClasses}`}>
                <span>{user?.title || roleMeta.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{dbType} Live</span>
              </span>
              <span>•</span>
              <span className="hidden md:inline">{clients.length} Active Brands</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{stats.scheduled + stats.posted} Ready / Posted</span>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {canAddBrand && (
            <button
              onClick={onOpenNewClient}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
              title="Add a new client brand"
            >
              <Plus className="w-3.5 h-3.5 text-orange-600" />
              <span>+ Brand</span>
            </button>
          )}

          {canAddDeliverable && (
            <button
              onClick={onOpenNewDeliverable}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm shadow-orange-500/20 transition-all active:scale-95"
              title="Create a new post or reel deliverable"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">New Deliverable</span>
              <span className="sm:hidden">New</span>
            </button>
          )}

          {/* User Profile Badge */}
          <div className="pl-1 sm:pl-2 border-l border-slate-200 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs shrink-0">
              <img 
                src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`} 
                alt={user?.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">{user?.name}</div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">{user?.email}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
