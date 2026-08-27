// src/app/admin/(dashboard)/inventory/_components/StockTransferModal.jsx
'use client';

import React, { useState } from 'react';
import { Select, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useToast } from '@/utils/toast';

export default function StockTransferModal({
  open,
  onClose,
  item,
  branches = [],
  onTransfer,
  loading,
}) {
  const { showError } = useToast();
  const [sourceBranchId, setSourceBranchId] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const selectedSourceStock =
    item?.branchStocks?.find(
      (bs) => (bs.branch?._id || bs.branch) === sourceBranchId
    )?.currentStock || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sourceBranchId || !targetBranchId) {
      return showError('Please select both source and destination branches.');
    }
    if (sourceBranchId === targetBranchId) {
      return showError('Source and destination branches must be different.');
    }
    if (!quantity || Number(quantity) <= 0) {
      return showError('Please enter a valid transfer quantity.');
    }
    if (Number(quantity) > selectedSourceStock) {
      return showError(
        `Transfer quantity exceeds available stock (${selectedSourceStock} ${item?.recipeUnit}).`
      );
    }

    onTransfer({
      itemId: item._id,
      sourceBranchId,
      targetBranchId,
      quantity: Number(quantity),
      notes,
    });
  };

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Inter-Branch Stock Transfer (STO)"
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
          {sourceBranchId && (
            <div className="text-right">
              <span className="text-[10px] text-neutral-400 font-medium block">Source Available</span>
              <span className="text-xs font-bold text-neutral-900 font-mono">
                {selectedSourceStock} {item?.recipeUnit}
              </span>
            </div>
          )}
        </div>

        {/* Source & Destination Branches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Source Outlet <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="From Outlet"
              value={sourceBranchId || undefined}
              onChange={(val) => setSourceBranchId(val)}
              options={branches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.city})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Destination Outlet <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="To Outlet"
              value={targetBranchId || undefined}
              onChange={(val) => setTargetBranchId(val)}
              options={branches
                .filter((b) => b._id !== sourceBranchId)
                .map((b) => ({
                  value: b._id,
                  label: `${b.name} (${b.city})`,
                }))}
            />
          </div>
        </div>

        {/* Transfer Quantity */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Quantity to Transfer ({item?.recipeUnit}) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0.01"
            step="any"
            max={selectedSourceStock || undefined}
            placeholder={`e.g. 500 (${item?.recipeUnit || 'g'})`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
            required
          />
        </div>

        {/* Transfer Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
            Transfer Reason / Logistics Notes
          </label>
          <input
            type="text"
            placeholder="e.g. Emergency restock for evening dinner rush"
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
            <CustomButton variant="primary" htmlType="submit" loading={loading} icon={<ArrowRightOutlined />}>
              Dispatch Transfer
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}