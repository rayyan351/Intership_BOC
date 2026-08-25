// src/app/admin/(dashboard)/products/page.jsx
'use client';

import React, { useState } from 'react';
import { Tabs } from 'antd';
import { UnorderedListOutlined, GiftOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import AllProductsView from './_components/allProductsView';
import DealsBundlesView from './_components/dealsBundlesView';

export default function MenuCatalogPage() {
  const { hasPermission } = usePermission();
  const [activeKey, setActiveKey] = useState('products');

  const items = [
    hasPermission('products:view') && {
      key: 'products',
      label: (
        <span className="flex items-center gap-2 px-1 font-bold text-sm">
          <UnorderedListOutlined />
          Standard Menu Items
        </span>
      ),
      children: <AllProductsView />,
    },
    hasPermission('deals:view') && {
      key: 'deals',
      label: (
        <span className="flex items-center gap-2 px-1 font-bold text-sm">
          <GiftOutlined />
          Deals & Bundles
        </span>
      ),
      children: <DealsBundlesView />,
    },
  ].filter(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wide">
          Menu Catalog
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-1">
          Manage standalone food items, combo bundles, and live storefront stock availability.
        </p>
      </div>

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