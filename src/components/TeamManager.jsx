import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import { 
  Users, UserPlus, Shield, Palette, Crown, Trash2, CheckCircle2, 
  XCircle, Key, Mail, User, AlertCircle, Sparkles, RefreshCw, Edit3, 
  PenTool, Video, Share2, Briefcase, Check, Building2, SlidersHorizontal
} from 'lucide-react';
import { ALL_PERMISSIONS, AGENCY_ROLES, getRoleMeta } from '../utils/roles';

export default function TeamManager() {
  const { token, user: currentUser } = useAuth();
  const { clients, addToast } = usePlanner();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'designer',
    title: '',
    assignedBrands: ['All'],
    permissions: []
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json().catch(() => ({}));
        addToast(err.detail || 'Failed to fetch team members', 'error');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast('Error contacting backend server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [token, addToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Add Modal
  const openAddModal = () => {
    const defaultRole = AGENCY_ROLES.designer;
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'designer',
      title: defaultRole.defaultTitle,
      assignedBrands: ['All'],
      permissions: [...defaultRole.defaultPermissions]
    });
    setFormError('');
    setEditingUser(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Leave empty to keep existing password
      role: userToEdit.role || 'designer',
      title: userToEdit.title || '',
      assignedBrands: userToEdit.assignedBrands && userToEdit.assignedBrands.length > 0 ? userToEdit.assignedBrands : ['All'],
      permissions: userToEdit.permissions || []
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // When role preset changes in form, apply default title and permissions
  const handleRolePresetChange = (roleKey) => {
    const meta = getRoleMeta(roleKey);
    setFormData(prev => ({
      ...prev,
      role: roleKey,
      title: meta.defaultTitle,
      permissions: [...meta.defaultPermissions]
    }));
  };

  // Toggle permission checkbox
  const handleTogglePermission = (permId) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      const updated = exists 
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: updated };
    });
  };

  // Toggle assigned brand
  const handleToggleBrand = (brandName) => {
    setFormData(prev => {
      let current = [...prev.assignedBrands];
      if (brandName === 'All') {
        return { ...prev, assignedBrands: ['All'] };
      }
      current = current.filter(b => b !== 'All');
      if (current.includes(brandName)) {
        current = current.filter(b => b !== brandName);
      } else {
        current.push(brandName);
      }
      if (current.length === 0) current = ['All'];
      return { ...prev, assignedBrands: current };
    });
  };

  // Submit Handler (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // UPDATE
        const payload = {
          name: formData.name,
          role: formData.role,
          title: formData.title,
          permissions: formData.permissions,
          assignedBrands: formData.assignedBrands
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }

        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to update user');
        }

        const updated = await res.json();
        setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
        addToast(`Permissions and profile for "${updated.name}" updated!`, 'success');
        setIsAddModalOpen(false);
      } else {
        // CREATE
        if (!formData.name || !formData.email || !formData.password) {
          throw new Error('Name, email, and password are required');
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to create user');
        }

        const newUser = await res.json();
        setUsers(prev => [newUser, ...prev]);
        addToast(`Account for ${newUser.name} created with custom permissions!`, 'success');
        setIsAddModalOpen(false);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete account for "${userName}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to delete user');
      }
      setUsers(prev => prev.filter(u => u.id !== userId));
      addToast(`Account "${userName}" deleted`, 'info');
    } catch (err) {
      addToast(err.message || 'Cannot delete account', 'error');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to update user status');
      }
      const updated = await res.json();
      setUsers(prev => prev.map(u => (u.id === user.id ? updated : u)));
      addToast(`Account ${updated.isActive ? 'activated' : 'deactivated'}`, 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">Agency Team & Granular Permissions</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
              Multi-Role Access Control
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 max-w-2xl">
            Give graphic designers, copywriters, video editors, social media managers, and client leads precise access to the exact tabs, actions, and client brands they need.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all active:scale-95"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/25 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.values(AGENCY_ROLES).filter(r => r.id !== 'custom').map(role => (
          <div key={role.id} className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${role.badgeClasses}`}>
                {role.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {users.filter(u => u.role === role.id).length} Active
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">{role.name}</div>
            <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
              {role.description}
            </p>
          </div>
        ))}
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Team Roster ({users.length} Members)
          </h3>
          <span className="text-[11px] text-slate-500">
            Salted Bcrypt Security • Dynamic RBAC
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map(u => {
            const isSelf = u.id === currentUser?.id;
            const isRoot = u.id === 'u_admin';
            const meta = getRoleMeta(u.role);
            const assignedBrands = u.assignedBrands || ['All'];

            return (
              <div key={u.id} className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                {/* User Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs mt-0.5">
                    <img src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.name}`} alt={u.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClasses}`}>
                        {meta.name}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                          Current You
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-700">{u.title || meta.defaultTitle}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {u.email}
                      </span>
                    </div>

                    {/* Permissions & Brands Tags */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Brands:</span>
                      {assignedBrands.includes('All') ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          All Brands
                        </span>
                      ) : (
                        assignedBrands.map(b => (
                          <span key={b} className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-orange-50 text-orange-800 border border-orange-200">
                            {b}
                          </span>
                        ))
                      )}

                      <span className="text-[10px] text-slate-400 font-semibold mx-1">•</span>
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Tabs:</span>
                      {(u.permissions || []).slice(0, 4).map(pId => {
                        const perm = ALL_PERMISSIONS.find(p => p.id === pId);
                        return perm ? (
                          <span key={pId} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {perm.label.split(' ')[0]}
                          </span>
                        ) : null;
                      })}
                      {(u.permissions || []).length > 4 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          +{u.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                  {/* Edit Role & Permissions Button */}
                  <button
                    type="button"
                    onClick={() => openEditModal(u)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all active:scale-95"
                    title="Customize role and permissions"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Permissions</span>
                  </button>

                  {/* Active Toggle */}
                  <button
                    type="button"
                    onClick={() => !isRoot && handleToggleStatus(u)}
                    disabled={isRoot}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      u.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    } ${isRoot ? 'cursor-not-allowed opacity-80' : 'cursor-pointer active:scale-95'}`}
                    title={isRoot ? 'Root administrator cannot be deactivated' : 'Click to toggle status'}
                  >
                    {u.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  {!isRoot && !isSelf && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all active:scale-95"
                      title={`Delete account for ${u.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add / Edit Team Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  {editingUser ? <SlidersHorizontal className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingUser ? `Configure Access: ${editingUser.name}` : "Add Agency Team Member"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign role preset, custom job title, and granular permissions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-5">
              {/* Basic Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Maya (Creative Director)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUser}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. maya@agency.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {editingUser ? 'Password (Leave blank to keep unchanged)' : 'Initial Password'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUser ? "••••••••••••" : "Create password"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Custom Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Lead Brand & Motion Specialist"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Role Preset Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Select Agency Role Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(AGENCY_ROLES).map(role => {
                    const isSelected = formData.role === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleRolePresetChange(role.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-1 ring-orange-500 shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{role.name.split(' ')[0]}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{role.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Client Brand Scope Selector */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Client Brand Assignment Scope
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Restricts visible brand feeds
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleToggleBrand('All')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      formData.assignedBrands.includes('All')
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Brands (Full Access)
                  </button>

                  {clients.map(c => {
                    const isSelected = !formData.assignedBrands.includes('All') && formData.assignedBrands.includes(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleToggleBrand(c.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-orange-100 text-orange-900 border-orange-400 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Granular Access Permissions ({formData.permissions.length} Enabled)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Click checkboxes to customize
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {ALL_PERMISSIONS.map(perm => {
                    const isChecked = formData.permissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer border transition-all select-none ${
                          isChecked
                            ? 'bg-white border-orange-200/90 text-slate-900 shadow-2xs font-semibold'
                            : 'bg-transparent border-transparent text-slate-500 hover:bg-white/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800">{perm.label}</div>
                          <div className="text-[10px] text-slate-500">{perm.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update Account Access' : 'Create Team Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
