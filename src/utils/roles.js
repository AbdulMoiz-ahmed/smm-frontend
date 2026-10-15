export const ALL_PERMISSIONS = [
  { id: 'view_daily', label: "Today's Tasks Deck", description: "Access daily publishing queue and overdue backlog" },
  { id: 'view_calendar', label: "Posts Calendar", description: "Access monthly content calendar and schedule" },
  { id: 'view_master', label: "Master Content Planner", description: "Access deliverables grid, kanban, and table" },
  { id: 'view_brands', label: "Client Brand Feeds", description: "Access individual brand feeds and deliverables" },
  { id: 'view_quotas', label: "Quota Targets Matrix", description: "View monthly client post & reel quota tracking" },
  { id: 'manage_brands', label: "Manage Client Brands", description: "Create, edit, or delete agency client brands" },
  { id: 'manage_team', label: "Team & Permissions", description: "Manage team accounts, assign roles and custom access" },
  { id: 'manage_deliverables', label: "Create / Delete Deliverables", description: "Add new deliverables or delete existing ones" },
  { id: 'edit_copy', label: "Draft Captions & Copy", description: "Edit caption hooks, hashtag strategies, and copy" },
  { id: 'attach_assets', label: "Attach Design / Media Assets", description: "Upload creative drive links, Figma, and reels" },
  { id: 'update_status', label: "Update Status & Workflow", description: "Advance deliverable through Planned > Ready > Posted" },
  { id: 'data_backup', label: "Excel Import & JSON Backup", description: "Execute bulk Excel spreadsheet imports and backups" }
];

export const AGENCY_ROLES = {
  admin: {
    id: 'admin',
    name: "Agency Director",
    defaultTitle: "Agency Director & Founder",
    color: "amber",
    badgeClasses: "bg-amber-100 text-amber-900 border-amber-300",
    description: "Unrestricted master access across all brands, client contracts, and system configurations.",
    defaultPermissions: ALL_PERMISSIONS.map(p => p.id)
  },
  designer: {
    id: 'designer',
    name: "Graphic Designer",
    defaultTitle: "Lead Visual Designer",
    color: "violet",
    badgeClasses: "bg-violet-100 text-violet-900 border-violet-300",
    description: "Access Today's Tasks, Posts Calendar, design asset attachments, and creative status.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master', 'view_brands', 'attach_assets', 'update_status']
  },
  copywriter: {
    id: 'copywriter',
    name: "Content Writer / Copywriter",
    defaultTitle: "Senior Copywriter & Strategist",
    color: "emerald",
    badgeClasses: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description: "Access Today's Tasks, Posts Calendar, deliverable copy hooks, and captions.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master', 'view_brands', 'edit_copy', 'update_status']
  },
  video_editor: {
    id: 'video_editor',
    name: "Video Editor / Motion Artist",
    defaultTitle: "Reels & Video Specialist",
    color: "rose",
    badgeClasses: "bg-rose-100 text-rose-900 border-rose-300",
    description: "Focus on Reels and 9:16 video deliverables, render links, and creative production.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master', 'view_brands', 'attach_assets', 'update_status']
  },
  smm: {
    id: 'smm',
    name: "Social Media Manager",
    defaultTitle: "SMM & Content Publisher",
    color: "blue",
    badgeClasses: "bg-blue-100 text-blue-900 border-blue-300",
    description: "Publishing queue operations, marking deliverables Scheduled/Posted, and reviewing quotas.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master', 'view_brands', 'view_quotas', 'manage_deliverables', 'edit_copy', 'update_status']
  },
  account_manager: {
    id: 'account_manager',
    name: "Account Manager",
    defaultTitle: "Client Success Executive",
    color: "indigo",
    badgeClasses: "bg-indigo-100 text-indigo-900 border-indigo-300",
    description: "Oversees client accounts, monitors monthly quota attainment, and client communication.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master', 'view_brands', 'view_quotas', 'manage_deliverables']
  },
  custom: {
    id: 'custom',
    name: "Custom Agency Role",
    defaultTitle: "Team Specialist",
    color: "slate",
    badgeClasses: "bg-slate-100 text-slate-800 border-slate-300",
    description: "Custom role with fine-tuned granular tab and action permissions.",
    defaultPermissions: ['view_daily', 'view_calendar', 'view_master']
  }
};

export function getRoleMeta(roleKey) {
  return AGENCY_ROLES[roleKey] || AGENCY_ROLES.custom;
}
