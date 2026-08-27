// src/app/admin/(dashboard)/inventory/_components/StockAdjustmentModal.jsx
'use client';

import React, { useState } from 'react';
import { Space } from 'antd';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useToast } from '@/utils/toast';

const ADJUSTMENT_TYPES = [
  { value: 'SPOILAGE_WASTE', label: 'Wastage / Spoilage' },
  { value: 'PHYSICAL_AUDIT_ADJUSTMENT', label: 'Physical Audit' },
  { value: 'PURCHASE_INWARD', label: 'Manual Inward' },
];

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
  const [wasteReason, setWasteReason] = useState('Expired / Sour');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!branchId) return showError('Please select a branch outlet.');
    if (!quantity || Number(quantity) <= 0) return showError('Please enter a valid quantity.');

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

  const selectedBranchStock =
    item?.branchStocks?.find(
      (bs) => bs.branch?._id === branchId || bs.branch === branchId
    )?.currentStock || 0;

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Stock Adjustment & Wastage Audit"
      width={520}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Item Summary Banner */}
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-neutral-900 block">
              {item?.name}
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              SKU: {item?.sku}
            </span>
          </div>
          {branchId && (
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 font-medium block">Current Branch Stock</span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {selectedBranchStock} {item?.recipeUnit}
              </span>
            </div>
          )}
        </div>

        {/* Branch Outlet Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Select Branch Outlet <span className="text-red-500">*</span>
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
            required
          >
            <option value="">Choose Branch Outlet</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>

        {/* Adjustment Type Segmented Pills */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Adjustment Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ADJUSTMENT_TYPES.map((type) => {
              const isSelected = adjustmentType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setAdjustmentType(type.value)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition text-center cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-slate-50/70 text-neutral-600 border-neutral-200 hover:bg-slate-100/70'
                  }`}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Wastage Reason Dropdown */}
        {adjustmentType === 'SPOILAGE_WASTE' && (
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Specific Wastage Reason
            </label>
            <select
              value={wasteReason}
              onChange={(e) => setWasteReason(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
            >
              <option value="Expired / Sour">Expired / Sour</option>
              <option value="Burnt / Overcooked in Kitchen">Burnt / Overcooked in Kitchen</option>
              <option value="Dropped / Contaminated">Dropped / Contaminated</option>
              <option value="Damaged Packaging">Damaged Packaging</option>
              <option value="Wrong Preparation">Wrong Preparation</option>
            </select>
          </div>
        )}

        {/* Quantity to Adjust */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Quantity to Adjust ({item?.recipeUnit}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="any"
            placeholder={`e.g. 500 (${item?.recipeUnit || 'g'})`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
            required
          />
        </div>

        {/* Audit Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Audit Ledger Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Shift-end fridge audit verification"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Apply & Log Audit
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}