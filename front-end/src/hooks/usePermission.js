// src/hooks/usePermission.js
'use client';

import { useMemo } from 'react';

export function usePermission() {
  const user = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('adminUser') || localStorage.getItem('user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const hasPermission = (permissionKey) => {
    if (!user) return false;
    
    // Super Admins and Admins bypass all restrictions
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    if (user.permissions?.includes('*')) return true;

    return Boolean(user.permissions?.includes(permissionKey));
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  return { hasPermission, isSuperAdmin, user };
}