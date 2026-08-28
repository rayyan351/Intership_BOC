// src/app/admin/(dashboard)/inventory/stocktake/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Select } from 'antd';
import {
  AuditOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
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
  const [activeTab, setActiveTab] = useState('COUNT_SHEET');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditCounts, setAuditCounts] = useState({});
  const [discrepancyReasons, setDiscrepancyReasons] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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
        initialMap[item._id] = bStock ? bStock.currentStock : (item.totalStock || 0);
        reasonMap[item._id] = 'Physical count variance';
      });
      setAuditCounts(initialMap);
      setDiscrepancyReasons(reasonMap);
    }
  }, [rawItems, selectedBranch]);

  const handlePhysicalCountChange = (itemId, val) => {
    setAuditCounts((prev) => ({
      ...prev,
      [itemId]: val === '' ? '' : Number(val),
    }));
  };

  const calculateNetVarianceCost = () => {
    return rawItems.reduce((acc, item) => {
      const bStock = item.branchStocks?.find(
        (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
      );
      const systemStock = bStock ? bStock.currentStock : (item.totalStock || 0);
      const physical =
        auditCounts[item._id] !== undefined && auditCounts[item._id] !== ''
          ? Number(auditCounts[item._id])
          : systemStock;
      const variance = physical - systemStock;
      const cost = variance * (item.costPerRecipeUnit || 0);
      return acc + cost;
    }, 0);
  };

  const calculateVarianceCount = () => {
    return rawItems.filter((item) => {
      const bStock = item.branchStocks?.find(
        (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
      );
      const systemStock = bStock ? bStock.currentStock : (item.totalStock || 0);
      const physical =
        auditCounts[item._id] !== undefined && auditCounts[item._id] !== ''
          ? Number(auditCounts[item._id])
          : systemStock;
      return physical !== systemStock;
    }).length;
  };

  const handleSubmitAudit = async () => {
    if (!selectedBranch) {
      return showError('Please select a branch outlet.');
    }

    const countsPayload = rawItems.map((item) => {
      const bStock = item.branchStocks?.find(
        (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
      );
      const systemStock = bStock ? bStock.currentStock : (item.totalStock || 0);
      return {
        itemId: item._id,
        physicalCount:
          auditCounts[item._id] !== undefined && auditCounts[item._id] !== ''
            ? Number(auditCounts[item._id])
            : systemStock,
        discrepancyReason: discrepancyReasons[item._id] || 'Physical Audit Adjustment',
      };
    });

    try {
      await submitStocktake({
        branch: selectedBranch,
        counts: countsPayload,
        auditNotes: auditNotes.trim() || 'Physical stock count verified',
      }).unwrap();

      showSuccess('Physical stocktake reconciled! Balances & ledger updated.');
      setAuditNotes('');
      setIsConfirmModalOpen(false);
      setActiveTab('HISTORY');
    } catch (err) {
      showError(err?.data?.message || 'Failed to submit stock count');
    }
  };

  const countSheetColumns = [
    {
      title: 'Raw Material',
      dataIndex: 'name',
      key: 'name',
      width: '28%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {r.sku} • {r.category}
          </span>
        </div>
      ),
    },
    {
      title: 'Expected Stock',
      key: 'systemStock',
      width: '20%',
      render: (_, r) => {
        const bStock = r.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        const sysStock = bStock ? bStock.currentStock : (r.totalStock || 0);
        return (
          <span className="text-xs font-mono font-semibold text-neutral-700">
            {sysStock.toLocaleString()} {r.recipeUnit}
          </span>
        );
      },
    },
    {
      title: 'Actual Physical Count',
      key: 'physicalCount',
      width: '28%',
      render: (_, r) => {
        const bStock = r.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        const sysStock = bStock ? bStock.currentStock : (r.totalStock || 0);
        const currentValue = auditCounts[r._id] ?? sysStock ?? '';

        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              step="any"
              value={currentValue}
              onChange={(e) => handlePhysicalCountChange(r._id, e.target.value)}
              className="w-28 h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
            />
            <span className="text-xs font-semibold text-neutral-500">{r.recipeUnit}</span>
          </div>
        );
      },
    },
    {
      title: 'Variance & Impact',
      key: 'variance',
      render: (_, r) => {
        const bStock = r.branchStocks?.find(
          (bs) => bs.branch?._id?.toString() === selectedBranch || bs.branch?.toString() === selectedBranch
        );
        const sysStock = bStock ? bStock.currentStock : (r.totalStock || 0);
        const physical =
          auditCounts[r._id] !== undefined && auditCounts[r._id] !== ''
            ? Number(auditCounts[r._id])
            : sysStock;
        const variance = physical - sysStock;
        const costDiff = variance * (r.costPerRecipeUnit || 0);

        if (variance === 0) {
          return (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Match (0)
            </span>
          );
        }

        const isGain = variance > 0;
        return (
          <div>
            <span
              className={`inline-block text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md ${isGain ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-600'
                }`}
            >
              {isGain ? `+${variance.toLocaleString()}` : variance.toLocaleString()} {r.recipeUnit}
            </span>
            <span
              className={`text-[11px] font-mono block font-semibold mt-0.5 ${isGain ? 'text-blue-600' : 'text-rose-600'
                }`}
            >
              ({isGain ? '+' : ''}{formatPrice(costDiff)})
            </span>
          </div>
        );
      },
    },
  ];

  const historyColumns = [
    {
      title: 'Audit Ref #',
      dataIndex: 'stocktakeNumber',
      key: 'stocktakeNumber',
      width: '22%',
      render: (num, r) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">{num}</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {new Date(r.createdAt).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Branch Outlet',
      dataIndex: 'branch',
      key: 'branch',
      width: '20%',
      render: (b) => <span className="text-xs font-semibold text-neutral-800">{b?.name}</span>,
    },
    {
      title: 'Conducted By',
      dataIndex: 'conductedBy',
      key: 'conductedBy',
      width: '20%',
      render: (u) => <span className="text-xs text-neutral-700">{u?.name || 'Staff Member'}</span>,
    },
    {
      title: 'Shrinkage Loss',
      dataIndex: 'totalShrinkageLoss',
      key: 'totalShrinkageLoss',
      width: '18%',
      render: (loss) => (
        <span className="text-xs font-mono font-bold text-rose-600">
          {loss > 0 ? `-${formatPrice(loss)}` : 'Rs. 0'}
        </span>
      ),
    },
    {
      title: 'Net Financial Adj.',
      dataIndex: 'totalNetVarianceValue',
      key: 'totalNetVarianceValue',
      width: '20%',
      render: (val) => (
        <span
          className={`text-xs font-mono font-bold ${val < 0 ? 'text-rose-600' : val > 0 ? 'text-blue-600' : 'text-neutral-700'
            }`}
        >
          {val > 0 ? `+${formatPrice(val)}` : formatPrice(val)}
        </span>
      ),
    },
   {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '8%',
      render: (_, r) => (
        <button
          type="button"
          onClick={() => setSelectedAuditHistory(r)}
          title="View Audit Sheet"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-[#F4C61A] text-neutral-500 hover:text-neutral-900 border border-slate-200/70 hover:border-[#F4C61A] transition-all cursor-pointer shadow-2xs ml-auto"
        >
          <EyeOutlined className="text-sm" />
        </button>
      ),
    },
  ];

  const netDiff = calculateNetVarianceCost();
  const varianceCount = calculateVarianceCount();

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Audit & Reconciliation"
        subTitle="Conduct physical closing stock counts and resolve variance ledgers"
        showSearch={false}
        extra={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">
                Audited Outlet:
              </span>
              <Select
                className="w-52 h-10 staff-modern-select"
                value={selectedBranch || undefined}
                onChange={(val) => setSelectedBranch(val)}
                options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
              />
            </div>

            {activeTab === 'COUNT_SHEET' && (
              <CustomButton
                variant="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => setIsConfirmModalOpen(true)}
              >
                Reconcile & Update Balances
              </CustomButton>
            )}
          </div>
        }
      >
        <div className="space-y-7 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Tabs + Net Variance Badge Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('COUNT_SHEET')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'COUNT_SHEET'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <AuditOutlined className={activeTab === 'COUNT_SHEET' ? 'text-amber-500' : ''} />
                <span>Physical Count Sheet ({rawItems.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'HISTORY'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                  }`}
              >
                <HistoryOutlined className={activeTab === 'HISTORY' ? 'text-amber-500' : ''} />
                <span>Past Audits ({stocktakes.length})</span>
              </button>
            </div>

            {/* Impact Metric positioned in the tab bar */}
            {activeTab === 'COUNT_SHEET' && (
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/70 text-xs w-fit">
                <span className="text-[11px] font-semibold text-neutral-500">Net Variance Impact:</span>
                <span
                  className={`font-mono font-bold ${netDiff < 0 ? 'text-rose-600' : netDiff > 0 ? 'text-blue-600' : 'text-neutral-800'
                    }`}
                >
                  {netDiff > 0 ? `+${formatPrice(netDiff)}` : formatPrice(netDiff)}
                </span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="overflow-hidden">
            {activeTab === 'COUNT_SHEET' ? (
              <Table
                columns={countSheetColumns}
                dataSource={rawItems}
                rowKey="_id"
                loading={loadingInventory}
                pagination={false}
                size="middle"
              />
            ) : (
              <Table
                columns={historyColumns}
                dataSource={stocktakes}
                rowKey="_id"
                loading={loadingHistory}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            )}
          </div>
        </div>

        {/* Modal: Confirm Stocktake Reconciliation & Notes */}
        <CustomModal
          open={isConfirmModalOpen}
          onCancel={() => setIsConfirmModalOpen(false)}
          title="Confirm Physical Stock Reconciliation"
          width={520}
        >
          <div className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Audited Outlet:</span>
                <strong className="text-neutral-900">
                  {branches.find((b) => b._id === selectedBranch)?.name || 'Selected Branch'}
                </strong>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Items with Discrepancies:</span>
                <strong className={varianceCount > 0 ? 'text-amber-600' : 'text-neutral-900'}>
                  {varianceCount} SKUs
                </strong>
              </div>
              <div className="flex justify-between text-neutral-600 pt-2 border-t border-slate-200/60">
                <span>Net Financial Adjustment:</span>
                <span
                  className={`font-mono font-bold text-sm ${netDiff < 0 ? 'text-rose-600' : netDiff > 0 ? 'text-blue-600' : 'text-neutral-900'
                    }`}
                >
                  {netDiff > 0 ? `+${formatPrice(netDiff)}` : formatPrice(netDiff)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Audit Notes / Closing Summary
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Midnight physical count verified by kitchen supervisor"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
              <CustomButton
                variant="secondary"
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="primary"
                loading={isSubmitting}
                onClick={handleSubmitAudit}
              >
                Confirm & Reconcile Balances
              </CustomButton>
            </div>
          </div>
        </CustomModal>

        {/* Modal: View Historical Stocktake Record */}
        <CustomModal
          open={!!selectedAuditHistory}
          onCancel={() => setSelectedAuditHistory(null)}
          title={`Audit Record: ${selectedAuditHistory?.stocktakeNumber || ''}`}
          width={620}
        >
          {selectedAuditHistory && (
            <div className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-800">{selectedAuditHistory.branch?.name}</span>
                <span className="text-[11px] text-neutral-400">
                  {new Date(selectedAuditHistory.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {selectedAuditHistory.items?.map((itm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs"
                  >
                    <div>
                      <strong className="block text-neutral-900">{itm.item?.name || 'Raw Item'}</strong>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        System: {itm.systemStock} ➔ Counted: {itm.physicalCount}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold block ${itm.varianceQuantity < 0
                            ? 'text-rose-600'
                            : itm.varianceQuantity > 0
                              ? 'text-blue-600'
                              : 'text-neutral-600'
                          }`}
                      >
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
                  <span className="text-neutral-400 font-normal block">
                    Shrinkage Loss: <strong className="text-rose-600 font-mono">{formatPrice(selectedAuditHistory.totalShrinkageLoss)}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 font-normal block">Net Adjustment</span>
                  <span className="text-sm font-bold font-mono text-neutral-900">
                    {formatPrice(selectedAuditHistory.totalNetVarianceValue)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-100">
                <CustomButton variant="secondary" onClick={() => setSelectedAuditHistory(null)}>
                  Close
                </CustomButton>
              </div>
            </div>
          )}
        </CustomModal>
      </PageLayout>
    </>
  );
}