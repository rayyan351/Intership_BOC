// src/app/admin/_components/layout/AdminSidebar.jsx
'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  TagsOutlined,
  GiftOutlined,
  SafetyCertificateOutlined,
  LayoutOutlined,
  PictureOutlined,
  ShopOutlined,
  BankOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

const { Sider } = Layout;

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = usePermission();
  console.log(hasPermission);
  const menuItems = useMemo(() => {
    const rawItems = [
      {
        key: '/admin/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: 'dashboard:view',
      },
      {
        key: '/admin/orders',
        icon: <ShoppingOutlined />,
        label: 'Orders',
        permission: 'orders:view',
      },
      {
        key: 'products-submenu',
        icon: <AppstoreOutlined />,
        label: 'Products',
        children: [
          {
            key: '/admin/products/categories',
            icon: <TagsOutlined />,
            label: 'Categories',
            permission: 'categories:view',
          },
          {
            key: '/admin/products/dealcategories',
            icon: <TagsOutlined />,
            label: 'Deal Categories',
            permission: 'dealcategories:view',
          },
          {
            key: '/admin/products/sections',
            icon: <LayoutOutlined />,
            label: 'Display Sections',
            permission: 'sections:view',
          },
          {
            key: '/admin/products/allproducts',
            icon: <UnorderedListOutlined />,
            label: 'All Products',
            permission: 'products:view',
          },
          {
            key: '/admin/products/deals',
            icon: <GiftOutlined />,
            label: 'Deals & Bundles',
            permission: 'deals:view',
          },
        ],
      },
      {
        key: '/admin/banners',
        icon: <PictureOutlined />,
        label: 'Hero Banners',
        permission: 'banners:view',
      },
      {
        key: 'branch-operations',
        icon: <BankOutlined />,
        label: 'Branch Operations',
        children: [
          {
            key: '/admin/branchoperations/locations',
            icon: <ShopOutlined />,
            label: 'Store Outlets',
            permission: 'locations:view',
          },
          {
            key: '/admin/branchoperations/roles',
            icon: <SafetyCertificateOutlined />,
            label: 'Roles & Matrix',
            permission: 'roles:view',
          },
          {
            key: '/admin/branchoperations/staff',
            icon: <TeamOutlined />,
            label: 'Staff & Accounts',
            permission: 'staff:view',
          },
        ],
      },
      {
        key: '/admin/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        permission: 'settings:view',
      },
    ];

    // Filter menu items dynamically against active permissions
    return rawItems
      .map((item) => {
        if (item.children) {
          const visibleChildren = item.children.filter((child) =>
            child.permission ? hasPermission(child.permission) : true
          );

          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }

        if (item.permission && !hasPermission(item.permission)) {
          return null;
        }

        return item;
      })
      .filter(Boolean);
  }, [hasPermission]);

  // Keep submenus expanded when visiting nested routes
  const getOpenKeys = () => {
    const keys = [];
    if (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories')) {
      keys.push('products-submenu');
    }
    if (pathname.startsWith('/admin/branchoperations')) {
      keys.push('branch-operations');
    }
    return keys;
  };

  const handleMenuClick = ({ key }) => {
    if (key === 'products-submenu' || key === 'branch-operations') return;
    router.push(key);
  };

  return (
    <Sider
      collapsible
      breakpoint="lg"
      collapsedWidth="80"
      collapsed={collapsed}
      onCollapse={(value) => setCollapsed(value)}
      width={240}
      theme="dark"
      style={{ backgroundColor: '#000000' }}
      className="shrink-0 select-none"
    >
      <style jsx global>{`
        .ant-menu-dark .ant-menu-submenu-title {
          color: rgba(255, 255, 255, 0.65) !important;
        }
        .ant-menu-dark .ant-menu-submenu-title:hover {
          color: #ffffff !important;
        }
        .ant-menu-dark .ant-menu-item-selected {
          background-color: #ffc400 !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }
        .ant-menu-sub {
          background: #000000 !important;
        }
      `}</style>

      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[pathname]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ backgroundColor: '#000000' }}
        className="py-4 font-medium text-sm sticky top-16"
      />
    </Sider>
  );
}