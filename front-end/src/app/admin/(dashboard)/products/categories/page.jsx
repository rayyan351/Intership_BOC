// src/app/admin/(dashboard)/categories/page.jsx
'use client';

import React, { useState } from 'react';
import { Tabs } from 'antd';
import { TagsOutlined, AppstoreAddOutlined, LayoutOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import MenuCategoriesView from './_components/menuCategoriesView';
import DealCategoriesView from './_components/dealCategoriesView';
import DisplaySectionsView from './_components/displaySectionsView';

export default function UnifiedCategoriesAndSectionsPage() {
  const { hasPermission } = usePermission();
  const [activeKey, setActiveKey] = useState('menu-categories');

  const items = [
    hasPermission('categories:view') && {
      key: 'menu-categories',
      label: (
        <span className="flex items-center gap-2 px-1 font-bold text-sm">
          <TagsOutlined />
          Menu Categories
        </span>
      ),
      children: <MenuCategoriesView />,
    },
    hasPermission('dealcategories:view') && {
      key: 'deal-categories',
      label: (
        <span className="flex items-center gap-2 px-1 font-bold text-sm">
          <AppstoreAddOutlined />
          Deal Categories
        </span>
      ),
      children: <DealCategoriesView />,
    },
    hasPermission('sections:view') && {
      key: 'display-sections',
      label: (
        <span className="flex items-center gap-2 px-1 font-bold text-sm">
          <LayoutOutlined />
          Display Sections
        </span>
      ),
      children: <DisplaySectionsView />,
    },
  ].filter(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wide">
          Categories & Display Sections
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
          Configure menu groupings, combo tags, and homepage storefront presentation.
        </p>
      </div>

      {/* Main Tabbed Container */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm">
        <Tabs
          activeKey={activeKey}
          onChange={setActiveKey}
          items={items}
          className="admin-custom-tabs"
        />
      </div>
    </div>
  );
}