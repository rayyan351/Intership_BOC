// src/app/admin/(dashboard)/categories/page.jsx
'use client';

import React, { useState } from 'react';
import { TagsOutlined, AppstoreAddOutlined, LayoutOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PageLayout from '@/app/admin/_components/layout/PageLayout';

import MenuCategoriesView from './_components/menuCategoriesView';
import DealCategoriesView from './_components/dealCategoriesView';
import DisplaySectionsView from './_components/displaySectionsView';

export default function UnifiedCategoriesAndSectionsPage() {
  const { hasPermission } = usePermission();

  const canViewCategories = hasPermission('categories:view');
  const canViewDealCategories = hasPermission('dealcategories:view');
  const canViewSections = hasPermission('sections:view');

  const canAddCategories = hasPermission('categories:create');
  const canAddDealCategories = hasPermission('dealcategories:create');
  const canAddSections = hasPermission('sections:create');

  const defaultKey = canViewCategories
    ? 'menu-categories'
    : canViewDealCategories
    ? 'deal-categories'
    : 'display-sections';

  const [activeKey, setActiveKey] = useState(defaultKey);
  const [searchTerm, setSearchTerm] = useState('');
  const [openModalKey, setOpenModalKey] = useState(null);

  // Dynamic Add Button and Placeholder based on the current tab
  const getAddConfig = () => {
    if (activeKey === 'menu-categories' && canAddCategories) {
      return {
        text: 'Add Category',
        placeholder: 'Search standard categories...',
        onAdd: () => setOpenModalKey(`category-${Date.now()}`),
      };
    }
    if (activeKey === 'deal-categories' && canAddDealCategories) {
      return {
        text: 'Add Deal Category',
        placeholder: 'Search deal categories...',
        onAdd: () => setOpenModalKey(`deal-category-${Date.now()}`),
      };
    }
    if (activeKey === 'display-sections' && canAddSections) {
      return {
        text: 'Create Section',
        placeholder: 'Search display sections...',
        onAdd: () => setOpenModalKey(`section-${Date.now()}`),
      };
    }
    return {
      text: null,
      placeholder: 'Search categories or sections...',
      onAdd: null,
    };
  };

  const addConfig = getAddConfig();

  return (
    <PageLayout
      title="Categories & Display Sections"
      subTitle="Configure menu groupings, combo tags, and homepage storefront presentation."
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      searchPlaceholder={addConfig.placeholder}
      onAdd={addConfig.onAdd}
      addText={addConfig.text}
    >
      <div className="space-y-7 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Modern Custom Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
          {canViewCategories && (
            <button
              type="button"
              onClick={() => {
                setActiveKey('menu-categories');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeKey === 'menu-categories'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <TagsOutlined className={activeKey === 'menu-categories' ? 'text-amber-500' : ''} />
              <span>Menu Categories</span>
            </button>
          )}

          {canViewDealCategories && (
            <button
              type="button"
              onClick={() => {
                setActiveKey('deal-categories');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeKey === 'deal-categories'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <AppstoreAddOutlined className={activeKey === 'deal-categories' ? 'text-amber-500' : ''} />
              <span>Deal Categories</span>
            </button>
          )}

          {canViewSections && (
            <button
              type="button"
              onClick={() => {
                setActiveKey('display-sections');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeKey === 'display-sections'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <LayoutOutlined className={activeKey === 'display-sections' ? 'text-amber-500' : ''} />
              <span>Display Sections</span>
            </button>
          )}
        </div>

        {/* Tab Viewports */}
        <div className="overflow-hidden">
          {activeKey === 'menu-categories' && canViewCategories && (
            <MenuCategoriesView
              searchTerm={searchTerm}
              createTrigger={openModalKey}
            />
          )}
          {activeKey === 'deal-categories' && canViewDealCategories && (
            <DealCategoriesView
              searchTerm={searchTerm}
              createTrigger={openModalKey}
            />
          )}
          {activeKey === 'display-sections' && canViewSections && (
            <DisplaySectionsView
              searchTerm={searchTerm}
              createTrigger={openModalKey}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}