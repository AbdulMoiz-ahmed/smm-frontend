import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('content_planner_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const PlannerContext = createContext(null);

export function PlannerProvider({ children }) {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);
  const [dbType, setDbType] = useState('MongoDB');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Role-based deliverable format restriction:
  // Video Editor: ONLY Reels
  // Graphic Designer: ONLY Posts
  const roleRestrictedFormat = useMemo(() => {
    if (!user) return null;
    if (user.role === 'video_editor') return 'Reel';
    if (user.role === 'designer') return 'Post';
    return null;
  }, [user]);

  // ──────────────────────────────────────────
  // Fetch All Data from Database API
  // ──────────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [healthRes, clientsRes, deliverablesRes] = await Promise.all([
        fetch(`${API_BASE}/health`),
        fetch(`${API_BASE}/clients`, { headers }),
        fetch(`${API_BASE}/deliverables`, { headers })
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setDbType(healthData.database === 'mongodb' ? 'MongoDB' : 'SQLite');
      }

      if (!clientsRes.ok || !deliverablesRes.ok) {
        throw new Error('Failed to fetch from backend API');
      }

      const clientsData = await clientsRes.json();
      const deliverablesData = await deliverablesRes.json();

      setClients(clientsData);
      setDeliverables(deliverablesData);
      setDbConnected(true);
    } catch (err) {
      console.error('Error fetching data from database:', err);
      setDbConnected(false);
      addToast('Cannot connect to database backend. Please check server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [user, refreshData]);

  // Client Helpers
  const getClientColor = (clientName) => {
    const found = clients.find(c => c.name === clientName);
    return found?.color || '#64748b';
  };

  const getClientAbbr = (clientName) => {
    if (!clientName) return 'CL';
    return clientName
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ──────────────────────────────────────────
  // Deliverable Actions (DB-Backed)
  // ──────────────────────────────────────────
  const addDeliverable = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Failed to create deliverable');
      const created = await res.json();
      setDeliverables(prev => [created, ...prev]);
      addToast(`Added deliverable for ${created.client}`, 'success');
      return created;
    } catch (err) {
      console.error('Error adding deliverable:', err);
      addToast('Failed to save deliverable to database', 'error');
    }
  };

  const updateDeliverable = async (id, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE}/deliverables/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update deliverable');
      const updated = await res.json();
      setDeliverables(prev => prev.map(item => (item.id === id ? updated : item)));
      addToast('Deliverable updated in database', 'success');
    } catch (err) {
      console.error('Error updating deliverable:', err);
      addToast('Failed to update deliverable', 'error');
    }
  };

  const deleteDeliverable = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/deliverables/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete deliverable');
      setDeliverables(prev => prev.filter(d => d.id !== id));
      addToast('Deliverable removed from database', 'info');
    } catch (err) {
      console.error('Error deleting deliverable:', err);
      addToast('Failed to delete deliverable', 'error');
    }
  };

  const duplicateDeliverable = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/deliverables/${id}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to duplicate deliverable');
      const duplicated = await res.json();
      setDeliverables(prev => [duplicated, ...prev]);
      addToast('Duplicated deliverable in database', 'success');
    } catch (err) {
      console.error('Error duplicating deliverable:', err);
      addToast('Failed to duplicate deliverable', 'error');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      // Optimistic update in UI
      setDeliverables(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
      );
      const res = await fetch(`${API_BASE}/deliverables/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      addToast(`Status changed to ${newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      addToast('Failed to persist status change', 'error');
      refreshData();
    }
  };

  // ──────────────────────────────────────────
  // Client Actions (DB-Backed)
  // ──────────────────────────────────────────
  const addClient = async (client) => {
    try {
      const res = await fetch(`${API_BASE}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(client)
      });
      if (!res.ok) throw new Error('Failed to add client');
      const created = await res.json();
      setClients(prev => [...prev, created]);
      addToast(`Brand "${created.name}" created in database`, 'success');
      return created;
    } catch (err) {
      console.error('Error creating client:', err);
      addToast('Failed to save brand to database', 'error');
    }
  };

  const updateClient = async (id, updatedFields) => {
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updatedFields)
      });
      if (!res.ok) throw new Error('Failed to update client');
      await refreshData();
      addToast('Brand details updated in database', 'success');
    } catch (err) {
      console.error('Error updating client:', err);
      addToast('Failed to update brand', 'error');
    }
  };

  const deleteClient = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete client');
      await refreshData();
      addToast('Brand and associated deliverables deleted from DB', 'warning');
    } catch (err) {
      console.error('Error deleting client:', err);
      addToast('Failed to delete brand from database', 'error');
    }
  };

  // ──────────────────────────────────────────
  // Seed / Reset Database
  // ──────────────────────────────────────────
  const resetData = async () => {
    try {
      const res = await fetch(`${API_BASE}/seed`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to seed database');
      await refreshData();
      addToast('Database reset and re-seeded with master spreadsheet data!', 'info');
    } catch (err) {
      console.error('Error resetting database:', err);
      addToast('Failed to re-seed database', 'error');
    }
  };

  // ──────────────────────────────────────────
  // Export / Import
  // ──────────────────────────────────────────
  const exportData = async () => {
    try {
      const res = await fetch(`${API_BASE}/export`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to export data');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sqlite-content-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Database exported as JSON backup', 'success');
    } catch (err) {
      console.error('Error exporting data:', err);
      addToast('Failed to export database', 'error');
    }
  };

  const importData = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || 'Failed to import data');
      }
      const data = await res.json();
      await refreshData();
      addToast(
        `Successfully imported ${data.importedDeliverables || 0} deliverables for ${data.importedClients || 0} brands into ${dbType}!`,
        'success'
      );
      return data;
    } catch (err) {
      console.error('Error importing data:', err);
      addToast(err.message || 'Error importing data into database', 'error');
      return null;
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Client', 'Date', 'Week', 'Format', 'Title', 'Asset Type', 'Caption Focus', 'Status'];
    const rows = visibleDeliverables.map(d => [
      d.id,
      `"${(d.client || '').replace(/"/g, '""')}"`,
      d.date,
      d.week,
      d.format,
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.asset || '').replace(/"/g, '""')}"`,
      `"${(d.caption || '').replace(/"/g, '""')}"`,
      d.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deliverables-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Deliverables exported as CSV', 'success');
  };

  // ──────────────────────────────────────────
  // Role-Filtered Deliverables Guaranteed Across All Views
  // ──────────────────────────────────────────
  const visibleDeliverables = useMemo(() => {
    if (!roleRestrictedFormat) return deliverables;
    return deliverables.filter(d => d.format === roleRestrictedFormat);
  }, [deliverables, roleRestrictedFormat]);

  // ──────────────────────────────────────────
  // Stats Calculation
  // ──────────────────────────────────────────
  const stats = useMemo(() => {
    const total = visibleDeliverables.length;
    const scheduled = visibleDeliverables.filter(d => d.status === 'Scheduled').length;
    const inCreation = visibleDeliverables.filter(d => d.status === 'In Creation').length;
    const planned = visibleDeliverables.filter(d => d.status === 'Planned').length;
    const posted = visibleDeliverables.filter(d => d.status === 'Posted').length;
    const reels = visibleDeliverables.filter(d => d.format === 'Reel').length;
    const posts = visibleDeliverables.filter(d => d.format === 'Post').length;

    const totalQuota = clients.reduce((acc, c) => acc + (c.postsQuota || 0) + (c.reelsQuota || 0), 0);
    const progress = total > 0 ? Math.round(((posted + scheduled) / total) * 100) : 0;

    return {
      total,
      scheduled,
      inCreation,
      planned,
      posted,
      reels,
      posts,
      totalQuota,
      progress
    };
  }, [visibleDeliverables, clients]);

  return (
    <PlannerContext.Provider
      value={{
        clients,
        deliverables: visibleDeliverables,
        rawDeliverables: deliverables,
        roleRestrictedFormat,
        stats,
        isLoading,
        dbConnected,
        dbType,
        toasts,
        addToast,
        removeToast,
        getClientColor,
        getClientAbbr,
        addDeliverable,
        updateDeliverable,
        deleteDeliverable,
        duplicateDeliverable,
        updateStatus,
        addClient,
        updateClient,
        deleteClient,
        resetData,
        exportData,
        importData,
        exportCSV,
        refreshData
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
