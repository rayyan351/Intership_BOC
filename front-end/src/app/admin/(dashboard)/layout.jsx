// src/app/admin/layout.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Layout, ConfigProvider } from 'antd';
import AdminHeader from '../_components/layout/Header';
import AdminSidebar from '../_components/layout/Sidebar';
import ProtectedRoute from '../_components/routes/ProtectedRoute';
import { useGetSettingsQuery } from '@/services/settingApi';

const { Content } = Layout;

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { data: settings } = useGetSettingsQuery();

  // Dynamic Browser Tab Title for Admin Panel
  useEffect(() => {
    const brand = settings?.storeName || "Burger O'Clock";
    document.title = `${brand} | Admin Portal`;
  }, [settings]);

  return (
    <ProtectedRoute>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#ffc400',
            borderRadius: 8,
            fontFamily: 'inherit',
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
              darkItemSelectedBg: '#ffc400',
              darkItemSelectedColor: '#000000',
              darkItemHoverBg: '#1f1f1f',
              darkItemColor: '#a1a1aa',
            },
          },
        }}
      >
        <Layout className="min-h-screen">
          <AdminHeader />

          <Layout hasSider className="min-h-[calc(100vh-64px)]">
            <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <Content
              style={{
                padding: '24px 32px',
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