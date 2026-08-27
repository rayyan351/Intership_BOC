// src/app/admin/(dashboard)/inventory/purchase-orders/_components/ReceivePOModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Space } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useToast } from '@/utils/toast';

export default function ReceivePOModal({ open, onClose, po, onReceive, loading }) {
  const { showError } = useToast();
  const [invoiceNo, setInvoiceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (po && open) {
      setInvoiceNo('');
      setNotes('');
      setItems(
        (po.items || []).map((i) => {
          const ordered = Number(i.orderedQuantity) || 0;
          const previouslyReceived = Number(i.receivedQuantity) || 0;
          const remainingQty = Math.max(0, ordered - previouslyReceived);

          return {
            itemId: i.item?._id || i.item,
            name: i.item?.name || 'Raw Material',
            sku: i.item?.sku || '',
            purchaseUnit: i.item?.purchaseUnit || 'units',
            orderedQuantity: ordered,
            previouslyReceived,
            receivedQuantity: remainingQty > 0 ? remainingQty : ordered,
            actualUnitPurchasePrice: Number(i.unitPurchasePrice) || 0,
          };
        })
      );
    }
  }, [po, open]);

  const handleQtyChange = (index, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].receivedQuantity = Number(val) >= 0 ? Number(val) : 0;
      return copy;
    });
  };

  const handlePriceChange = (index, val) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].actualUnitPurchasePrice = Number(val) >= 0 ? Number(val) : 0;
      return copy;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasInvalid = items.some((i) => i.receivedQuantity < 0 || i.actualUnitPurchasePrice <= 0);
    if (hasInvalid) {
      showError('Please enter valid received quantities and positive unit prices.');
      return;
    }

    const totalReceivingNow = items.reduce((sum, i) => sum + (i.receivedQuantity || 0), 0);
    if (totalReceivingNow <= 0) {
      showError('Total received quantity must be greater than zero.');
      return;
    }

    onReceive({
      id: po._id,
      supplierInvoiceNo: invoiceNo.trim(),
      notes: notes.trim(),
      receivedItems: items.map((i) => ({
        itemId: i.itemId,
        receivedQuantity: i.receivedQuantity,
        actualUnitPurchasePrice: i.actualUnitPurchasePrice,
      })),
    });
  };

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title="Receive Stock Delivery"
      width={720}
    >
      <form onSubmit={handleSubmit} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Header Summary Banner */}
        <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Purchase Order</span>
            <strong className="text-neutral-900 font-mono text-xs">{po?.poNumber}</strong>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Vendor</span>
            <strong className="text-neutral-800">{po?.supplier?.name || 'Vendor'}</strong>
          </div>
          <div>
            <span className="text-[11px] text-neutral-400 font-medium block">Receiving Outlet</span>
            <strong className="text-neutral-800">{po?.branch?.name || 'Main Kitchen'}</strong>
          </div>
        </div>

        {/* Invoice & Receiving Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Supplier Invoice / Bill No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. INV-90421"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Receiving Audit Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Inspected batch quality & verified weight"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
            />
          </div>
        </div>

        {/* Line Items Receiving Checklist */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-neutral-800 block">
            Verify Delivered Quantities & Unit Costs
          </span>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {items.map((itm, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 grid grid-cols-12 gap-3 items-center text-xs"
              >
                <div className="col-span-5">
                  <span className="font-semibold text-neutral-900 block text-xs">{itm.name}</span>
                  <span className="text-[11px] text-neutral-400 block font-normal">
                    Ordered: {itm.orderedQuantity} {itm.purchaseUnit}
                    {itm.previouslyReceived > 0 && ` (Previously: ${itm.previouslyReceived})`}
                  </span>
                </div>

                <div className="col-span-3">
                  <label className="text-[10px] text-neutral-500 font-semibold block mb-1">
                    Delivered ({itm.purchaseUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itm.receivedQuantity}
                    onChange={(e) => handleQtyChange(idx, e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                    required
                  />
                </div>

                <div className="col-span-4">
                  <label className="text-[10px] text-neutral-500 font-semibold block mb-1">
                    Actual Rate (Rs./{itm.purchaseUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itm.actualUnitPurchasePrice}
                    onChange={(e) => handlePriceChange(idx, e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WAC Notice Banner */}
        <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/60 flex items-start gap-2.5 text-xs">
          <InfoCircleOutlined className="text-amber-600 mt-0.5" />
          <div className="text-[11px] text-amber-900 leading-relaxed font-normal">
            <strong className="font-semibold">Weighted Average Costing (WAC):</strong> Submitting this receipt recalculates recipe unit costs across menu items and records stock inward transactions.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading} icon={<CheckCircleOutlined />}>
              Accept Stock & Update WAC
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}