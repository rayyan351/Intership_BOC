// front-end/src/app/admin/(dashboard)/inventory/purchase-orders/_components/ReceivePOModal.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
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
        <h3 className="text-lg font-bold text-neutral-900 m-0">Receive Stock Delivery</h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          PO: <strong className="text-neutral-900 font-mono">{po?.poNumber}</strong> • Supplier:{' '}
          <strong className="text-neutral-800">{po?.supplier?.name || 'Vendor'}</strong> • Outlet:{' '}
          <strong className="text-neutral-800">{po?.branch?.name || 'General Branch'}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Supplier Invoice / Bill No. <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. INV-90421"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Receiving Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Inspected batch quality & verified weight"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Verify Items & Unit Delivery Cost
            </span>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((itm, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-5">
                    <span className="font-bold text-neutral-900 block">{itm.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      Ordered: {itm.orderedQuantity} {itm.purchaseUnit}
                      {itm.previouslyReceived > 0 && ` (Received: ${itm.previouslyReceived})`}
                    </span>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">
                      Receiving ({itm.purchaseUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={itm.receivedQuantity}
                      onChange={(e) => handleQtyChange(idx, e.target.value)}
                      className="w-full h-8 px-2 rounded border border-neutral-300 bg-white font-bold font-mono text-neutral-900 text-xs"
                      required
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="text-[10px] text-neutral-500 font-bold block mb-0.5">
                      Cost (Rs. / {itm.purchaseUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={itm.actualUnitPurchasePrice}
                      onChange={(e) => handlePriceChange(idx, e.target.value)}
                      className="w-full h-8 px-2 rounded border border-neutral-300 bg-white font-bold font-mono text-neutral-900 text-xs"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong className="block font-bold mb-0.5">Weighted Average Costing (WAC) Notice:</strong>
            Submitting this delivery will automatically recalculate unit ingredient costs across your menu recipes and log the stock inward transaction.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              Accept Stock & Update WAC
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}