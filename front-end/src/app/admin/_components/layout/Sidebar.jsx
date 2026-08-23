// src/app/admin/_components/layout/AdminSidebar.jsx
'use client';

import React, { useMemo } from 'react';
import { useGetLowStockAlertsQuery } from '@/services/inventoryApi';
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  TagsOutlined,
  RiseOutlined,
  GiftOutlined,
  AuditOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  LayoutOutlined,
  PictureOutlined,
  ShopOutlined,
  BankOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  HistoryOutlined,
  ReconciliationOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
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
        permission: 'dashboard:view',
      },
      {
        key: '/admin/orders',
        icon: <ShoppingOutlined />,
        label: 'Live Orders Feed',
        permission: 'orders:view',
      },
      {
        key: 'products-submenu',
        icon: <AppstoreOutlined />,
        label: 'Products & Menu',
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
        key: 'inventory-submenu',
        icon: <InboxOutlined />,
        label: (
          <div className="flex items-center justify-between w-full pr-2">
            <span>Inventory & Stock</span>
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
            label: 'Raw Materials & Stock',
            permission: 'inventory:view',
          },
          {
            key: '/admin/inventory/ledger',
            icon: <HistoryOutlined />,
            label: 'Stock Audit Ledger',
            permission: 'inventory:view',
          },
          {
            key: '/admin/inventory/margins',
            icon: <RiseOutlined />,
            label: 'Profitability & COGS',
            permission: 'inventory:view',
          },
          {
            key: '/admin/inventory/suppliers',
            icon: <ShopOutlined />,
            label: 'Vendors & Suppliers',
            permission: 'suppliers:view',
          },
          {
            key: '/admin/inventory/suppliers/analytics',
            icon: <AuditOutlined />,
            label: 'Supplier Scorecards',
            permission: 'suppliers:view',
          },
          {
            key: '/admin/inventory/purchase-orders',
            icon: <DollarCircleOutlined />,
            label: 'Purchase Orders',
            permission: 'purchase_orders:view',
          },
          {
            key: '/admin/inventory/stocktake',
            icon: <AuditOutlined />,
            label: 'Stocktake & Audit',
            permission: 'inventory:view',
          },
          {
            key: '/admin/inventory/auto-reorder',
            icon: <ThunderboltOutlined />,
            label: 'Auto Reorder Engine',
            permission: 'purchase_orders:create',
          },
          {
            key: '/admin/inventory/valuation',
            icon: <DollarOutlined />,
            label: 'Stock Valuation & Balance',
            permission: 'inventory:view',
          },
          {
            key: '/admin/inventory/batches',
            icon: <SafetyCertificateOutlined />,
            label: 'Batch Lots & Expiry (FEFO)',
            permission: 'inventory:view',
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
        key: 'settings-submenu',
        icon: <SettingOutlined />,
        label: 'Store Settings',
        children: [
          {
            key: '/admin/settings/delivery-areas',
            icon: <EnvironmentOutlined />,
            label: 'Areas & Tax (SST)',
            permission: 'settings:edit',
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined />,
            label: 'General Configuration',
            permission: 'settings:view',
          },
        ],
      },
    ];

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
  }, [hasPermission, alertCount]);

  const getOpenKeys = () => {
    const keys = [];
    if (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories')) {
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
        selectedKeys={[pathname]}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ backgroundColor: '#000000' }}
        className="pt-4 pb-6 font-medium text-sm border-r-0"
      />
    </Sider>
  );
}