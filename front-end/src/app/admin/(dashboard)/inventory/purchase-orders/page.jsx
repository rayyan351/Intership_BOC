// front-end/src/app/admin/(dashboard)/inventory/purchase-orders/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { CheckCircleOutlined, InboxOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import ReceivePOModal from './_components/ReceivePOModal';
import CreatePOModal from './_components/CreatePOModal';
import { useToast } from '@/utils/toast';

import {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
} from '@/services/purchaseOrderApi';
import { useGetSuppliersQuery, useGetInventoryItemsQuery } from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function PurchaseOrdersPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const { hasPermission } = usePermission();

  const canAdd = hasPermission('purchase_orders:create');
  const canReceive = hasPermission('purchase_orders:receive') || hasPermission('inventory:adjust');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // RTK Query endpoints
  const { data: purchaseOrders = [], isLoading } = useGetPurchaseOrdersQuery();
  const { data: suppliers = [] } = useGetSuppliersQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const [createPO, { isLoading: isCreating }] = useCreatePurchaseOrderMutation();
  const [receivePO, { isLoading: isReceiving }] = useReceivePurchaseOrderMutation();

  const handleCreatePOSubmit = async (formData) => {
    try {
      await createPO(formData).unwrap();
      showSuccess('Purchase Order generated successfully!');
      setCreateModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to create purchase order');
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

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: '18%',
      render: (poNumber, record) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-sm block">
            {poNumber}
          </span>
          <span className="text-[11px] text-neutral-400">
            Created: {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}
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
          <span className="font-bold text-neutral-800 text-xs block">
            {supplier?.name || 'Unassigned'}
          </span>
          <span className="text-[11px] text-neutral-500">
            {supplier?.phone || supplier?.paymentTerms || ''}
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
        <span className="text-xs font-semibold text-neutral-700">
          {branch?.name ? `${branch.name} (${branch.city || ''})` : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Items & Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '18%',
      render: (totalAmount, record) => (
        <div>
          <span className="font-mono font-bold text-sm text-neutral-900 block">
            Rs. {Number(totalAmount || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500">
            {record.items?.length || 0} line items
          </span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '14%',
      render: (status) => {
        const currentStatus = typeof status === 'string' ? status : 'ORDERED';
        if (currentStatus === 'RECEIVED') {
          return (
            <Tag color="success" className="font-bold text-[10px] border-none">
              RECEIVED
            </Tag>
          );
        }
        if (currentStatus === 'ORDERED') {
          return (
            <Tag color="processing" className="font-bold text-[10px] border-none">
              IN TRANSIT
            </Tag>
          );
        }
        return (
          <Tag color="default" className="font-bold text-[10px] border-none">
            {currentStatus}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '12%',
      render: (_, record) => {
        if (record?.status === 'RECEIVED') {
          return (
            <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
              <CheckCircleOutlined /> Inward Logged
            </span>
          );
        }

        return (
          canReceive && (
            <Button
              size="small"
              type="primary"
              icon={<InboxOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setReceiveModalOpen(true);
              }}
              className="!text-xs font-bold !bg-neutral-900 hover:!bg-neutral-800"
            >
              Receive Stock
            </Button>
          )
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
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={filteredOrders}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            size="middle"
          />
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