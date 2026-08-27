// src/app/admin/(dashboard)/inventory/purchase-orders/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Select, Space } from 'antd';
import {
  CheckCircleOutlined,
  InboxOutlined,
  SendOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { exportPurchaseOrderPDF } from '@/utils/exportPurchaseOrderPdf';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import ReceivePOModal from './_components/ReceivePOModal';
import CreatePOModal from './_components/CreatePOModal';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePOStatusMutation,
  useReceivePurchaseOrderMutation,
} from '@/services/purchaseOrderApi';
import { useGetSuppliersQuery, useGetInventoryItemsQuery } from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function PurchaseOrdersPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const { hasPermission } = usePermission();

  const canAdd = hasPermission('purchase_orders:create');
  const canReceive = hasPermission('purchase_orders:receive') || hasPermission('inventory:adjust');

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: purchaseOrders = [], isLoading } = useGetPurchaseOrdersQuery({
    branchId: branchFilter || undefined,
    status: statusFilter || undefined,
  });
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const [createPO, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [updateStatus] = useUpdatePOStatusMutation();
  const [receivePO, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();

  const handleCreatePOSubmit = async (formData) => {
    try {
      await createPO(formData).unwrap();
      showSuccess('Purchase order generated successfully!');
      setCreateModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to create purchase order');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      showSuccess(`Status changed to ${status}`);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update status');
    }
  };

  const handleReceiveSubmit = async (payload) => {
    try {
      await receivePO(payload).unwrap();
      showSuccess('Stock delivery accepted & Weighted Average Cost updated!');
      setReceiveModalOpen(false);
      setSelectedPO(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to receive stock');
    }
  };

  const filteredOrders = purchaseOrders.filter((po) => {
    const term = searchTerm.toLowerCase();
    return (
      po.poNumber?.toLowerCase().includes(term) ||
      po.supplier?.name?.toLowerCase().includes(term) ||
      po.branch?.name?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
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
            In transit
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

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: '18%',
      render: (poNumber, record) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">
            {poNumber}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: '20%',
      render: (supplier) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">
            {supplier?.name || 'Unassigned'}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {supplier?.phone || supplier?.paymentTerms || 'Standard vendor'}
          </span>
        </div>
      ),
    },
    {
      title: 'Destination Outlet',
      dataIndex: 'branch',
      key: 'branch',
      width: '18%',
      render: (branch) => (
        <span className="text-xs font-semibold text-neutral-800">
          {branch?.name ? `${branch.name} (${branch.city || ''})` : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Items & Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '16%',
      render: (totalAmount, record) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-900 block">
            {formatPrice(totalAmount || 0)}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {record.items?.length || 0} line items
          </span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '16%',
      render: (_, record) => {
        return (
          <div className="flex items-center justify-end gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Print/PDF button */}
            <button
              onClick={() => exportPurchaseOrderPDF(record)}
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
              title="Print Supplier Purchase Order PDF"
            >
              <PrinterOutlined className="text-xs" />
            </button>

            {record?.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange(record._id, 'ORDERED')}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer flex items-center gap-1"
              >
                <SendOutlined className="text-[10px]" /> Order
              </button>
            )}

            {canReceive &&
              (record?.status === 'ORDERED' || record?.status === 'PARTIALLY_RECEIVED') && (
                <button
                  onClick={() => {
                    setSelectedPO(record);
                    setReceiveModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg text-neutral-900 bg-[#F4C61A] hover:bg-[#e5b713] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <InboxOutlined className="text-xs" /> Receive
                </button>
              )}

            {record?.status === 'RECEIVED' && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircleOutlined /> Inward Logged
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Purchase Orders & Deliveries"
        subTitle="Manage supplier inward orders, receiving reconciliation, and Weighted Average Costing"
        onAdd={canAdd ? () => setCreateModalOpen(true) : null}
        addText="Create Purchase Order"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by PO number, supplier, or branch..."
      >
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="All Destination Outlets"
              allowClear
              value={branchFilter || undefined}
              onChange={(val) => setBranchFilter(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="All PO Statuses"
              allowClear
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ORDERED', label: 'Ordered / In Transit' },
                { value: 'PARTIALLY_RECEIVED', label: 'Partially Received' },
                { value: 'RECEIVED', label: 'Fully Received' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          {/* Table */}
          <div className="overflow-hidden">
            <Table
              columns={columns}
              dataSource={filteredOrders}
              rowKey="_id"
              loading={isLoading}
              pagination={{
                pageSize: 8,
                showTotal: (total, range) => (
                  <span className="text-xs text-neutral-400 font-normal">
                    Showing {range[0]}-{range[1]} of {total} purchase orders
                  </span>
                ),
              }}
              size="middle"
            />
          </div>
        </div>

        {/* Modal 1: Create Purchase Order */}
        <CreatePOModal
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          suppliers={suppliers}
          branches={branches}
          inventoryItems={inventoryItems}
          onSubmit={handleCreatePOSubmit}
          loading={isCreating}
        />

        {/* Modal 2: Stock Receiving & WAC Update */}
        <ReceivePOModal
          open={receiveModalOpen}
          onClose={() => {
            setReceiveModalOpen(false);
            setSelectedPO(null);
          }}
          po={selectedPO}
          onReceive={handleReceiveSubmit}
          loading={isReceiving}
        />
      </PageLayout>
    </>
  );
}