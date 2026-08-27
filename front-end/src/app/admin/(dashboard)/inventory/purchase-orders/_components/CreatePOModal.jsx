// src/app/admin/(dashboard)/inventory/_components/CreatePOModal.jsx
'use client';

import React, { useState } from 'react';
import { Select, DatePicker, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useToast } from '@/utils/toast';

export default function CreatePOModal({
  open,
  onClose,
  suppliers = [],
  branches = [],
  inventoryItems = [],
  onSubmit,
  loading,
}) {
  const { showError } = useToast();
  const [supplierId, setSupplierId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [expectedDate, setExpectedDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  const handleAddItem = () => {
    if (!inventoryItems.length) return;
    const firstItem = inventoryItems[0];
    setItems((prev) => [
      ...prev,
      {
        item: firstItem._id,
        name: firstItem.name,
        purchaseUnit: firstItem.purchaseUnit,
        orderedQuantity: 10,
        unitPurchasePrice: firstItem.costPerPurchaseUnit || 0,
      },
    ]);
  };

  const handleItemSelect = (index, selectedItemId) => {
    const matched = inventoryItems.find((i) => i._id === selectedItemId);
    if (!matched) return;
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        item: matched._id,
        name: matched.name,
        purchaseUnit: matched.purchaseUnit,
        unitPurchasePrice: matched.costPerPurchaseUnit || 0,
      };
      return copy;
    });
  };

  const handleQtyChange = (index, qty) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].orderedQuantity = Number(qty);
      return copy;
    });
  };

  const handlePriceChange = (index, price) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].unitPurchasePrice = Number(price);
      return copy;
    });
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierId) return showError('Please select a supplier.');
    if (!branchId) return showError('Please select a destination branch.');
    if (!items.length) return showError('Please add at least one line item.');

    const subtotalCalc = items.reduce(
      (sum, i) => sum + (Number(i.orderedQuantity) || 0) * (Number(i.unitPurchasePrice) || 0),
      0
    );

    onSubmit({
      supplier: supplierId,
      branch: branchId,
      expectedDeliveryDate: expectedDate ? expectedDate.toISOString() : null,
      notes,
      items: items.map((i) => ({
        item: i.item,
        orderedQuantity: Number(i.orderedQuantity),
        unitPurchasePrice: Number(i.unitPurchasePrice),
      })),
      totalAmount: subtotalCalc,
    });
  };

  const totalCalculated = items.reduce(
    (sum, i) => sum + (Number(i.orderedQuantity) || 0) * (Number(i.unitPurchasePrice) || 0),
    0
  );

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Create Inward Purchase Order (PO)"
      width={720}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Supplier & Destination Outlet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Supplier / Vendor <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="Select Vendor"
              showSearch
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              value={supplierId || undefined}
              onChange={setSupplierId}
              options={suppliers.map((s) => ({
                value: s._id,
                label: `${s.name} (${s.paymentTerms || 'Standard'})`,
              }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Destination Outlet <span className="text-red-500">*</span>
            </label>
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="Select Outlet"
              value={branchId || undefined}
              onChange={setBranchId}
              options={branches.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.city})`,
              }))}
            />
          </div>
        </div>

        {/* Expected Date & Order Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Expected Delivery Date
            </label>
            <DatePicker
              className="w-full h-10 rounded-xl border-neutral-200 bg-slate-50/60 hover:bg-white text-xs"
              onChange={(date) => setExpectedDate(date)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Order Notes / Handling Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Early morning delivery before 10 AM"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
            />
          </div>
        </div>

        {/* Line Items List */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-800">
              Order Line Items ({items.length})
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="h-8 px-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusOutlined className="text-xs" /> Add Raw Material
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((itm, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 grid grid-cols-12 gap-2.5 items-center text-xs"
              >
                {/* Item Select */}
                <div className="col-span-5">
                  <Select
                    value={itm.item}
                    onChange={(val) => handleItemSelect(idx, val)}
                    className="w-full h-9 staff-modern-select"
                    showSearch
                    filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    options={inventoryItems.map((inv) => ({
                      value: inv._id,
                      label: `${inv.name} (${inv.purchaseUnit})`,
                    }))}
                  />
                </div>

                {/* Ordered Qty */}
                <div className="col-span-3 flex items-center gap-1">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={itm.orderedQuantity}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    className="w-full h-9 px-2.5 border border-neutral-200 rounded-xl bg-white font-mono font-semibold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                    required
                  />
                  <span className="text-[11px] font-semibold text-neutral-400 shrink-0 w-8 truncate">
                    {itm.purchaseUnit}
                  </span>
                </div>

                {/* Unit Cost */}
                <div className="col-span-3 flex items-center gap-1">
                  <span className="text-[11px] text-neutral-400 font-semibold shrink-0">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={itm.unitPurchasePrice}
                    onChange={(e) => handlePriceChange(idx, e.target.value)}
                    className="w-full h-9 px-2.5 border border-neutral-200 rounded-xl bg-white font-mono font-semibold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                    required
                  />
                </div>

                {/* Delete Row Button */}
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <DeleteOutlined className="text-xs" />
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                No items added yet. Click &quot;Add Raw Material&quot; to configure purchase quantities.
              </div>
            )}
          </div>
        </div>

        {/* Total Summary Footer */}
        <div className="p-4 bg-neutral-900 rounded-2xl text-white flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400 tracking-tight">
            Total Estimated PO Value
          </span>
          <span className="font-mono font-bold text-base text-[#F4C61A]">
            Rs. {totalCalculated.toLocaleString()}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Create Purchase Order
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}