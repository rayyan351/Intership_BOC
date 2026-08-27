// src/app/admin/(dashboard)/inventory/purchasing/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tabs, Select, Space } from 'antd';
import {
  CheckCircleOutlined,
  ShopOutlined,
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import TableActions from '@/app/admin/_components/table/TableActions';
import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetInventoryItemsQuery,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

export default function PurchasingAndVendorsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('POS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Goods Receiving Modal State
  const [receivingPO, setReceivingPO] = useState(null);
  const [receivingForm, setReceivingForm] = useState({
    supplierInvoiceNo: '',
    notes: '',
    receivedItems: [],
  });

  // Queries
  const { data: purchaseOrders = [], isLoading: loadingPOs } = useGetPurchaseOrdersQuery();
  const { data: suppliers = [], isLoading: loadingSuppliers } = useGetSuppliersQuery();
  const { data: inventoryData } = useGetInventoryItemsQuery();
  const { data: branches = [] } = useGetBranchesQuery();

  const inventoryItems = inventoryData?.items || [];

  // Mutations
  const [createPO, { isLoading: isCreatingPO }] = useCreatePurchaseOrderMutation();
  const [receivePO, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();

  const [createSupplier, { isLoading: isSavingSupplier }] = useCreateSupplierMutation();
  const [updateSupplier] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  // PO Form State
  const [poForm, setPOForm] = useState({
    supplier: '',
    branch: '',
    notes: '',
    items: [{ item: '', orderedQuantity: 1, unitPurchasePrice: 0, purchaseUnit: 'kg' }],
  });

  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    paymentTerms: 'COD',
  });

  // ---------------- PO Line Handlers ----------------
  const handleAddItemLine = () => {
    setPOForm({
      ...poForm,
      items: [...poForm.items, { item: '', orderedQuantity: 1, unitPurchasePrice: 0, purchaseUnit: 'kg' }],
    });
  };

  const handleRemoveItemLine = (index) => {
    const updated = poForm.items.filter((_, idx) => idx !== index);
    setPOForm({ ...poForm, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...poForm.items];
    updated[index][field] = value;

    if (field === 'item') {
      const selectedInv = inventoryItems.find((i) => i._id === value);
      if (selectedInv) {
        updated[index].purchaseUnit = selectedInv.purchaseUnit || 'kg';
        updated[index].unitPurchasePrice = selectedInv.costPerPurchaseUnit || 0;
      }
    }

    setPOForm({ ...poForm, items: updated });
  };

  const calculatePOTotal = () => {
    return poForm.items.reduce(
      (sum, itm) => sum + (Number(itm.orderedQuantity) || 0) * (Number(itm.unitPurchasePrice) || 0),
      0
    );
  };

  const handleOpenCreatePO = () => {
    setPOForm({
      supplier: suppliers[0]?._id || '',
      branch: branches[0]?._id || '',
      notes: '',
      items: [{ item: '', orderedQuantity: 1, unitPurchasePrice: 0, purchaseUnit: 'kg' }],
    });
    setIsPOModalOpen(true);
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplier || !poForm.branch) {
      return showError('Supplier and receiving branch are required.');
    }

    const validItems = poForm.items.filter((i) => i.item && Number(i.orderedQuantity) > 0);
    if (validItems.length === 0) {
      return showError('Please select at least one item with a valid quantity.');
    }

    try {
      await createPO({
        supplier: poForm.supplier,
        branch: poForm.branch,
        items: validItems,
        notes: poForm.notes,
        status: 'ORDERED',
      }).unwrap();

      showSuccess('Purchase order created and issued.');
      setIsPOModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to create purchase order');
    }
  };

  // ---------------- Goods Receiving Handlers ----------------
  const handleOpenReceiveModal = (po) => {
    setReceivingPO(po);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const autoInvoiceNo = `GRN-${dateStr}-${rand}`;

    setReceivingForm({
      supplierInvoiceNo: autoInvoiceNo,
      notes: '',
      receivedItems: po.items.map((i) => ({
        itemId: i.item?._id || i.item,
        name: i.item?.name || 'Raw Material',
        purchaseUnit: i.item?.purchaseUnit || 'kg',
        orderedQuantity: i.orderedQuantity,
        receivedQuantity: i.orderedQuantity - (i.receivedQuantity || 0),
        actualUnitPurchasePrice: i.unitPurchasePrice,
      })),
    });
  };

  const handleExecuteReceive = async () => {
    try {
      await receivePO({
        id: receivingPO._id,
        receivedItems: receivingForm.receivedItems,
        supplierInvoiceNo: receivingForm.supplierInvoiceNo,
        notes: receivingForm.notes,
      }).unwrap();

      showSuccess('Goods received! Stock balances updated.');
      setReceivingPO(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to receive stock');
    }
  };

  // ---------------- Supplier Modal Handlers ----------------
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      paymentTerms: 'COD',
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name,
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      taxNumber: sup.taxNumber || '',
      paymentTerms: sup.paymentTerms || 'COD',
    });
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.phone) {
      return showError('Supplier name and phone number are required.');
    }

    try {
      if (editingSupplier) {
        await updateSupplier({ id: editingSupplier._id, ...supplierForm }).unwrap();
        showSuccess('Supplier details updated.');
      } else {
        await createSupplier(supplierForm).unwrap();
        showSuccess('New supplier registered.');
      }
      setIsSupplierModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save supplier');
    }
  };

  const handleDeleteSupplier = async (id) => {
    try {
      await deleteSupplier(id).unwrap();
      showSuccess('Supplier removed.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete supplier');
    }
  };

  // Filtered lists
  const filteredPOs = purchaseOrders.filter(
    (p) =>
      p.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm) ||
      s.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPOStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Draft
          </span>
        );
      case 'ORDERED':
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
            Ordered
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
            Partial
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Received
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: '18%',
      render: (num, r) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">{num}</span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: '24%',
      render: (s) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{s?.name || 'Unknown'}</span>
          <span className="text-[11px] text-neutral-400 font-normal">{s?.phone}</span>
        </div>
      ),
    },
    {
      title: 'Destination Outlet',
      dataIndex: 'branch',
      key: 'branch',
      width: '20%',
      render: (b) => <span className="text-xs font-semibold text-neutral-800">{b?.name}</span>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '18%',
      render: (amt) => (
        <span className="text-xs font-mono font-bold text-neutral-900">{formatPrice(amt)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => getPOStatusBadge(status),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '10%',
      render: (_, r) => (
        <div className="flex items-center justify-end">
          {(r.status === 'ORDERED' || r.status === 'PARTIALLY_RECEIVED') && (
            <button
              onClick={() => handleOpenReceiveModal(r)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg text-neutral-900 bg-[#F4C61A] hover:bg-[#e5b713] transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <CheckCircleOutlined className="text-xs" /> Receive
            </button>
          )}
        </div>
      ),
    },
  ];

  const supplierColumns = [
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      width: '28%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {r.supplierCode || 'SUP-AUTO'} • {r.contactPerson || 'No contact'}
          </span>
        </div>
      ),
    },
    {
      title: 'Contact Details',
      key: 'contact',
      width: '24%',
      render: (_, r) => (
        <div>
          <span className="text-xs font-mono font-semibold text-neutral-800 block">{r.phone}</span>
          <span className="text-[11px] text-neutral-400">{r.email || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Dispatch Address',
      dataIndex: 'address',
      key: 'address',
      width: '26%',
      render: (address) => (
        <span className="text-xs text-neutral-600 line-clamp-1 font-normal">
          {address || <span className="text-neutral-400">No address provided</span>}
        </span>
      ),
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      width: '12%',
      render: (terms) => (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
          {terms}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '10%',
      render: (_, r) => (
        <TableActions
          onEdit={() => handleOpenEditSupplier(r)}
          onDelete={() => handleDeleteSupplier(r._id)}
          deleteTitle="Delete Supplier?"
          deleteDescription={`Permanently remove "${r.name}" from active vendors?`}
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Purchasing & Vendors"
        subTitle="Procurement orders, supplier directory, and automated stock intake"
        onAdd={activeTab === 'POS' ? handleOpenCreatePO : handleOpenCreateSupplier}
        addText={activeTab === 'POS' ? 'Create Purchase Order' : 'Add Supplier'}
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search PO number, vendor, or address..."
      >
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Custom Pill Tabs */}
          <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('POS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'POS'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <FileTextOutlined className={activeTab === 'POS' ? 'text-amber-500' : ''} />
              <span>Purchase Orders ({purchaseOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('VENDORS')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'VENDORS'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <ShopOutlined className={activeTab === 'VENDORS' ? 'text-amber-500' : ''} />
              <span>Vendor Directory ({suppliers.length})</span>
            </button>
          </div>

          {/* Tables Display */}
          <div className="overflow-hidden">
            {activeTab === 'POS' ? (
              <Table
                columns={poColumns}
                dataSource={filteredPOs}
                rowKey="_id"
                loading={loadingPOs}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            ) : (
              <Table
                columns={supplierColumns}
                dataSource={filteredSuppliers}
                rowKey="_id"
                loading={loadingSuppliers}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            )}
          </div>
        </div>

        {/* MODAL: Create Purchase Order */}
        <CustomModal
          open={isPOModalOpen}
          onCancel={() => setIsPOModalOpen(false)}
          title="Create New Purchase Order"
          width={640}
        >
          <form onSubmit={handleSavePO} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Supplier / Vendor <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full h-10 staff-modern-select"
                  value={poForm.supplier || undefined}
                  onChange={(val) => setPOForm({ ...poForm, supplier: val })}
                  options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                  placeholder="Select Vendor"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Receiving Kitchen Outlet <span className="text-red-500">*</span>
                </label>
                <Select
                  className="w-full h-10 staff-modern-select"
                  value={poForm.branch || undefined}
                  onChange={(val) => setPOForm({ ...poForm, branch: val })}
                  options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
                  placeholder="Select Outlet"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-neutral-800">
                  Order Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddItemLine}
                  className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
                >
                  <PlusOutlined className="text-[10px]" /> Add Line
                </button>
              </div>

              <div className="space-y-2">
                {poForm.items.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                    <div className="flex-1">
                      <Select
                        className="w-full h-9 staff-modern-select"
                        placeholder="Pick raw item"
                        value={line.item || undefined}
                        onChange={(val) => handleItemChange(idx, 'item', val)}
                        options={inventoryItems.map((i) => ({
                          value: i._id,
                          label: `${i.name} (${i.purchaseUnit})`,
                        }))}
                      />
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        value={line.orderedQuantity}
                        onChange={(e) => handleItemChange(idx, 'orderedQuantity', e.target.value)}
                        className="w-full h-9 px-2.5 border border-neutral-200 rounded-xl bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Price"
                        value={line.unitPurchasePrice}
                        onChange={(e) => handleItemChange(idx, 'unitPurchasePrice', e.target.value)}
                        className="w-full h-9 px-2.5 border border-neutral-200 rounded-xl bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                    </div>

                    {poForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemLine(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <DeleteOutlined className="text-xs" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200/60 flex justify-between items-center text-xs">
                <span className="text-neutral-500 font-medium">Estimated PO Total:</span>
                <span className="text-base font-bold font-mono text-neutral-900">
                  {formatPrice(calculatePOTotal())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Delivery Instructions & Notes
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Deliver before 10 AM, check freshness on intake"
                value={poForm.notes}
                onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
                className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
              <Space size="middle">
                <CustomButton variant="secondary" type="button" onClick={() => setIsPOModalOpen(false)}>
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" htmlType="submit" loading={isCreatingPO}>
                  Issue Purchase Order
                </CustomButton>
              </Space>
            </div>
          </form>
        </CustomModal>

        {/* MODAL: Goods Receiving Note (GRN) */}
        <CustomModal
          open={!!receivingPO}
          onCancel={() => setReceivingPO(null)}
          title={`Receive Goods: ${receivingPO?.poNumber || ''}`}
          width={540}
        >
          {receivingPO && (
            <div className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Supplier Invoice / GRN Reference No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. GRN-20260824-1234"
                  value={receivingForm.supplierInvoiceNo}
                  onChange={(e) => setReceivingForm({ ...receivingForm, supplierInvoiceNo: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700">
                  Verify Received Quantities
                </label>
                {receivingForm.receivedItems.map((recItm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">{recItm.name}</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        Ordered: {recItm.orderedQuantity} {recItm.purchaseUnit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={recItm.receivedQuantity}
                        onChange={(e) => {
                          const copy = [...receivingForm.receivedItems];
                          copy[idx].receivedQuantity = Number(e.target.value) || 0;
                          setReceivingForm({ ...receivingForm, receivedItems: copy });
                        }}
                        className="w-20 h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                      <span className="text-xs font-semibold text-neutral-500">{recItm.purchaseUnit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
                <Space size="middle">
                  <CustomButton variant="secondary" type="button" onClick={() => setReceivingPO(null)}>
                    Cancel
                  </CustomButton>
                  <CustomButton variant="primary" loading={isReceiving} onClick={handleExecuteReceive}>
                    Confirm & Credit Stock
                  </CustomButton>
                </Space>
              </div>
            </div>
          )}
        </CustomModal>

        {/* MODAL: Register / Edit Supplier */}
        <CustomModal
          open={isSupplierModalOpen}
          onCancel={() => setIsSupplierModalOpen(false)}
          title={editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
          width={480}
        >
          <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3.5 font-['Plus_Jakarta_Sans',sans-serif]">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Supplier Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dawn Bread Supplies, Meat Masters"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tariq Khan"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0300 1234567"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="vendor@supplies.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Payment Terms
                </label>
                <select
                  value={supplierForm.paymentTerms}
                  onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_30">Net 30 Days</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Warehouse / Dispatch Address
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Plot 42-C, Korangi Industrial Area, Sector 15, Karachi"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                NTN / STRN # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 1234567-8"
                value={supplierForm.taxNumber}
                onChange={(e) => setSupplierForm({ ...supplierForm, taxNumber: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              />
            </div>

            <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
              <Space size="middle">
                <CustomButton variant="secondary" type="button" onClick={() => setIsSupplierModalOpen(false)}>
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" htmlType="submit" loading={isSavingSupplier}>
                  Save Supplier
                </CustomButton>
              </Space>
            </div>
          </form>
        </CustomModal>
      </PageLayout>
    </>
  );
}