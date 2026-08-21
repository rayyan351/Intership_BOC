'use client';

import React, { useState } from 'react';
import { Modal, Select, Button, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
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
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={720}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <h3 className="text-lg font-bold text-neutral-900 m-0">Create Inward Purchase Order</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Order raw materials and packaging from registered suppliers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Supplier / Vendor <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full h-10"
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
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Destination Outlet <span className="text-red-500">*</span>
              </label>
              <Select
                className="w-full h-10"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Expected Delivery Date
              </label>
              <DatePicker
                className="w-full h-10"
                onChange={(date) => setExpectedDate(date)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Order Notes / Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Early morning delivery required"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Order Line Items
              </span>
              <Button
                size="small"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                className="!text-xs font-semibold"
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((itm, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-5">
                    <Select
                      value={itm.item}
                      onChange={(val) => handleItemSelect(idx, val)}
                      className="w-full"
                      showSearch
                      filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                      options={inventoryItems.map((inv) => ({
                        value: inv._id,
                        label: `${inv.name} (${inv.purchaseUnit})`,
                      }))}
                    />
                  </div>

                  <div className="col-span-3 flex items-center">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={itm.orderedQuantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full h-8 px-2 border border-neutral-300 rounded bg-white font-mono font-bold text-xs"
                      required
                    />
                    <span className="ml-1 text-[11px] font-bold text-neutral-500 w-8 truncate">
                      {itm.purchaseUnit}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center">
                    <span className="text-[11px] text-neutral-400 mr-1 font-bold">Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={itm.unitPurchasePrice}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      className="w-full h-8 px-2 border border-neutral-300 rounded bg-white font-mono font-bold text-xs"
                      required
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveItem(idx)}
                    />
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="py-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-300 rounded-lg">
                  No items added yet. Click &quot;Add Item&quot; to start your order.
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-neutral-900 rounded-xl text-white flex items-center justify-between text-xs">
            <span className="text-neutral-400 font-bold uppercase tracking-wider">
              Total Estimated PO Value:
            </span>
            <span className="font-mono font-bold text-base text-[#ffc400]">
              Rs. {totalCalculated.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Create Purchase Order
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}