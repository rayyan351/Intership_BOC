// src/app/admin/(dashboard)/inventory/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Dropdown, Popconfirm, Select } from 'antd';
import {
  AlertOutlined,
  DollarCircleOutlined,
  InboxOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SwapOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import InventoryItemModal from './_components/InventoryItemModal';
import StockAdjustmentModal from './_components/StockAdjustModal';
import {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustStockMutation,
  useGetSuppliersQuery,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const CATEGORIES = [
  'Meat',
  'Dairy',
  'Bakery',
  'Produce',
  'Sauces & Condiments',
  'Packaging',
  'Beverages',
  'Other',
];

export default function StockAndItemsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LOW_STOCK'

  // Modal States
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustModalItem, setAdjustModalItem] = useState(null);

  // Queries
  const { data: inventoryData, isLoading } = useGetInventoryItemsQuery({
    category: selectedCategory || undefined,
    branchId: selectedBranch || undefined,
    lowStockOnly: activeTab === 'LOW_STOCK' ? 'true' : undefined,
    search: searchTerm || undefined,
  });

  const { data: branches = [] } = useGetBranchesQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();

  // Mutations
  const [createItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const [deleteItem] = useDeleteInventoryItemMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

  const metrics = inventoryData?.metrics || {
    totalItemsCount: 0,
    totalValuation: 0,
    lowStockItemsCount: 0,
    outOfStockCount: 0,
  };

  const itemsList = inventoryData?.items || [];

  // Item Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (formData) => {
    try {
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...formData }).unwrap();
        showSuccess(`Item "${formData.name}" updated successfully.`);
      } else {
        await createItem(formData).unwrap();
        showSuccess(`Item "${formData.name}" registered into inventory.`);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save inventory item');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteItem(id).unwrap();
      showSuccess('Item removed from active inventory.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete item.');
    }
  };

  // Stock Adjustment Handler
  const handleExecuteAdjustment = async (adjustPayload) => {
    try {
      await adjustStock({
        id: adjustPayload.itemId,
        branchId: adjustPayload.branchId,
        type: adjustPayload.type,
        quantityChanged: adjustPayload.quantityChanged,
        notes: adjustPayload.notes,
      }).unwrap();

      showSuccess(
        adjustPayload.type === 'SPOILAGE_WASTE'
          ? 'Wastage written off successfully.'
          : 'Stock count reconciled.'
      );
      setAdjustModalItem(null);
    } catch (err) {
      showError(err?.data?.message || 'Stock adjustment failed.');
    }
  };

  const columns = [
    {
      title: 'Item Details',
      dataIndex: 'name',
      key: 'name',
      width: '26%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[11px] text-neutral-400 font-mono">SKU: {r.sku}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '14%',
      render: (cat) => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {cat}
        </span>
      ),
    },
    {
      title: 'Stock Health & Levels',
      key: 'stock',
      width: '24%',
      render: (_, r) => {
        const isOutOfStock = r.totalStock === 0;
        const isLowStock = r.totalStock <= r.totalReorderThreshold;

        return (
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-xs text-neutral-900 font-mono">
                {r.totalStock.toLocaleString()} {r.recipeUnit}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : isLowStock
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock' : 'Healthy'}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono block">
              Min Par: {r.totalReorderThreshold.toLocaleString()} {r.recipeUnit}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Valuation & Unit Cost',
      key: 'valuation',
      width: '22%',
      render: (_, r) => (
        <div>
          <span className="text-xs font-semibold text-neutral-900 block font-mono">
            {formatPrice(r.itemValuation)}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono block">
            {formatPrice(r.costPerPurchaseUnit)}/{r.purchaseUnit} (Rs. {Number(r.costPerRecipeUnit || 0).toFixed(4).replace(/\.?0+$/, '')}/{r.recipeUnit})
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      width: '14%',
      align: 'right',
      render: (_, r) => {
        const actionMenuItems = [
          {
            key: 'edit',
            label: <span className="text-xs font-medium">Edit Item Details</span>,
            icon: <EditOutlined className="text-xs" />,
            onClick: () => handleOpenEditModal(r),
          },
          {
            key: 'adjust',
            label: <span className="text-xs font-medium">Adjust / Reconcile Stock</span>,
            icon: <SwapOutlined className="text-xs" />,
            onClick: () => setAdjustModalItem(r),
          },
        ];

        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenEditModal(r)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
            >
              Edit
            </button>

            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <button className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition cursor-pointer">
                <MoreOutlined className="text-sm" />
              </button>
            </Dropdown>

            <Popconfirm
              title={<span className="font-bold text-xs text-neutral-900">Delete Raw Material?</span>}
              description={<span className="text-[11px] text-neutral-500 max-w-[200px] block">Soft-deleting retains historical order ledger integrity.</span>}
              onConfirm={() => handleDeleteItem(r._id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, size: 'small', className: '!text-xs !font-bold !rounded-lg' }}
              cancelButtonProps={{ size: 'small', className: '!text-xs !rounded-lg' }}
            >
              <button className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer">
                <DeleteOutlined className="text-xs" />
              </button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Raw Materials & Kitchen Stock"
        subTitle="Live ingredient inventory, par level tracking, and valuation across branch outlets"
        onAdd={handleOpenCreateModal}
        addText="Register Ingredient"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search ingredients by name or SKU..."
      >
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base">
                <DollarCircleOutlined />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500 block tracking-tight">
                  Inventory Valuation
                </span>
                <span className="text-xl font-extrabold text-neutral-900 font-mono leading-none mt-1 block">
                  {formatPrice(metrics.totalValuation)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base">
                <InboxOutlined />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500 block tracking-tight">
                  Active Raw Ingredients
                </span>
                <span className="text-xl font-extrabold text-neutral-900 leading-none mt-1 block font-mono">
                  {metrics.totalItemsCount} items
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-mono">
              {metrics.totalItemsCount}
            </span>
          </div>

          <div
            onClick={() => setActiveTab(activeTab === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
              activeTab === 'LOW_STOCK'
                ? 'border-rose-400 bg-rose-50/30 shadow-xs ring-1 ring-rose-400/20'
                : 'border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold text-base">
                <AlertOutlined />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500 block tracking-tight">
                  Attention Needed
                </span>
                <span className="text-xl font-extrabold text-rose-600 leading-none mt-1 block font-mono">
                  {metrics.lowStockItemsCount + metrics.outOfStockCount} items
                </span>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono ${
                activeTab === 'LOW_STOCK'
                  ? 'bg-rose-500 text-white'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {metrics.lowStockItemsCount + metrics.outOfStockCount}
            </span>
          </div>
        </div>

        {/* Filters and Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 pb-3 border-b border-neutral-100">
          <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Items ({metrics.totalItemsCount})
            </button>
            <button
              onClick={() => setActiveTab('LOW_STOCK')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'LOW_STOCK'
                  ? 'bg-white text-rose-600 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <WarningOutlined className="text-rose-500 text-xs" />
              <span>Low & Out of Stock ({metrics.lowStockItemsCount + metrics.outOfStockCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Select
              className="w-40 h-9 staff-modern-select"
              placeholder="All Categories"
              allowClear
              value={selectedCategory || undefined}
              onChange={(val) => setSelectedCategory(val || '')}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <Select
              className="w-44 h-9 staff-modern-select"
              placeholder="All Outlets"
              allowClear
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden">
          <Table
            columns={columns}
            dataSource={itemsList}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 9,
              showTotal: (total, range) => (
                <span className="text-xs text-neutral-400 font-normal">
                  Showing {range[0]}-{range[1]} of {total} ingredients
                </span>
              ),
            }}
            size="middle"
          />
        </div>

        {/* Add / Edit Ingredient Modal */}
        <InventoryItemModal
          open={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setEditingItem(null);
          }}
          initialValues={editingItem}
          suppliers={suppliers}
          onSubmit={handleSaveItem}
          loading={isCreating || isUpdating}
        />

        {/* Quick Stock Adjustment & Wastage Modal */}
        {adjustModalItem && (
          <StockAdjustmentModal
            open={Boolean(adjustModalItem)}
            onClose={() => setAdjustModalItem(null)}
            item={adjustModalItem}
            branches={branches}
            onAdjust={handleExecuteAdjustment}
            loading={isAdjusting}
          />
        )}
      </PageLayout>
    </>
  );
}