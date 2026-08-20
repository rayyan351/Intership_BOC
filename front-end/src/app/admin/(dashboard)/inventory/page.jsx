// front-end/src/app/admin/(dashboard)/inventory/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Tabs } from 'antd';
import {
  EditOutlined,
  SwapOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import InventoryItemModal from './_components/InventoryItemModal';
import StockAdjustModal from './_components/StockAdjustModal';
import { useToast } from '@/utils/toast';

import {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  useGetSuppliersQuery,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function InventoryPage() {
  const { contextHolder, showSuccess, showError } = useToast();

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('inventory:create');
  const canEdit = hasPermission('inventory:edit');
  const canAdjust = hasPermission('inventory:adjust') || hasPermission('inventory:edit');

  const [activeBranchTab, setActiveBranchTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);

  // RTK Query endpoints
  const { data: items = [], isLoading } = useGetInventoryItemsQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();

  const [createItem, { isLoading: isCreating }] = useCreateInventoryItemMutation();
  const [updateItem, { isLoading: isUpdating }] = useUpdateInventoryItemMutation();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustStockMutation();

  const handleSaveItem = async (formData) => {
    try {
      if (selectedItem) {
        await updateItem({ id: selectedItem._id, ...formData }).unwrap();
        showSuccess('Inventory item updated successfully');
      } else {
        await createItem(formData).unwrap();
        showSuccess('Raw material registered successfully');
      }
      setIsItemModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save inventory item');
    }
  };

  const handleStockAdjustment = async ({ itemId, branchId, type, quantityChanged, notes }) => {
    try {
      await adjustStock({
        id: itemId,
        branchId,
        type,
        quantityChanged,
        notes,
      }).unwrap();
      showSuccess('Stock adjustment logged to audit ledger');
      setIsAdjustModalOpen(false);
      setAdjustingItem(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to adjust stock');
    }
  };

  // Helper for computing stock count according to active branch filter tab
  const getBranchStockInfo = (record) => {
    if (activeBranchTab === 'ALL') {
      const totalStock = record.branchStocks?.reduce((acc, bs) => acc + (bs.currentStock || 0), 0) || 0;
      const anyLowStock = record.branchStocks?.some((bs) => bs.currentStock <= bs.reorderLevel);
      return { totalStock, isLow: anyLowStock };
    }

    const currentBranchStock = record.branchStocks?.find(
      (bs) => (bs.branch?._id || bs.branch) === activeBranchTab
    );
    const stock = currentBranchStock?.currentStock || 0;
    const isLow = stock <= (currentBranchStock?.reorderLevel || 500);
    return { totalStock: stock, isLow };
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.sku?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: 'Item / SKU',
      key: 'item',
      width: '28%',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-900 text-sm">{record.name}</span>
            <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
              {record.sku}
            </span>
          </div>
          <span className="text-xs text-neutral-400 block mt-0.5">
            Category: <strong className="text-neutral-600">{record.category}</strong>
          </span>
        </div>
      ),
    },
    {
      title: 'Packaging & Units',
      key: 'units',
      width: '22%',
      render: (_, record) => (
        <div className="text-xs">
          <span className="text-neutral-800 font-semibold block">
            1 {record.purchaseUnit} = {record.conversionFactor} {record.recipeUnit}
          </span>
          <span className="text-[11px] text-neutral-400">
            Supplier: {record.primarySupplier?.name || 'Unassigned'}
          </span>
        </div>
      ),
    },
    {
      title: 'Unit Cost',
      key: 'cost',
      width: '18%',
      render: (_, record) => (
        <div>
          <span className="text-xs font-bold text-neutral-900 font-mono block">
            Rs. {record.costPerPurchaseUnit} <span className="text-[10px] font-normal text-neutral-400">/ {record.purchaseUnit}</span>
          </span>
          <span className="text-[11px] font-semibold text-amber-700 font-mono">
            Rs. {record.costPerRecipeUnit} / {record.recipeUnit}
          </span>
        </div>
      ),
    },
    {
      title: 'Current Balance',
      key: 'stock',
      width: '18%',
      render: (_, record) => {
        const { totalStock, isLow } = getBranchStockInfo(record);

        return (
          <div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-sm text-neutral-900">
              {totalStock.toLocaleString()} {record.recipeUnit}
            </div>
            {isLow ? (
              <Tag color="error" className="m-0 text-[10px] font-bold mt-1 border-none flex items-center gap-1 w-fit">
                <WarningOutlined /> LOW STOCK
              </Tag>
            ) : (
              <Tag color="success" className="m-0 text-[10px] font-bold mt-1 border-none flex items-center gap-1 w-fit">
                <CheckCircleOutlined /> HEALTHY
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '14%',
      render: (_, record) => (
        <Space size="small">
          {canAdjust && (
            <Button
              size="small"
              icon={<SwapOutlined />}
              onClick={() => {
                setAdjustingItem(record);
                setIsAdjustModalOpen(true);
              }}
              className="!text-xs font-semibold"
            >
              Adjust
            </Button>
          )}
          {canEdit && (
            <Button
              size="small"
              type="text"
              icon={<EditOutlined className="text-gray-600" />}
              onClick={() => {
                setSelectedItem(record);
                setIsItemModalOpen(true);
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  const branchTabItems = [
    { key: 'ALL', label: 'All Outlets (Consolidated)' },
    ...branches.map((b) => ({ key: b._id, label: `${b.name} (${b.city})` })),
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Raw Inventory & Ingredients"
        subTitle="Manage raw materials, supplier unit conversion factors, recipe costing, and stock levels"
        onAdd={
          canAdd
            ? () => {
                setSelectedItem(null);
                setIsItemModalOpen(true);
              }
            : null
        }
        addText="Register Ingredient"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search material by name, SKU, or category..."
      >
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Tabs
            activeKey={activeBranchTab}
            onChange={setActiveBranchTab}
            items={branchTabItems}
            className="mb-2"
          />

          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>

        <InventoryItemModal
          open={isItemModalOpen}
          onClose={() => {
            setIsItemModalOpen(false);
            setSelectedItem(null);
          }}
          initialValues={selectedItem}
          suppliers={suppliers}
          onSubmit={handleSaveItem}
          loading={isCreating || isUpdating}
        />

        <StockAdjustModal
          open={isAdjustModalOpen}
          onClose={() => {
            setIsAdjustModalOpen(false);
            setAdjustingItem(null);
          }}
          item={adjustingItem}
          branches={branches}
          onSubmit={handleStockAdjustment}
          loading={isAdjusting}
        />
      </PageLayout>
    </>
  );
}