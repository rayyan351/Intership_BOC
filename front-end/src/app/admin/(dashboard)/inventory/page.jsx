// src/app/admin/(dashboard)/inventory/page.jsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Drawer,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Popconfirm,
  Dropdown,
  Radio,
} from 'antd';
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

const PURCHASE_UNITS = ['kg', 'liter', 'piece', 'box', 'carton', 'pack', 'tray'];
const RECIPE_UNITS = ['g', 'ml', 'piece'];

export default function StockAndItemsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LOW_STOCK'

  // Modal / Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustType, setAdjustType] = useState('AUDIT'); // 'AUDIT' | 'WASTAGE'

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = useState({
    branchId: '',
    quantity: 0,
    reason: '',
  });

  // Queries (All from unified inventoryApi)
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

  // Drawer Form State
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    category: 'Meat',
    purchaseUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    costPerPurchaseUnit: 0,
    primarySupplier: '',
    initialStocks: [],
  });

  const metrics = inventoryData?.metrics || {
    totalItemsCount: 0,
    totalValuation: 0,
    lowStockItemsCount: 0,
    outOfStockCount: 0,
  };

  const itemsList = inventoryData?.items || [];

  // Drawer Handlers
  const handleOpenCreateDrawer = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      sku: '',
      category: 'Meat',
      purchaseUnit: 'kg',
      recipeUnit: 'g',
      conversionFactor: 1000,
      costPerPurchaseUnit: 0,
      primarySupplier: suppliers[0]?._id || '',
      initialStocks: branches.map((b) => ({
        branchId: b._id,
        initialStock: 0,
        reorderLevel: 500,
        idealStock: 5000,
      })),
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      purchaseUnit: item.purchaseUnit,
      recipeUnit: item.recipeUnit,
      conversionFactor: item.conversionFactor,
      costPerPurchaseUnit: item.costPerPurchaseUnit,
      primarySupplier: item.primarySupplier?._id || item.primarySupplier || '',
      initialStocks: item.branchStocks || [],
    });
    setIsDrawerOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem({ id: editingItem._id, ...itemForm }).unwrap();
        showSuccess(`Item "${itemForm.name}" updated successfully.`);
      } else {
        await createItem(itemForm).unwrap();
        showSuccess(`Item "${itemForm.name}" registered into inventory.`);
      }
      setIsDrawerOpen(false);
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

  // Stock Adjustment Handlers
  const handleOpenAdjustModal = (item, type) => {
    setAdjustModalItem(item);
    setAdjustType(type);
    setAdjustForm({
      branchId: selectedBranch || branches[0]?._id || '',
      quantity: 0,
      reason: '',
    });
  };

  const handleExecuteAdjustment = async () => {
    if (!adjustForm.branchId || adjustForm.quantity === 0) {
      return showError('Please select a branch and enter a valid quantity difference.');
    }

    try {
      const type = adjustType === 'WASTAGE' ? 'SPOILAGE_WASTE' : 'PHYSICAL_AUDIT_ADJUSTMENT';
      const quantityChanged = adjustType === 'WASTAGE' ? -Math.abs(adjustForm.quantity) : adjustForm.quantity;

      await adjustStock({
        id: adjustModalItem._id,
        branchId: adjustForm.branchId,
        type,
        quantityChanged,
        notes: adjustForm.reason || (adjustType === 'WASTAGE' ? 'Kitchen Spoilage' : 'Manual stock adjustment'),
      }).unwrap();

      showSuccess(adjustType === 'WASTAGE' ? 'Wastage written off successfully.' : 'Stock count reconciled.');
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
      width: '24%',
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">SKU: {r.sku}</span>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '14%',
      render: (cat) => (
        <Tag className="font-bold text-[10px] border-none bg-neutral-100 text-neutral-800">
          {cat}
        </Tag>
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
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-bold text-neutral-900">
                {r.totalStock.toLocaleString()} {r.recipeUnit}
              </span>
              <Tag
                color={isOutOfStock ? 'red' : isLowStock ? 'gold' : 'green'}
                className="text-[9px] font-extrabold border-none m-0"
              >
                {isOutOfStock ? 'OUT OF STOCK' : isLowStock ? 'LOW STOCK' : 'HEALTHY'}
              </Tag>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono block">
              Min Par: {r.totalReorderThreshold.toLocaleString()} {r.recipeUnit}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Unit Cost & Valuation',
      key: 'valuation',
      width: '20%',
      render: (_, r) => (
        <div>
          <span className="text-xs font-mono font-bold text-neutral-900 block">
            {formatPrice(r.itemValuation)}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono block">
            {formatPrice(r.costPerPurchaseUnit)} / {r.purchaseUnit} (Rs. {Number(r.costPerRecipeUnit || 0).toFixed(4).replace(/\.?0+$/, '')}/{r.recipeUnit})
          </span>
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '8%',
      align: 'right',
      render: (_, r) => {
        const actionMenuItems = [
          {
            key: 'edit',
            label: 'Edit Item Info',
            icon: <EditOutlined />,
            onClick: () => handleOpenEditDrawer(r),
          },
          {
            key: 'adjust',
            label: 'Adjust Stock Count',
            icon: <SwapOutlined />,
            onClick: () => handleOpenAdjustModal(r, 'AUDIT'),
          },
          {
            key: 'waste',
            label: 'Record Spoilage / Wastage',
            icon: <WarningOutlined className="text-rose-500" />,
            onClick: () => handleOpenAdjustModal(r, 'WASTAGE'),
          },
        ];

        return (
          <div className="flex items-center justify-end gap-1">
            <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
              <Button size="small" type="text" icon={<MoreOutlined className="text-base" />} />
            </Dropdown>
            <Popconfirm
              title="Delete raw material?"
              description="Soft-deleting retains historical order ledger integrity."
              onConfirm={() => handleDeleteItem(r._id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true, size: 'small' }}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
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
        onAdd={handleOpenCreateDrawer}
        addText="Register Ingredient"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search ingredients by name or SKU..."
      >
        {/* Top Metric Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={8}>
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
                <DollarCircleOutlined />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Total Inventory Valuation
                </span>
                <strong className="text-lg font-black text-neutral-900 font-mono">
                  {formatPrice(metrics.totalValuation)}
                </strong>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={8}>
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-xl">
                <InboxOutlined />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Total Active Ingredients
                </span>
                <strong className="text-lg font-black text-neutral-900 font-mono">
                  {metrics.totalItemsCount} items
                </strong>
              </div>
            </div>
          </Col>

          <Col xs={24} sm={8}>
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl">
                <AlertOutlined />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Low / Out of Stock Items
                </span>
                <strong className="text-lg font-black text-rose-600 font-mono">
                  {metrics.lowStockItemsCount + metrics.outOfStockCount} items
                </strong>
              </div>
            </div>
          </Col>
        </Row>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 pb-3 border-b border-neutral-100">
          <Radio.Group
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="ALL">All Items ({metrics.totalItemsCount})</Radio.Button>
            <Radio.Button value="LOW_STOCK">
              ⚠️ Attention Needed ({metrics.lowStockItemsCount + metrics.outOfStockCount})
            </Radio.Button>
          </Radio.Group>

          <div className="flex items-center gap-2">
            <Select
              className="w-40 text-xs"
              size="small"
              placeholder="Filter Category"
              allowClear
              value={selectedCategory || undefined}
              onChange={(val) => setSelectedCategory(val || '')}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <Select
              className="w-44 text-xs"
              size="small"
              placeholder="Filter Branch Outlet"
              allowClear
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>
        </div>

        {/* Unified Table */}
        <Table
          columns={columns}
          dataSource={itemsList}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 9 }}
          size="middle"
        />

        {/* Drawer: Add / Edit Ingredient */}
        <Drawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          size={480}
          title={editingItem ? `Edit ${editingItem.name}` : 'Register New Raw Ingredient'}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Item Name *
              </label>
              <Input
                required
                placeholder="e.g. Premium Beef Patty 150g"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  SKU Code *
                </label>
                <Input
                  required
                  placeholder="e.g. PATTY-BEEF-150"
                  value={itemForm.sku}
                  onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value.toUpperCase() })}
                  className="h-10 rounded-xl uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <Select
                  className="w-full h-10"
                  value={itemForm.category}
                  onChange={(val) => setItemForm({ ...itemForm, category: val })}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                />
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-xs font-black text-neutral-900 uppercase tracking-wider block">
                Unit & Purchasing Configuration
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Purchase Unit</label>
                  <Select
                    className="w-full"
                    value={itemForm.purchaseUnit}
                    onChange={(val) => setItemForm({ ...itemForm, purchaseUnit: val })}
                    options={PURCHASE_UNITS.map((u) => ({ value: u, label: u }))}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Kitchen Recipe Unit</label>
                  <Select
                    className="w-full"
                    value={itemForm.recipeUnit}
                    onChange={(val) => setItemForm({ ...itemForm, recipeUnit: val })}
                    options={RECIPE_UNITS.map((u) => ({ value: u, label: u }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Conversion Factor</label>
                  <InputNumber
                    className="w-full"
                    min={1}
                    value={itemForm.conversionFactor}
                    onChange={(val) => setItemForm({ ...itemForm, conversionFactor: val || 1000 })}
                  />
                  <span className="text-[10px] text-neutral-400">1 {itemForm.purchaseUnit} = {itemForm.conversionFactor} {itemForm.recipeUnit}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 mb-1">Cost / Purchase Unit (PKR)</label>
                  <InputNumber
                    className="w-full"
                    min={0}
                    value={itemForm.costPerPurchaseUnit}
                    onChange={(val) => setItemForm({ ...itemForm, costPerPurchaseUnit: val || 0 })}
                  />
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">
                    = Rs. {((itemForm.costPerPurchaseUnit || 0) / (itemForm.conversionFactor || 1)).toFixed(4).replace(/\.?0+$/, '')} / {itemForm.recipeUnit}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Primary Supplier
              </label>
              <Select
                className="w-full h-10"
                allowClear
                placeholder="Select Preferred Supplier"
                value={itemForm.primarySupplier || undefined}
                onChange={(val) => setItemForm({ ...itemForm, primarySupplier: val || null })}
                options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex gap-2 justify-end">
              <Button onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
                className="!bg-[#ffc400] !text-black font-bold border-none"
              >
                {editingItem ? 'Save Changes' : 'Register Ingredient'}
              </Button>
            </div>
          </form>
        </Drawer>

        {/* Modal: Quick Stock Adjustment & Spoilage Write-Off */}
        <Modal
          open={!!adjustModalItem}
          onCancel={() => setAdjustModalItem(null)}
          footer={null}
          title={null}
          centered
          width={420}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {adjustModalItem && (
            <div className="pt-2">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1">
                {adjustType === 'WASTAGE' ? 'Record Spoilage / Wastage' : 'Adjust Physical Stock Count'}
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                {adjustModalItem.name} ({adjustModalItem.sku})
              </p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Branch Kitchen Outlet *
                  </label>
                  <Select
                    className="w-full h-10"
                    value={adjustForm.branchId}
                    onChange={(val) => setAdjustForm({ ...adjustForm, branchId: val })}
                    options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    {adjustType === 'WASTAGE'
                      ? `Quantity Wasted (${adjustModalItem.recipeUnit}) *`
                      : `Difference Delta in ${adjustModalItem.recipeUnit} (+ or -) *`}
                  </label>
                  <InputNumber
                    className="w-full h-10 flex items-center"
                    value={adjustForm.quantity}
                    onChange={(val) => setAdjustForm({ ...adjustForm, quantity: val || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Reason / Audit Notes
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="e.g. Expired lot write-off, physical variance found during count"
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100">
                <Button onClick={() => setAdjustModalItem(null)}>Cancel</Button>
                <Button
                  type="primary"
                  danger={adjustType === 'WASTAGE'}
                  loading={isAdjusting}
                  onClick={handleExecuteAdjustment}
                  className={adjustType !== 'WASTAGE' ? '!bg-[#ffc400] !text-black font-bold border-none' : ''}
                >
                  Confirm & Update Ledger
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}