'use client';

import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  TagsOutlined,
  GiftOutlined,
  LayoutOutlined,
  PictureOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';

const { Sider } = Layout;

export default function AdminSidebar({ collapsed, setCollapsed }) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingOutlined />,
      label: 'Orders',
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
        },
        {
          key: '/admin/products/dealcategories',
          icon: <TagsOutlined />,
          label: 'Deal Categories',
        },
        {
          key: '/admin/products/sections',
          icon: <LayoutOutlined />,
          label: 'Display Sections',
        },
        {
          key: '/admin/products/allproducts',
          icon: <UnorderedListOutlined />,
          label: 'All Products',
        },
        {
          key: '/admin/products/deals',
          icon: <GiftOutlined />,
          label: 'Deals & Bundles',
        },
      ],
    },
    {
      key: '/admin/banners',
      icon: <PictureOutlined />,
      label: 'Hero Banners',
    },
    {
      key: '/admin/users',
      icon: <UsergroupAddOutlined />,
      label: 'Users',
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const isProductRoute =
    pathname.startsWith('/admin/products') || pathname.startsWith('/admin/categories');

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
        /* Match Ant Design's exact dark-theme muted navlink color */
        .ant-menu-dark .ant-menu-submenu-title {
          color: rgba(255, 255, 255, 0.65) !important;
        }
        /* Hover state matches standard links */
        .ant-menu-dark .ant-menu-submenu-title:hover {
          color: #ffffff !important;
        }
        /* Active selected child item retains signature yellow */
        .ant-menu-dark .ant-menu-item-selected {
          background-color: #ffc400 !important;
          color: #000000 !important;
          font-weight: 700 !important;
        }
        /* Nested submenu container stays pure black */
        .ant-menu-sub {
          background: #000000 !important;
        }
      `}</style>

      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[pathname]}
        defaultOpenKeys={isProductRoute ? ['products-submenu'] : []}
        items={menuItems}
        onClick={({ key }) => {
          if (key !== 'products-submenu') {
            router.push(key);
          }
        }}
        style={{ backgroundColor: '#000000' }}
        className="py-4 font-medium text-sm sticky top-16"
      />
    </Sider>
  );
}