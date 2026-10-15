import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AGENCY_ROLES, getRoleMeta } from '../utils/roles';

const API_BASE = '/api';
const TOKEN_KEY = 'content_planner_auth_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Validate existing session on mount
  const checkAuth = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setIsLoadingAuth(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth(token);
  }, [token, checkAuth]);

  // Login handler
  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
    }

    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  // Quick switch between accounts
  const quickSwitch = async (email, password) => {
    return await login(email, password);
  };

  // Role & Permissions helpers
  const isAdmin = user?.role === 'admin';
  const roleMeta = getRoleMeta(user?.role);
  const roleLabel = user?.title || roleMeta.name;

  const hasPermission = (permissionId) => {
    if (!user) return false;
    if (isAdmin) return true;
    const perms = user.permissions || roleMeta.defaultPermissions || [];
    return perms.includes(permissionId);
  };

  const canAccessBrand = (brandName) => {
    if (!user) return false;
    if (isAdmin) return true;
    const brands = user.assignedBrands || ['All'];
    if (brands.includes('All')) return true;
    return brands.includes(brandName);
  };

  const canAccessTab = (tab) => {
    if (!user) return false;
    if (isAdmin) return true;
    
    if (tab === 'daily') return hasPermission('view_daily');
    if (tab === 'calendar') return hasPermission('view_calendar');
    if (tab === 'master') return hasPermission('view_master');
    if (tab === 'quotas') return hasPermission('view_quotas');
    if (tab === 'clients') return hasPermission('manage_brands');
    if (tab === 'team') return hasPermission('manage_team');
    
    if (tab.startsWith('client-')) {
      return hasPermission('view_brands');
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoadingAuth,
        isAdmin,
        roleMeta,
        roleLabel,
        hasPermission,
        canAccessBrand,
        canAccessTab,
        login,
        logout,
        quickSwitch,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
