// src/app/admin/(dashboard)/inventory/purchasing/page.jsx
'use client';

import React, { useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Drawer,
  Input,
  InputNumber,
  Select,
  Popconfirm,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  CheckCircleOutlined,
  ShopOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
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
  const [activeTab, setActiveTab] = useState('POS'); // 'POS' | 'VENDORS'
  const [searchTerm, setSearchTerm] = useState('');

  // Modals / Drawers
  const [isPODrawerOpen, setIsPODrawerOpen] = useState(false);
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

  // ---------------- PO Item Line Handlers ----------------
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
    setIsPODrawerOpen(true);
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    if (!poForm.supplier || !poForm.branch) {
      return showError('Supplier and receiving branch are required.');
    }

    const validItems = poForm.items.filter((i) => i.item && Number(i.orderedQuantity) > 0);
    if (validItems.length === 0) {
      return showError('Please select at least one item with valid quantity.');
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
      setIsPODrawerOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to create purchase order');
    }
  };

  // ---------------- Goods Receiving Handlers (Auto GRN / Invoice) ----------------
  const handleOpenReceiveModal = (po) => {
    setReceivingPO(po);

    // Auto-generate a default GRN / Invoice Number
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

      showSuccess('Goods received! Stock balances updated and batches logged.');
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

  // ---------------- Tables Configuration ----------------
  const poColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (num, r) => (
        <div>
          <strong className="text-xs text-neutral-900 font-mono block">{num}</strong>
          <span className="text-[10px] text-neutral-400">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (s) => (
        <div>
          <strong className="text-xs text-neutral-800 block">{s?.name || 'Unknown'}</strong>
          <span className="text-[10px] text-neutral-400">{s?.phone}</span>
        </div>
      ),
    },
    {
      title: 'Target Outlet',
      dataIndex: 'branch',
      key: 'branch',
      render: (b) => <span className="text-xs font-semibold text-neutral-700">📍 {b?.name}</span>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amt) => (
        <span className="text-xs font-mono font-bold text-neutral-900">{formatPrice(amt)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          DRAFT: 'default',
          ORDERED: 'blue',
          PARTIALLY_RECEIVED: 'orange',
          RECEIVED: 'green',
          CANCELLED: 'red',
        };
        return (
          <Tag color={colors[status] || 'default'} className="font-extrabold text-[10px] border-none">
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1.5">
          {(r.status === 'ORDERED' || r.status === 'PARTIALLY_RECEIVED') && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenReceiveModal(r)}
              className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold text-[11px] border-none flex items-center gap-1"
            >
              Receive Goods
            </Button>
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
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">
            {r.supplierCode || 'SUP-AUTO'} • Contact: {r.contactPerson || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'Phone / Email',
      key: 'contact',
      render: (_, r) => (
        <div>
          <span className="text-xs font-mono text-neutral-800 block">{r.phone}</span>
          <span className="text-[10px] text-neutral-400">{r.email || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Warehouse / Office Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => (
        <span className="text-xs text-neutral-600 line-clamp-1">
          {address ? `📍 ${address}` : <span className="text-neutral-300 font-mono text-[11px]">No address provided</span>}
        </span>
      ),
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      render: (terms) => <Tag className="font-bold text-[10px] border-none bg-neutral-100">{terms}</Tag>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenEditSupplier(r)} />
          <Popconfirm
            title="Delete this supplier?"
            onConfirm={() => handleDeleteSupplier(r._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
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
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'POS',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <FileTextOutlined /> Purchase Orders ({purchaseOrders.length})
                </span>
              ),
              children: (
                <Table
                  columns={poColumns}
                  dataSource={filteredPOs}
                  rowKey="_id"
                  loading={loadingPOs}
                  pagination={{ pageSize: 8 }}
                  size="middle"
                />
              ),
            },
            {
              key: 'VENDORS',
              label: (
                <span className="flex items-center gap-2 font-bold text-xs">
                  <ShopOutlined /> Vendor Directory ({suppliers.length})
                </span>
              ),
              children: (
                <Table
                  columns={supplierColumns}
                  dataSource={filteredSuppliers}
                  rowKey="_id"
                  loading={loadingSuppliers}
                  pagination={{ pageSize: 8 }}
                  size="middle"
                />
              ),
            },
          ]}
        />

        {/* DRAWER: Create Purchase Order */}
        <Drawer
          open={isPODrawerOpen}
          onClose={() => setIsPODrawerOpen(false)}
          size={560}
          title="Create New Purchase Order"
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <form onSubmit={handleSavePO} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Supplier *
                </label>
                <Select
                  className="w-full h-10"
                  value={poForm.supplier || undefined}
                  onChange={(val) => setPOForm({ ...poForm, supplier: val })}
                  options={suppliers.map((s) => ({ value: s._id, label: s.name }))}
                  placeholder="Select Vendor"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Receiving Outlet *
                </label>
                <Select
                  className="w-full h-10"
                  value={poForm.branch || undefined}
                  onChange={(val) => setPOForm({ ...poForm, branch: val })}
                  options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
                  placeholder="Select Outlet"
                />
              </div>
            </div>

            {/* Item Line Rows */}
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                  Order Line Items
                </span>
                <Button
                  size="small"
                  type="link"
                  icon={<PlusOutlined />}
                  onClick={handleAddItemLine}
                  className="text-xs font-bold"
                >
                  Add Row
                </Button>
              </div>

              <div className="space-y-2.5">
                {poForm.items.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-neutral-200">
                    <div className="flex-1">
                      <Select
                        className="w-full"
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
                      <InputNumber
                        className="w-full"
                        min={0.1}
                        placeholder="Qty"
                        value={line.orderedQuantity}
                        onChange={(val) => handleItemChange(idx, 'orderedQuantity', val || 1)}
                      />
                    </div>

                    <div className="w-24">
                      <InputNumber
                        className="w-full"
                        min={0}
                        placeholder="Unit Price"
                        value={line.unitPurchasePrice}
                        onChange={(val) => handleItemChange(idx, 'unitPurchasePrice', val || 0)}
                      />
                    </div>

                    {poForm.items.length > 1 && (
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveItemLine(idx)}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-xs font-bold">
                <span>Estimated Total:</span>
                <span className="text-base font-black font-mono text-neutral-900">
                  {formatPrice(calculatePOTotal())}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Notes / Delivery Instructions
              </label>
              <Input.TextArea
                rows={2}
                placeholder="e.g. Deliver before 10 AM, check freshness on delivery"
                value={poForm.notes}
                onChange={(e) => setPOForm({ ...poForm, notes: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t border-neutral-100 flex gap-2 justify-end">
              <Button onClick={() => setIsPODrawerOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreatingPO}
                className="!bg-[#ffc400] !text-black font-bold border-none"
              >
                Issue Purchase Order
              </Button>
            </div>
          </form>
        </Drawer>

        {/* MODAL: Goods Receiving Note (GRN) with Auto ID Pre-fill */}
        <Modal
          open={!!receivingPO}
          onCancel={() => setReceivingPO(null)}
          footer={null}
          title={null}
          centered
          width={520}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {receivingPO && (
            <div className="pt-2">
              <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1 flex items-center gap-2">
                <CheckCircleOutlined className="text-emerald-600" />
                Receive Goods: {receivingPO.poNumber}
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Confirm incoming quantities and invoice details. Stock balances will be credited automatically.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Supplier Invoice / GRN #
                    </label>
                    <span className="text-[10px] text-neutral-400 font-semibold">Auto-Generated (Editable)</span>
                  </div>
                  <Input
                    placeholder="e.g. GRN-20260824-1234 or vendor's bill number"
                    value={receivingForm.supplierInvoiceNo}
                    onChange={(e) => setReceivingForm({ ...receivingForm, supplierInvoiceNo: e.target.value })}
                    className="h-10 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Received Quantities
                  </label>
                  {receivingForm.receivedItems.map((recItm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                      <div>
                        <strong className="text-xs text-neutral-900 block">{recItm.name}</strong>
                        <span className="text-[10px] text-neutral-400">
                          Ordered: {recItm.orderedQuantity} {recItm.purchaseUnit}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <InputNumber
                          min={0}
                          value={recItm.receivedQuantity}
                          onChange={(val) => {
                            const copy = [...receivingForm.receivedItems];
                            copy[idx].receivedQuantity = val || 0;
                            setReceivingForm({ ...receivingForm, receivedItems: copy });
                          }}
                          className="w-24"
                        />
                        <span className="text-xs font-bold text-neutral-600">{recItm.purchaseUnit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <Button onClick={() => setReceivingPO(null)}>Cancel</Button>
                <Button
                  type="primary"
                  loading={isReceiving}
                  onClick={handleExecuteReceive}
                  className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold border-none"
                >
                  Confirm & Credit Stock
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: Register / Edit Supplier with Address Field */}
        <Modal
          open={isSupplierModalOpen}
          onCancel={() => setIsSupplierModalOpen(false)}
          footer={null}
          title={null}
          centered
          width={460}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <div className="pt-2">
            <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1">
              {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Add vendor contact information, location address, and payment terms.
            </p>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Supplier Business Name *
                </label>
                <Input
                  required
                  placeholder="e.g. Dawn Bread Supplies, Meat Masters"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <Input
                    placeholder="e.g. Tariq Khan"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <Input
                    required
                    placeholder="0300 1234567"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="vendor@supplies.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <Select
                    className="w-full h-10"
                    value={supplierForm.paymentTerms}
                    onChange={(val) => setSupplierForm({ ...supplierForm, paymentTerms: val })}
                    options={[
                      { value: 'COD', label: 'Cash on Delivery (COD)' },
                      { value: 'NET_7', label: 'Net 7 Days' },
                      { value: 'NET_15', label: 'Net 15 Days' },
                      { value: 'NET_30', label: 'Net 30 Days' },
                      { value: 'PREPAID', label: 'Prepaid' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Warehouse / Dispatch Address
                </label>
                <Input.TextArea
                  rows={2}
                  placeholder="e.g. Plot 42-C, Korangi Industrial Area, Sector 15, Karachi"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  NTN / STRN #
                </label>
                <Input
                  placeholder="e.g. 1234567-8"
                  value={supplierForm.taxNumber}
                  onChange={(e) => setSupplierForm({ ...supplierForm, taxNumber: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <Button onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSavingSupplier}
                  className="!bg-[#ffc400] !text-black font-bold border-none"
                >
                  Save Supplier
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}