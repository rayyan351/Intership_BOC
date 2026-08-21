// front-end/src/app/admin/(dashboard)/inventory/stocktake/_components/PerformStocktakeModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Select, InputNumber, Alert } from 'antd';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
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
          physicalCount: branchStock, // default to system stock
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
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={840}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <h3 className="text-lg font-bold text-neutral-900 m-0">Physical Stocktake Reconciliation</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Enter verified kitchen scale counts to calculate shrinkage variances and align system inventory with physical reality.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Audited Outlet / Kitchen <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full h-10"
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
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Audit Session Reference / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. End of Month Full Kitchen Audit"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-xs font-medium focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          {selectedBranchId ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Ingredient Counts & Variance Preview
                </span>
                <span className="text-xs font-mono font-bold">
                  Discrepancies: <strong className="text-rose-600">{totalDiscrepancies} items</strong> • Net Impact:{' '}
                  <strong className={netFinancialImpact < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    Rs. {netFinancialImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>

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
                      className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-4">
                        <span className="font-bold text-neutral-900 block">{item.name}</span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          Theoretical: <strong>{data.systemStock} {item.recipeUnit}</strong> • Rate: Rs. {data.unitCost}/{item.recipeUnit}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">
                          Physical Count ({item.recipeUnit})
                        </label>
                        <InputNumber
                          min={0}
                          step={1}
                          value={data.physicalCount}
                          onChange={(val) => handleCountChange(item._id, val)}
                          className="w-full font-mono font-bold text-xs"
                        />
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="text-[10px] text-neutral-500 font-bold block mb-0.5">Variance</span>
                        <span
                          className={`font-mono font-bold text-xs ${
                            diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-neutral-400'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} {item.recipeUnit}
                        </span>
                        <span className="text-[10px] text-neutral-400 block">
                          Rs. {Math.abs(costImpact).toLocaleString()}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">
                          Discrepancy Reason
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Spoilage / Trimming loss"
                          value={data.reason}
                          onChange={(e) => handleReasonChange(item._id, e.target.value)}
                          className="w-full h-7 px-2 rounded border border-neutral-300 text-[11px] bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Alert
              title="Select an outlet above to populate current theoretical stock levels for physical count entry."
              type="info"
              showIcon
              className="text-xs"
            />
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong className="block font-bold mb-0.5">Immutable Double-Entry Ledger Impact:</strong>
            Reconciling will instantly overwrite the branch current stock balances and create <code className="font-mono font-bold">PHYSICAL_AUDIT_ADJUSTMENT</code> transaction rows for every non-zero variance.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              htmlType="submit"
              loading={loading}
              disabled={!selectedBranchId}
            >
              Reconcile & Apply Audit Adjustments
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}