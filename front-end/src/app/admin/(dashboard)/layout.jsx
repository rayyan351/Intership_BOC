// src/app/admin/layout.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ConfigProvider } from 'antd';
import AdminHeader from '../_components/layout/Header';
import AdminSidebar from '../_components/layout/Sidebar';
import AdminNotificationToastListener from '../_components/notifications/AdminNotificationToastListener';
import ProtectedRoute from '../_components/routes/ProtectedRoute';
import { useGetSettingsQuery } from '@/services/settingApi';

const { Content } = Layout;

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: settings } = useGetSettingsQuery();

  useEffect(() => {
    const brand = settings?.storeName || "Burger O'Clock";
    document.title = `${brand} | Admin Portal`;
  }, [settings]);

  return (
    <ProtectedRoute>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#F4C61A',
            borderRadius: 12,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          },
          components: {
            Layout: {
              headerBg: '#000000',
              siderBg: '#000000',
              triggerBg: '#000000',
              triggerColor: '#ffffff',
              bodyBg: '#f8fafc',
            },
            Menu: {
              darkItemBg: '#000000',
              darkSubMenuItemBg: '#000000',
              darkItemSelectedBg: '#F4C61A',
              darkPopupBg: '#0a0a0a',
              darkItemSelectedColor: '#000000',
              darkItemHoverBg: '#141414',
              darkItemColor: '#a1a1aa',
            },
          },
        }}
      >
        <Layout className="min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Global Order & Stock Push Notification Listener */}
          <AdminNotificationToastListener />

          <AdminHeader />

          <Layout hasSider className="min-h-[calc(100vh-64px)]">
            <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <Content
              style={{
                padding: '28px 36px',
                backgroundColor: '#f8fafc',
                minWidth: 0,
                flex: 1,
              }}
            >
              <div className="w-full max-w-6xl mx-auto">
                {children}
              </div>
            </Content>
          </Layout>
        </Layout>
      </ConfigProvider>
    </ProtectedRoute>
  );
}