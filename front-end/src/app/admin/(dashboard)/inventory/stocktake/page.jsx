// src/app/admin/(dashboard)/inventory/stocktake/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  InputNumber,
  Select,
  Row,
  Col,
  Tabs,
  Input,
  Modal,
} from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  DollarCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import {
  useGetInventoryItemsQuery,
  useGetStocktakesQuery,
  useSubmitStocktakeMutation,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

export default function StocktakePage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('COUNT_SHEET'); // 'COUNT_SHEET' | 'HISTORY'
  const [selectedBranch, setSelectedBranch] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditCounts, setAuditCounts] = useState({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState({});
  const [selectedAuditHistory, setSelectedAuditHistory] = useState(null);

  // Queries
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: inventoryData, isLoading: loadingInventory } = useGetInventoryItemsQuery({
    branchId: selectedBranch || undefined,
  });
  const { data: stocktakes = [], isLoading: loadingHistory } = useGetStocktakesQuery({
    branchId: selectedBranch || undefined,
  });

  const [submitStocktake, { isLoading: isSubmitting }] = useSubmitStocktakeMutation();

  const rawItems = inventoryData?.items || [];

  // Default to first active branch
  useEffect(() => {
    if (branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0]._id);
    }
  }, [branches, selectedBranch]);

  // Sync physical count input fields to expected system stock
  useEffect(() => {
    if (rawItems.length > 0) {
      const initialMap = {};
      const reasonMap = {};
      rawItems.forEach((item) => {
        const bStock = item.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        initialMap[item._id] = bStock ? bStock.currentStock : item.totalStock || 0;
        reasonMap[item._id] = 'Physical count variance';
      });
      setAuditCounts(initialMap);
      setDiscrepancyReasons(reasonMap);
    }
  }, [rawItems, selectedBranch]);

  const handlePhysicalCountChange = (itemId, val) => {
    setAuditCounts((prev) => ({
      ...prev,
      [itemId]: val !== null && val !== undefined ? Number(val) : 0,
    }));
  };

  const handleReasonChange = (itemId, val) => {
    setDiscrepancyReasons((prev) => ({
      ...prev,
      [itemId]: val,
    }));
  };

  const calculateNetVarianceCost = () => {
    return rawItems.reduce((acc, item) => {
      const bStock = item.branchStocks?.find(
        (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
      );
      const systemStock = bStock ? bStock.currentStock : item.totalStock || 0;
      const physical = auditCounts[item._id] !== undefined ? auditCounts[item._id] : systemStock;
      const variance = physical - systemStock;
      const cost = variance * (item.costPerRecipeUnit || 0);
      return acc + cost;
    }, 0);
  };

  const handleSubmitAudit = async () => {
    if (!selectedBranch) {
      return showError('Please select a branch outlet.');
    }

    const countsPayload = rawItems.map((item) => {
      const bStock = item.branchStocks?.find(
        (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
      );
      const systemStock = bStock ? bStock.currentStock : item.totalStock || 0;
      return {
        itemId: item._id,
        physicalCount: auditCounts[item._id] !== undefined ? auditCounts[item._id] : systemStock,
        discrepancyReason: discrepancyReasons[item._id] || 'Physical Audit Adjustment',
      };
    });

    try {
      await submitStocktake({
        branch: selectedBranch,
        counts: countsPayload,
        auditNotes,
      }).unwrap();

      showSuccess('Physical stocktake reconciled! Balances & ledger updated.');
      setAuditNotes('');
      setActiveTab('HISTORY');
    } catch (err) {
      showError(err?.data?.message || 'Failed to submit stock count');
    }
  };

  // Count Sheet Columns
  const countSheetColumns = [
    {
      title: 'Raw Material',
      dataIndex: 'name',
      key: 'name',
      width: '26%',
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">
            {r.sku} • {r.category}
          </span>
        </div>
      ),
    },
    {
      title: 'Expected Stock',
      key: 'systemStock',
      width: '18%',
      render: (_, r) => {
        const bStock = r.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        const sysStock = bStock ? bStock.currentStock : r.totalStock || 0;
        return (
          <span className="text-xs font-mono font-bold text-neutral-700">
            {sysStock.toLocaleString()} {r.recipeUnit}
          </span>
        );
      },
    },
    {
      title: 'Actual Physical Count',
      key: 'physicalCount',
      width: '26%',
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <InputNumber
            className="w-32 h-10 flex items-center font-mono font-bold text-xs"
            min={0}
            value={auditCounts[r._id]}
            onChange={(val) => handlePhysicalCountChange(r._id, val)}
          />
          <span className="text-xs font-semibold text-neutral-500">{r.recipeUnit}</span>
        </div>
      ),
    },
    {
      title: 'Variance & Impact',
      key: 'variance',
      render: (_, r) => {
        const bStock = r.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        const sysStock = bStock ? bStock.currentStock : r.totalStock || 0;
        const physical = auditCounts[r._id] !== undefined ? auditCounts[r._id] : sysStock;
        const variance = physical - sysStock;
        const costDiff = variance * (r.costPerRecipeUnit || 0);

        if (variance === 0) {
          return <Tag color="green" className="border-none font-extrabold text-[10px]">MATCH (0)</Tag>;
        }

        const isGain = variance > 0;
        return (
          <div>
            <Tag color={isGain ? 'blue' : 'red'} className="border-none font-mono font-extrabold text-[10px]">
              {isGain ? `+${variance.toLocaleString()}` : variance.toLocaleString()} {r.recipeUnit}
            </Tag>
            <span className={`text-[10px] font-mono block font-bold ${isGain ? 'text-blue-600' : 'text-rose-600'}`}>
              ({isGain ? '+' : ''}{formatPrice(costDiff)})
            </span>
          </div>
        );
      },
    },
  ];

  // History Columns
  const historyColumns = [
    {
      title: 'Audit Ref #',
      dataIndex: 'stocktakeNumber',
      key: 'stocktakeNumber',
      render: (num, r) => (
        <div>
          <strong className="text-xs font-mono text-neutral-900 block">{num}</strong>
          <span className="text-[10px] text-neutral-400">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Branch Outlet',
      dataIndex: 'branch',
      key: 'branch',
      render: (b) => <span className="text-xs font-semibold text-neutral-800">📍 {b?.name}</span>,
    },
    {
      title: 'Conducted By',
      dataIndex: 'conductedBy',
      key: 'conductedBy',
      render: (u) => <span className="text-xs text-neutral-700">{u?.name || 'Staff Member'}</span>,
    },
    {
      title: 'Shrinkage Loss',
      dataIndex: 'totalShrinkageLoss',
      key: 'totalShrinkageLoss',
      render: (loss) => (
        <span className="text-xs font-mono font-bold text-rose-600">
          {loss > 0 ? `-${formatPrice(loss)}` : 'Rs 0'}
        </span>
      ),
    },
    {
      title: 'Net Financial Adj.',
      dataIndex: 'totalNetVarianceValue',
      key: 'totalNetVarianceValue',
      render: (val) => (
        <span className={`text-xs font-mono font-bold ${val < 0 ? 'text-rose-600' : val > 0 ? 'text-blue-600' : 'text-neutral-700'}`}>
          {val > 0 ? `+${formatPrice(val)}` : formatPrice(val)}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <Button size="small" type="link" onClick={() => setSelectedAuditHistory(r)} className="text-xs font-bold">
          View Sheet
        </Button>
      ),
    },
  ];

  const netDiff = calculateNetVarianceCost();

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Audit & Reconciliation"
        subTitle="Conduct physical closing stock counts and resolve variance ledgers"
        showSearch={false}
      >
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-5 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Select Outlet:
            </span>
            <Select
              className="w-56 h-10"
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val)}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-neutral-50 px-4 py-2 rounded-xl border border-neutral-200 text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Net Count Variance Impact
              </span>
              <strong className={`text-sm font-mono font-black ${netDiff < 0 ? 'text-rose-600' : netDiff > 0 ? 'text-blue-600' : 'text-neutral-900'}`}>
                {netDiff > 0 ? `+${formatPrice(netDiff)}` : formatPrice(netDiff)}
              </strong>
            </div>

            {activeTab === 'COUNT_SHEET' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={isSubmitting}
                onClick={handleSubmitAudit}
                className="!bg-[#ffc400] !text-black hover:!bg-[#e6b000] font-bold h-10 px-5 rounded-xl border-none"
              >
                Reconcile & Update Balances
              </Button>
            )}
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'COUNT_SHEET',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <AuditOutlined /> Physical Count Sheet ({rawItems.length} items)
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Table
                    columns={countSheetColumns}
                    dataSource={rawItems}
                    rowKey="_id"
                    loading={loadingInventory}
                    pagination={false}
                    size="middle"
                  />

                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                      Audit Notes / Closing Summary
                    </label>
                    <Input.TextArea
                      rows={2}
                      placeholder="e.g. Midnight physical closing stock count by kitchen lead"
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              ),
            },
            {
              key: 'HISTORY',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <HistoryOutlined /> Past Audits ({stocktakes.length})
                </span>
              ),
              children: (
                <Table
                  columns={historyColumns}
                  dataSource={stocktakes}
                  rowKey="_id"
                  loading={loadingHistory}
                  pagination={{ pageSize: 8 }}
                  size="middle"
                />
              ),
            },
          ]}
        />

        {/* Modal: View Historical Stocktake Sheet */}
        <Modal
          open={!!selectedAuditHistory}
          onCancel={() => setSelectedAuditHistory(null)}
          footer={null}
          title={null}
          centered
          width={620}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {selectedAuditHistory && (
            <div className="pt-2">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1">
                Audit Record: {selectedAuditHistory.stocktakeNumber}
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                {selectedAuditHistory.branch?.name} • {new Date(selectedAuditHistory.createdAt).toLocaleString()}
              </p>

              <div className="max-h-80 overflow-y-auto space-y-2 mb-4">
                {selectedAuditHistory.items?.map((itm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                    <div>
                      <strong className="block text-neutral-900">{itm.item?.name || 'Raw Item'}</strong>
                      <span className="text-[10px] text-neutral-400">
                        System: {itm.systemStock} ➔ Counted: {itm.physicalCount}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold block ${itm.varianceQuantity < 0 ? 'text-rose-600' : itm.varianceQuantity > 0 ? 'text-blue-600' : 'text-neutral-600'}`}>
                        {itm.varianceQuantity > 0 ? `+${itm.varianceQuantity}` : itm.varianceQuantity}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {formatPrice(itm.varianceValue)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-500 block">Total Shrinkage: <strong className="text-rose-600">{formatPrice(selectedAuditHistory.totalShrinkageLoss)}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Net Financial Adjustment:</span>
                  <span className="text-sm font-black font-mono text-neutral-900">
                    {formatPrice(selectedAuditHistory.totalNetVarianceValue)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}