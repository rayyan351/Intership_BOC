// front-end/src/app/admin/(dashboard)/inventory/_components/StockAdjustmentModal.jsx
'use client';

import React, { useState } from 'react';
import { Modal, Radio } from 'antd';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useToast } from '@/utils/toast';

export default function StockAdjustmentModal({
  open,
  onClose,
  item,
  branches = [],
  onAdjust,
  loading,
}) {
  const { showError } = useToast();
  const [branchId, setBranchId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('SPOILAGE_WASTE');
  const [quantity, setQuantity] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!branchId) return showError('Please select a branch outlet.');
    if (!quantity || Number(quantity) <= 0) return showError('Please enter a valid quantity.');

    // Outward adjustments subtract, inward adds
    const numQty = Number(quantity);
    const finalQty = adjustmentType === 'PURCHASE_INWARD' ? numQty : -numQty;

    onAdjust({
      itemId: item._id,
      branchId,
      type: adjustmentType,
      quantityChanged: finalQty,
      notes:
        adjustmentType === 'SPOILAGE_WASTE'
          ? `Wastage Reason: ${wasteReason}. Notes: ${notes}`
          : notes,
    });
  };

  const selectedBranchStock = item?.branchStocks?.find(
    (bs) => bs.branch?._id === branchId || bs.branch === branchId
  )?.currentStock || 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={520}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <h3 className="text-lg font-bold text-neutral-900 m-0">Stock Adjustment & Wastage</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Adjusting inventory for <strong className="text-neutral-900">{item?.name}</strong> (SKU: {item?.sku})
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Select Outlet / Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              required
            >
              <option value="">Choose Branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name} ({b.city})
                </option>
              ))}
            </select>
            {branchId && (
              <span className="text-[11px] font-bold text-neutral-500 block mt-1">
                Current Branch Stock: <strong className="text-neutral-900 font-mono">{selectedBranchStock} {item?.recipeUnit}</strong>
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
              Adjustment Type
            </label>
            <Radio.Group
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value)}
              className="w-full grid grid-cols-3 gap-2"
            >
              <Radio.Button value="SPOILAGE_WASTE" className="text-center !text-xs font-bold !rounded-lg">
                Wastage / Loss
              </Radio.Button>
              <Radio.Button value="PHYSICAL_AUDIT_ADJUSTMENT" className="text-center !text-xs font-bold !rounded-lg">
                Physical Audit
              </Radio.Button>
              <Radio.Button value="PURCHASE_INWARD" className="text-center !text-xs font-bold !rounded-lg">
                Manual Inward
              </Radio.Button>
            </Radio.Group>
          </div>

          {adjustmentType === 'SPOILAGE_WASTE' && (
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Wastage Reason
              </label>
              <select
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              >
                <option value="Expired / Sour">Expired / Sour</option>
                <option value="Burnt / Overcooked in Kitchen">Burnt / Overcooked in Kitchen</option>
                <option value="Dropped / Contaminated">Dropped / Contaminated</option>
                <option value="Damaged Packaging">Damaged Packaging</option>
                <option value="Wrong Preparation">Wrong Preparation</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Quantity to Adjust ({item?.recipeUnit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              placeholder={`e.g. 500 (${item?.recipeUnit})`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Audit Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Shift end fridge check verification"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Apply & Log Audit Ledger
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}