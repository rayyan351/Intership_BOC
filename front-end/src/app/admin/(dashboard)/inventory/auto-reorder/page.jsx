// front-end/src/app/admin/(dashboard)/inventory/auto-reorder/page.jsx
'use client';

import React, { useState } from 'react';
import { Card, Tag, Button, Select, Alert, Space, Collapse, InputNumber } from 'antd';
import {
  ThunderboltOutlined,
  WarningOutlined,
  ShopOutlined,
  CheckOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useToast } from '@/utils/toast';
import {
  useGetAutoReorderSuggestionsQuery,
  useGenerateAutoReorderPOMutation,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function AutoReorderPage() {
  const router = useRouter();
  const { contextHolder, showSuccess, showError } = useToast();
  const [selectedBranch, setSelectedBranch] = useState('');

  const { data: suggestions = [], isLoading, refetch } = useGetAutoReorderSuggestionsQuery({
    branchId: selectedBranch || undefined,
  });
  const { data: branches = [] } = useGetBranchesQuery();
  const [generatePO, { isLoading: isGenerating }] = useGenerateAutoReorderPOMutation();

  // Local state to allow managers to tweak quantities prior to 1-click PO generation
  const [orderPlans, setOrderPlans] = useState({});

  const handleQtyChange = (supplierKey, itemId, val) => {
    setOrderPlans((prev) => ({
      ...prev,
      [`${supplierKey}_${itemId}`]: Number(val) >= 1 ? Number(val) : 1,
    }));
  };

  const handleGenerateSinglePO = async (group) => {
    try {
      const supplierKey = `${group.supplierId}_${group.branchId}`;
      const payloadItems = group.items.map((i) => ({
        itemId: i.itemId,
        orderedQuantity:
          orderPlans[`${supplierKey}_${i.itemId}`] !== undefined
            ? orderPlans[`${supplierKey}_${i.itemId}`]
            : i.suggestedPurchaseUnits,
        unitPurchasePrice: i.costPerPurchaseUnit,
      }));

      await generatePO({
        supplierId: group.supplierId,
        branchId: group.branchId,
        items: payloadItems,
        paymentTerms: group.supplierTerms,
      }).unwrap();

      showSuccess(`Draft PO generated for ${group.supplierName} (${group.branchName})`);
      refetch();
    } catch (err) {
      showError(err?.data?.message || 'Failed to generate purchase order');
    }
  };

  const totalReplenishmentCost = suggestions.reduce(
    (sum, g) => sum + (g.estimatedTotalValuation || 0),
    0
  );
  const totalShortageItems = suggestions.reduce(
    (sum, g) => sum + (g.items?.length || 0),
    0
  );

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Automated Low-Stock Reorder Engine"
        subTitle="Analyze branch shortages below minimum threshold and draft 1-click supplier purchase orders"
      >
        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Suppliers to Order From
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-2xl text-neutral-900">
                {suggestions.length} Vendors
              </span>
              <ShopOutlined className="text-xl text-neutral-400" />
            </div>
          </Card>

          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Low-Stock & Depleted SKUs
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-2xl text-rose-600">
                {totalShortageItems} Ingredients
              </span>
              <WarningOutlined className="text-xl text-rose-500" />
            </div>
          </Card>

          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Estimated Inward Replenishment
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-2xl text-emerald-600">
                Rs. {totalReplenishmentCost.toLocaleString()}
              </span>
              <DollarOutlined className="text-xl text-emerald-500" />
            </div>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4 flex justify-between items-center">
          <div className="w-72">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Filter by Kitchen Outlet
            </label>
            <Select
              className="w-full"
              placeholder="All Kitchen Outlets"
              allowClear
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>

          <Button
            type="link"
            onClick={() => router.push('/admin/inventory/purchase-orders')}
            className="text-xs font-bold text-neutral-900 flex items-center gap-1"
          >
            View Active Purchase Orders <ArrowRightOutlined />
          </Button>
        </div>

        {/* Suggestions List */}
        {suggestions.length === 0 && !isLoading && (
          <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 shadow-sm">
            <CheckOutlined className="text-3xl text-emerald-500 mb-2" />
            <h4 className="text-sm font-bold text-neutral-900 m-0">All Inventory Levels Healthy</h4>
            <p className="text-xs text-neutral-500 mt-1">
              No branch items currently fall below their configured minimum reorder threshold.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {suggestions.map((group) => {
            const supplierKey = `${group.supplierId}_${group.branchId}`;
            const isUnassigned = group.supplierId === 'unassigned';

            return (
              <div
                key={supplierKey}
                className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
              >
                {/* Vendor Header */}
                <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-neutral-900 m-0">{group.supplierName}</h3>
                      <Tag color="blue" className="font-bold text-[10px] border-none">
                        Destination: {group.branchName} ({group.branchCity})
                      </Tag>
                    </div>
                    <span className="text-[11px] text-neutral-500 mt-0.5 block">
                      Terms: <strong>{group.supplierTerms}</strong> • Shortages: <strong>{group.items.length} items</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                        Estimated PO Value
                      </span>
                      <span className="font-mono font-bold text-sm text-neutral-900">
                        Rs. {group.estimatedTotalValuation.toLocaleString()}
                      </span>
                    </div>

                    <CustomButton
                      variant="primary"
                      onClick={() => handleGenerateSinglePO(group)}
                      loading={isGenerating}
                      disabled={isUnassigned}
                      className="!text-xs font-bold flex items-center gap-1.5 !bg-neutral-900 hover:!bg-neutral-800"
                    >
                      <ThunderboltOutlined /> Generate Draft PO
                    </CustomButton>
                  </div>
                </div>

                {isUnassigned && (
                  <Alert
                    message="Unassigned Supplier Warning"
                    description="These ingredients do not have a primary supplier linked in their master record. Please edit the inventory items and assign a vendor to generate POs."
                    type="warning"
                    showIcon
                    className="m-3 text-xs"
                  />
                )}

                {/* Line Items Table */}
                <div className="p-3">
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const inputKey = `${supplierKey}_${item.itemId}`;
                      const currentOrderUnits =
                        orderPlans[inputKey] !== undefined
                          ? orderPlans[inputKey]
                          : item.suggestedPurchaseUnits;

                      return (
                        <div
                          key={item.itemId}
                          className="p-3 bg-white rounded-lg border border-neutral-100 flex flex-wrap justify-between items-center gap-3 text-xs hover:border-neutral-300 transition-colors"
                        >
                          <div className="w-64">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-900">{item.name}</span>
                              <Tag
                                color={item.urgency === 'OUT_OF_STOCK' ? 'red' : 'gold'}
                                className="font-bold text-[9px] border-none"
                              >
                                {item.urgency === 'OUT_OF_STOCK' ? 'DEPLETED (0)' : 'LOW STOCK'}
                              </Tag>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
                              SKU: {item.sku} • Stock: {item.currentStock} / Min: {item.reorderLevel} {item.recipeUnit}
                            </span>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-[10px] text-neutral-400 font-sans block">Deficit to Ideal</span>
                            <strong className="text-neutral-700">
                              {item.idealStock - item.currentStock} {item.recipeUnit}
                            </strong>
                          </div>

                          <div className="flex items-center gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                                Order Qty ({item.purchaseUnit})
                              </span>
                              <InputNumber
                                min={1}
                                step={1}
                                value={currentOrderUnits}
                                onChange={(val) => handleQtyChange(supplierKey, item.itemId, val)}
                                className="w-24 font-mono font-bold text-xs"
                              />
                            </div>

                            <div className="w-28 text-right font-mono">
                              <span className="text-[10px] text-neutral-400 font-sans block">Line Subtotal</span>
                              <strong className="text-neutral-900">
                                Rs. {(currentOrderUnits * item.costPerPurchaseUnit).toLocaleString()}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageLayout>
    </>
  );
}