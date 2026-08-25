// src/app/admin/_components/layout/AdminSidebar.jsx
'use client';

import React, { useMemo } from 'react';
import { useGetLowStockAlertsQuery } from '@/services/inventoryApi';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  TagsOutlined,
  AuditOutlined,
  PictureOutlined,
  ShopOutlined,
  BankOutlined,
  SettingOutlined,
  TeamOutlined,
  InboxOutlined,
  ReconciliationOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

const { Sider } = Layout;

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = usePermission();
  const { data: lowStockAlerts = [] } = useGetLowStockAlertsQuery();
  const alertCount = lowStockAlerts.length;

  const menuItems = useMemo(() => {
    const rawItems = [
      {
        key: '/admin/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        allowed: hasPermission('dashboard:view'),
      },
      {
        key: '/admin/orders',
        icon: <ShoppingOutlined />,
        label: 'Live Orders Feed',
        allowed: hasPermission('orders:view'),
      },
      {
        key: 'products-submenu',
        icon: <AppstoreOutlined />,
        label: 'Products & Menu',
        children: [
          {
            key: '/admin/products',
            icon: <FolderOpenOutlined />,
            label: 'Menu Catalog',
            allowed: hasPermission('products:view') || hasPermission('deals:view'),
          },
          {
            key: '/admin/products/categories',
            icon: <TagsOutlined />,
            label: 'Categories & Sections',
            allowed:
              hasPermission('categories:view') ||
              hasPermission('dealcategories:view') ||
              hasPermission('sections:view'),
          },
          {
            key: '/admin/recipes',
            icon: <ExperimentOutlined />,
            label: 'Recipes & Prep',
            allowed: hasPermission('recipes:view'),
          },
        ],
      },
      {
        key: 'inventory-submenu',
        icon: <InboxOutlined />,
        label: (
          <div className="flex items-center justify-between w-full pr-2">
            <span>Inventory</span>
            {alertCount > 0 && (
              <Badge
                count={alertCount}
                overflowCount={99}
                className="ml-2"
                style={{ backgroundColor: '#ef4444', fontSize: '10px', fontWeight: 800 }}
              />
            )}
          </div>
        ),
        children: [
          {
            key: '/admin/inventory',
            icon: <ReconciliationOutlined />,
            label: 'Stock & Items',
            allowed: hasPermission('inventory:view'),
          },
          {
            key: '/admin/inventory/purchasing',
            icon: <DollarCircleOutlined />,
            label: 'Purchasing & Vendors',
            allowed: hasPermission('purchase_orders:view'),
          },
          {
            key: '/admin/inventory/stocktake',
            icon: <AuditOutlined />,
            label: 'Audit & Reconciliation',
            allowed: hasPermission('inventory:view'),
          },
        ],
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
            allowed: hasPermission('locations:view'),
          },
          {
            key: '/admin/branchoperations/roles',
            icon: <SafetyCertificateOutlined />,
            label: 'Roles & Matrix',
            allowed: hasPermission('roles:view'),
          },
          {
            key: '/admin/branchoperations/staff',
            icon: <TeamOutlined />,
            label: 'Staff & Accounts',
            allowed: hasPermission('staff:view'),
          },
        ],
      },
    {
        key: 'settings-submenu',
        icon: <SettingOutlined />,
        label: 'Store Settings',
        children: [
          {
            key: '/admin/settings/banners',
            icon: <PictureOutlined />,
            label: 'Hero Banners',
            allowed: hasPermission('banners:view'),
          },
          {
            key: '/admin/settings/delivery-areas',
            icon: <EnvironmentOutlined />,
            label: 'Areas & Tax (SST)',
            allowed: hasPermission('settings:edit'),
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'General Configuration',
            allowed: hasPermission('settings:view'),
          },
        ],
      },
    ];

    // Cleanly strips out custom permission flags so Ant Design doesn't forward them to HTML <li> tags
    return rawItems
      .map((item) => {
        if (item.children) {
          const visibleChildren = item.children
            .filter((child) => (child.allowed !== undefined ? child.allowed : true))
            .map(({ allowed, ...cleanChild }) => cleanChild);

          if (visibleChildren.length === 0) return null;
          const { allowed, ...cleanItem } = item;
          return { ...cleanItem, children: visibleChildren };
        }

        if (item.allowed === false) {
          return null;
        }

        const { allowed, ...cleanItem } = item;
        return cleanItem;
      })
      .filter(Boolean);
  }, [hasPermission, alertCount]);

  const getOpenKeys = () => {
    const keys = [];
    if (
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/recipes')
    ) {
      keys.push('products-submenu');
    }
    if (pathname.startsWith('/admin/inventory')) {
      keys.push('inventory-submenu');
    }
    if (pathname.startsWith('/admin/branchoperations')) {
      keys.push('branch-operations');
    }
    if (pathname.startsWith('/admin/settings')) {
      keys.push('settings-submenu');
    }
    return keys;
  };

  // Precise highlight matching: Specific sub-routes are checked before general prefix paths
  const activeSelectedKey = useMemo(() => {
    if (pathname.startsWith('/admin/products/categories')) return '/admin/products/categories';
    if (pathname === '/admin/products' || pathname.startsWith('/admin/products/')) return '/admin/products';
    if (pathname.startsWith('/admin/recipes')) return '/admin/recipes';
    if (pathname.startsWith('/admin/inventory/purchasing')) return '/admin/inventory/purchasing';
    if (pathname.startsWith('/admin/inventory/stocktake')) return '/admin/inventory/stocktake';
    if (pathname.startsWith('/admin/inventory')) return '/admin/inventory';
    if (pathname.startsWith('/admin/branchoperations/locations')) return '/admin/branchoperations/locations';
    if (pathname.startsWith('/admin/branchoperations/roles')) return '/admin/branchoperations/roles';
    if (pathname.startsWith('/admin/branchoperations/staff')) return '/admin/branchoperations/staff';
    if (pathname.startsWith('/admin/settings/delivery-areas')) return '/admin/settings/delivery-areas';
    if (pathname.startsWith('/admin/settings')) return '/admin/settings';
    return pathname;
  }, [pathname]);

  const handleMenuClick = ({ key }) => {
    if (
      key === 'products-submenu' ||
      key === 'inventory-submenu' ||
      key === 'branch-operations' ||
      key === 'settings-submenu'
    ) {
      return;
    }
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
      style={{ backgroundColor: '#000000', minHeight: '100vh' }}
      className="shrink-0 select-none m-0 p-0"
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
        selectedKeys={[activeSelectedKey]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ backgroundColor: '#000000' }}
        className="pt-4 pb-6 font-medium text-sm border-r-0"
      />
    </Sider>
  );
}