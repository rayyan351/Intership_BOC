// front-end/src/app/admin/(dashboard)/inventory/_components/StockTransferModal.jsx
'use client';

import React, { useState } from 'react';
import { Modal, Select } from 'antd';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
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
      return showError(`Transfer quantity exceeds available source stock (${selectedSourceStock} ${item?.recipeUnit}).`);
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
        <h3 className="text-lg font-bold text-neutral-900 m-0">Inter-Branch Stock Transfer (STO)</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Transfer <strong className="text-neutral-900">{item?.name}</strong> between kitchen locations
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Source Outlet <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full h-10"
                placeholder="From Branch"
                value={sourceBranchId || undefined}
                onChange={(val) => setSourceBranchId(val)}
                options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
              />
              {sourceBranchId && (
                <span className="text-[10px] font-bold text-neutral-500 block mt-1">
                  Available: <strong className="text-neutral-900 font-mono">{selectedSourceStock} {item?.recipeUnit}</strong>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Target Outlet <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full h-10"
                placeholder="To Branch"
                value={targetBranchId || undefined}
                onChange={(val) => setTargetBranchId(val)}
                options={branches
                  .filter((b) => b._id !== sourceBranchId)
                  .map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Quantity to Transfer ({item?.recipeUnit}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              max={selectedSourceStock || undefined}
              placeholder={`e.g. 500 (${item?.recipeUnit})`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Transfer Reason / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Emergency restock for evening rush"
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
              Execute Stock Transfer
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}