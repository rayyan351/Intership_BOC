// src/app/admin/(dashboard)/inventory/stocktake/_components/PerformStocktakeModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Select, Alert, Space } from 'antd';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useToast } from '@/utils/toast';

export default function PerformStocktakeModal({
  open,
  onClose,
  branches = [],
  inventoryItems = [],
  onSubmit,
  loading,
}) {
  const { showError } = useToast();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [auditNotes, setAuditNotes] = useState('');
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (open && selectedBranchId) {
      const initial = {};
      inventoryItems.forEach((item) => {
        const branchStock =
          item.branchStocks?.find(
            (bs) => (bs.branch?._id || bs.branch) === selectedBranchId
          )?.currentStock || 0;

        initial[item._id] = {
          physicalCount: branchStock,
          systemStock: branchStock,
          unitCost: item.costPerRecipeUnit || 0,
          recipeUnit: item.recipeUnit || 'unit',
          reason: 'Routine physical count verification',
        };
      });
      setCounts(initial);
    }
  }, [open, selectedBranchId, inventoryItems]);

  const handleCountChange = (itemId, val) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        physicalCount: Number(val) >= 0 ? Number(val) : 0,
      },
    }));
  };

  const handleReasonChange = (itemId, text) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        reason: text,
      },
    }));
  };

  const calculatedVariances = Object.entries(counts).map(([itemId, data]) => {
    const diff = Number((data.physicalCount - data.systemStock).toFixed(2));
    const valueImpact = Number((diff * data.unitCost).toFixed(2));
    return {
      itemId,
      diff,
      valueImpact,
    };
  });

  const totalDiscrepancies = calculatedVariances.filter((v) => v.diff !== 0).length;
  const netFinancialImpact = calculatedVariances.reduce((acc, v) => acc + v.valueImpact, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBranchId) {
      return showError('Please select the kitchen outlet undergoing audit.');
    }

    const payload = Object.entries(counts).map(([itemId, data]) => ({
      itemId,
      physicalCount: data.physicalCount,
      discrepancyReason: data.reason,
    }));

    onSubmit({
      branch: selectedBranchId,
      auditNotes,
      counts: payload,
    });
  };

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Physical Stocktake Reconciliation"
      width={840}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Audited Outlet / Kitchen <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="Select Outlet to Audit"
              value={selectedBranchId || undefined}
              onChange={setSelectedBranchId}
              options={branches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.city})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Audit Session Reference / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. End of Month Full Kitchen Audit"
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
            />
          </div>
        </div>

        {selectedBranchId ? (
          <div className="space-y-2 pt-1">
            {/* Discrepancy & Variance Header Summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
              <span className="font-semibold text-neutral-800">
                Ingredient Counts & Variance Preview
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-500">
                  Discrepancies: <strong className="text-rose-600 font-mono">{totalDiscrepancies} items</strong>
                </span>
                <span className="text-[11px] text-neutral-500">
                  Net Impact:{' '}
                  <strong className={`font-mono ${netFinancialImpact < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    Rs. {netFinancialImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
            </div>

            {/* Scrollable Items Count List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {inventoryItems.map((item) => {
                const data = counts[item._id] || {
                  physicalCount: 0,
                  systemStock: 0,
                  unitCost: item.costPerRecipeUnit || 0,
                  recipeUnit: item.recipeUnit || 'unit',
                  reason: '',
                };
                const diff = Number((data.physicalCount - data.systemStock).toFixed(2));
                const costImpact = Number((diff * data.unitCost).toFixed(2));

                return (
                  <div
                    key={item._id}
                    className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 grid grid-cols-12 gap-3 items-center text-xs"
                  >
                    <div className="col-span-4">
                      <span className="font-semibold text-neutral-900 block text-xs">{item.name}</span>
                      <span className="text-[11px] text-neutral-400 block font-normal">
                        Theoretical: <strong className="font-mono text-neutral-700">{data.systemStock} {item.recipeUnit}</strong> • Rate: Rs. {data.unitCost}/{item.recipeUnit}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <label className="text-[10px] text-neutral-500 font-semibold block mb-1">
                        Physical Count ({item.recipeUnit})
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={data.physicalCount}
                        onChange={(e) => handleCountChange(item._id, e.target.value)}
                        className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                    </div>

                    <div className="col-span-2 text-right">
                      <span className="text-[10px] text-neutral-500 font-semibold block mb-1">Variance</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-neutral-400'
                        }`}
                      >
                        {diff > 0 ? `+${diff}` : diff} {item.recipeUnit}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        Rs. {Math.abs(costImpact).toLocaleString()}
                      </span>
                    </div>

                    <div className="col-span-3">
                      <label className="text-[10px] text-neutral-500 font-semibold block mb-1">
                        Discrepancy Reason
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Spoilage / Trimming loss"
                        value={data.reason}
                        onChange={(e) => handleReasonChange(item._id, e.target.value)}
                        className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white text-[11px] text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Alert
            message="Select an outlet above to populate current theoretical stock levels for physical count entry."
            type="info"
            showIcon
            className="rounded-2xl text-xs"
          />
        )}

        {/* Ledger Advisory Notice */}
        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/60 flex items-start gap-2.5 text-xs">
          <InfoCircleOutlined className="text-amber-600 mt-0.5 shrink-0" />
          <div className="text-[11px] text-amber-900 leading-relaxed font-normal">
            <strong className="font-semibold">Immutable Ledger Impact:</strong> Reconciling overwrites outlet stock balances and logs permanent <code className="font-mono font-semibold">PHYSICAL_AUDIT_ADJUSTMENT</code> transaction rows for non-zero variances.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              htmlType="submit"
              loading={loading}
              disabled={!selectedBranchId}
              icon={<CheckCircleOutlined />}
            >
              Reconcile & Apply Adjustments
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}