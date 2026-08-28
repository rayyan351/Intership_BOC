// src/app/admin/_components/layout/AdminSidebar.jsx
'use client';

import React, { useMemo } from 'react';
import { Layout, Menu } from 'antd';
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

  const menuItems = useMemo(() => {
    const rawItems = [
      {
        key: '/admin/dashboard',
        icon: <DashboardOutlined style={{ fontSize: '15px' }} />,
        label: 'Dashboard',
        allowed: hasPermission('dashboard:view'),
      },
      {
        key: '/admin/orders',
        icon: <ShoppingOutlined style={{ fontSize: '15px' }} />,
        label: 'Live Orders Feed',
        allowed: hasPermission('orders:view'),
      },
      {
        key: 'products-submenu',
        icon: <AppstoreOutlined style={{ fontSize: '15px' }} />,
        label: 'Products & Menu',
        children: [
          {
            key: '/admin/products',
            icon: <FolderOpenOutlined style={{ fontSize: '14px' }} />,
            label: 'Menu Catalog',
            allowed: hasPermission('products:view') || hasPermission('deals:view'),
          },
          {
            key: '/admin/products/categories',
            icon: <TagsOutlined style={{ fontSize: '14px' }} />,
            label: 'Categories & Sections',
            allowed:
              hasPermission('categories:view') ||
              hasPermission('dealcategories:view') ||
              hasPermission('sections:view'),
          },
          {
            key: '/admin/recipes',
            icon: <ExperimentOutlined style={{ fontSize: '14px' }} />,
            label: 'Recipes & Prep',
            allowed: hasPermission('recipes:view'),
          },
        ],
      },
      {
        key: 'inventory-submenu',
        icon: <InboxOutlined style={{ fontSize: '15px' }} />,
        label: 'Inventory',
        children: [
          {
            key: '/admin/inventory',
            icon: <ReconciliationOutlined style={{ fontSize: '14px' }} />,
            label: 'Stock & Items',
            allowed: hasPermission('inventory:view'),
          },
          {
            key: '/admin/inventory/purchasing',
            icon: <DollarCircleOutlined style={{ fontSize: '14px' }} />,
            label: 'Purchasing & Vendors',
            allowed: hasPermission('purchase_orders:view'),
          },
          {
            key: '/admin/inventory/stocktake',
            icon: <AuditOutlined style={{ fontSize: '14px' }} />,
            label: 'Audit & Reconciliation',
            allowed: hasPermission('inventory:view'),
          },
        ],
      },
      {
        key: 'branch-operations',
        icon: <BankOutlined style={{ fontSize: '15px' }} />,
        label: 'Branch Operations',
        children: [
          {
            key: '/admin/branchoperations/locations',
            icon: <ShopOutlined style={{ fontSize: '14px' }} />,
            label: 'Store Outlets',
            allowed: hasPermission('locations:view'),
          },
          {
            key: '/admin/branchoperations/roles',
            icon: <SafetyCertificateOutlined style={{ fontSize: '14px' }} />,
            label: 'Roles & Matrix',
            allowed: hasPermission('roles:view'),
          },
          {
            key: '/admin/branchoperations/staff',
            icon: <TeamOutlined style={{ fontSize: '14px' }} />,
            label: 'Staff & Accounts',
            allowed: hasPermission('staff:view'),
          },
        ],
      },
      {
        key: 'settings-submenu',
        icon: <SettingOutlined style={{ fontSize: '15px' }} />,
        label: 'Store Settings',
        children: [
          {
            key: '/admin/settings/banners',
            icon: <PictureOutlined style={{ fontSize: '14px' }} />,
            label: 'Hero Banners',
            allowed: hasPermission('banners:view'),
          },
          {
            key: '/admin/settings/delivery-areas',
            icon: <EnvironmentOutlined style={{ fontSize: '14px' }} />,
            label: 'Areas & Tax (SST)',
            allowed: hasPermission('settings:edit'),
          },
          {
            key: '/admin/settings',
            icon: <SettingOutlined style={{ fontSize: '14px' }} />,
            label: 'General Configuration',
            allowed: hasPermission('settings:view'),
          },
        ],
      },
    ];

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
  }, [hasPermission]);

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
      width={260}
      theme="dark"
      style={{ backgroundColor: '#000000', minHeight: '100vh' }}
      className="shrink-0 select-none border-r border-neutral-900/80"
    >
      <style jsx global>{`
        /* Sidebar Menu Styles */
        .admin-sidebar-menu.ant-menu-dark .ant-menu-item,
        .admin-sidebar-menu.ant-menu-dark .ant-menu-submenu-title {
          border-radius: 12px !important;
          margin: 4px 0 !important;
          padding: 0 16px !important;
          height: 42px !important;
          line-height: 42px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          color: rgba(255, 255, 255, 0.7) !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.15s ease-in-out !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item:hover,
        .admin-sidebar-menu.ant-menu-dark .ant-menu-submenu-title:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item-selected {
          background-color: #F4C61A !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-item-selected .anticon {
          color: #000000 !important;
        }

        /* Submenus In-line */
        .admin-sidebar-menu.ant-menu-dark .ant-menu-sub {
          background-color: transparent !important;
          padding: 2px 0 2px 8px !important;
          margin: 4px 0 6px 14px !important;
          border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-sub .ant-menu-item {
          font-size: 12.5px !important;
          font-weight: 500 !important;
          height: 38px !important;
          line-height: 38px !important;
          padding-left: 14px !important;
          margin: 2px 0 !important;
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-sub .ant-menu-item:hover {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
        }

        .admin-sidebar-menu.ant-menu-dark .ant-menu-sub .ant-menu-item-selected {
          background-color: #F4C61A !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }

        /* Collapsed Sidebar Hover Popup Menu Styling */
        .ant-menu-submenu-popup .ant-menu-dark {
          background-color: #0a0a0a !important;
          border: 1px solid #262626 !important;
          border-radius: 14px !important;
          padding: 6px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
        }

        .ant-menu-submenu-popup .ant-menu-dark .ant-menu-item {
          border-radius: 10px !important;
          margin: 3px 0 !important;
          color: rgba(255, 255, 255, 0.75) !important;
          font-size: 12.5px !important;
          font-weight: 500 !important;
          height: 36px !important;
          line-height: 36px !important;
        }

        .ant-menu-submenu-popup .ant-menu-dark .ant-menu-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }

        .ant-menu-submenu-popup .ant-menu-dark .ant-menu-item-selected {
          background-color: #F4C61A !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }

        .ant-menu-submenu-popup .ant-menu-dark .ant-menu-item-selected .anticon {
          color: #000000 !important;
        }
      `}</style>

      <div className="py-4 px-3">
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[activeSelectedKey]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ backgroundColor: '#000000' }}
          className="admin-sidebar-menu border-r-0 font-['Plus_Jakarta_Sans',sans-serif]"
        />
      </div>
    </Sider>
  );
}