// src/app/admin/(dashboard)/products/page.jsx
'use client';

import React, { useState } from 'react';
import { AppstoreOutlined, FireOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PageLayout from '@/app/admin/_components/layout/PageLayout';

import AllProductsView from './_components/allProductsView';
import DealsBundlesView from './_components/dealsBundlesView';

export default function ProductsPage() {
  const { hasPermission } = usePermission();

  const canViewProducts = hasPermission('products:view');
  const canViewDeals = hasPermission('deals:view');
  const canAddProduct = hasPermission('products:create');
  const canAddDeal = hasPermission('deals:create');

  const defaultKey = canViewProducts ? 'standard-items' : 'deals-bundles';

  const [activeTab, setActiveTab] = useState(defaultKey);
  const [searchTerm, setSearchTerm] = useState('');
  const [createTrigger, setCreateTrigger] = useState(null);

  const getAddConfig = () => {
    if (activeTab === 'standard-items' && canAddProduct) {
      return {
        text: 'Add Product',
        placeholder: 'Search items or categories...',
        onAdd: () => setCreateTrigger(`product-${Date.now()}`),
      };
    }
    if (activeTab === 'deals-bundles' && canAddDeal) {
      return {
        text: 'Create Deal',
        placeholder: 'Search deals & bundles...',
        onAdd: () => setCreateTrigger(`deal-${Date.now()}`),
      };
    }
    return {
      text: null,
      placeholder: 'Search catalog...',
      onAdd: null,
    };
  };

  const addConfig = getAddConfig();

  return (
    <PageLayout
      title="Menu Products & Deals"
      subTitle="Manage standalone food items, combo bundles, and live storefront stock availability"
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      searchPlaceholder={addConfig.placeholder}
      onAdd={addConfig.onAdd}
      addText={addConfig.text}
    >
      <div className="space-y-7 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Custom Modern Pill Tabs */}
        <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
          {canViewProducts && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('standard-items');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'standard-items'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <AppstoreOutlined className={activeTab === 'standard-items' ? 'text-amber-500' : ''} />
              <span>Standard Menu Items</span>
            </button>
          )}

          {canViewDeals && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('deals-bundles');
                setSearchTerm('');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'deals-bundles'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <FireOutlined className={activeTab === 'deals-bundles' ? 'text-amber-500' : ''} />
              <span>Deals & Bundles</span>
            </button>
          )}
        </div>

        {/* Tab Viewports */}
        <div className="overflow-hidden">
          {activeTab === 'standard-items' && canViewProducts && (
            <AllProductsView
              searchTerm={searchTerm}
              createTrigger={createTrigger}
            />
          )}
          {activeTab === 'deals-bundles' && canViewDeals && (
            <DealsBundlesView
              searchTerm={searchTerm}
              createTrigger={createTrigger}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}