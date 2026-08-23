// src/app/admin/(dashboard)/orders/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Select, Button, Modal, Tooltip, Input, Popconfirm, Space } from 'antd';
import {
  LockOutlined,
  StopOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} from '@/services/orderApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'blue' },
  { value: 'PREPARING', label: 'Cooking / Preparing', color: 'gold' },
  { value: 'READY', label: 'Ready for Pickup', color: 'cyan' },
  { value: 'ON_THE_WAY', label: 'On The Way', color: 'orange' },
  { value: 'DELIVERED', label: 'Delivered (Completed)', color: 'green' },
  { value: 'CANCELLED', label: 'Cancel Order...', color: 'red' },
];

const PRESET_CANCEL_REASONS = [
  'Item out of physical stock at outlet',
  'Delivery area blocked / Rain / Route issue',
  'Outlet closed / Kitchen maintenance',
  'Customer unreachable via phone',
  'Duplicate order placed',
];

export default function AdminOrdersPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Cancellation Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [selectedReason, setSelectedReason] = useState(PRESET_CANCEL_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState('');

  const { data: orders = [], isLoading } = useGetOrdersQuery({
    branchId: branchFilter || undefined,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const { data: branches = [] } = useGetBranchesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();
  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      const target = orders.find((o) => o._id === orderId);
      setCancelModalOrder(target);
      return;
    }

    try {
      await updateStatus({
        id: orderId,
        orderStatus: newStatus,
      }).unwrap();
      showSuccess(`Order updated to ${newStatus}`);
    } catch (err) {
      showError(err?.data?.message || 'Failed to update order status');
    }
  };

  const handleConfirmCancellation = async () => {
    if (!cancelModalOrder) return;
    const finalReason = customReasonText.trim() || selectedReason;

    try {
      await updateStatus({
        id: cancelModalOrder._id,
        orderStatus: 'CANCELLED',
        cancellationReason: finalReason,
      }).unwrap();

      showSuccess(`Order ${cancelModalOrder.orderNumber} cancelled.`);
      setCancelModalOrder(null);
      setCustomReasonText('');
    } catch (err) {
      showError(err?.data?.message || 'Failed to cancel order.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId).unwrap();
      showSuccess('Order permanently deleted and inventory reconciled.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete order.');
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: '18%',
      render: (num, r) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">{num}</span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Customer & Items',
      key: 'customer',
      width: '26%',
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-900 text-xs">{r.customer?.name}</span>
            <span className="text-[11px] text-neutral-500 font-mono">({r.customer?.phone})</span>
          </div>
          <span className="text-[10px] text-neutral-400 truncate block max-w-xs" title={r.customer?.address}>
            {r.customer?.address}
          </span>
          <div className="text-[11px] text-neutral-700 font-medium mt-1">
            {r.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      title: 'Kitchen Outlet',
      dataIndex: 'branch',
      key: 'branch',
      width: '14%',
      render: (b) => (
        <span className="text-xs font-semibold text-neutral-700">
          {b?.name ? `${b.name} (${b.city})` : 'Main Outlet'}
        </span>
      ),
    },
    {
      title: 'Bill & Payment',
      key: 'total',
      width: '16%',
      render: (_, r) => {
        const paymentColors = {
          PAID: 'green',
          PENDING: 'gold',
          REFUNDED: 'purple',
          VOID: 'default',
        };

        return (
          <div>
            <span className="font-mono font-bold text-xs text-neutral-900 block">
              {formatPrice(r.totalAmount)}
            </span>
            <div className="flex gap-1 mt-0.5">
              <Tag
                color={r.paymentMethod === 'CARD' || r.paymentMethod === 'ONLINE' ? 'purple' : 'default'}
                className="font-bold text-[9px] border-none"
              >
                {r.paymentMethod === 'CARD' || r.paymentMethod === 'ONLINE' ? 'CARD' : 'COD'}
              </Tag>
              <Tag
                color={paymentColors[r.paymentStatus] || 'default'}
                className="font-bold text-[9px] border-none"
              >
                {r.paymentStatus}
              </Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Kitchen Status',
      key: 'orderStatus',
      width: '20%',
      render: (_, r) => {
        const isLocked = r.orderStatus === 'DELIVERED' || r.orderStatus === 'CANCELLED';

        if (isLocked) {
          return (
            <div className="space-y-0.5">
              <Tooltip title="This order has reached its final state and cannot be modified.">
                <Tag
                  color={r.orderStatus === 'DELIVERED' ? 'green' : 'red'}
                  className="font-bold text-[10px] border-none flex items-center gap-1 w-fit cursor-not-allowed m-0"
                >
                  <LockOutlined className="text-[9px]" />
                  {r.orderStatus === 'DELIVERED' ? 'DELIVERED' : 'CANCELLED'}
                </Tag>
              </Tooltip>
              {r.cancellationReason && (
                <span className="text-[10px] text-rose-600 truncate block max-w-[180px]" title={r.cancellationReason}>
                  Reason: {r.cancellationReason}
                </span>
              )}
            </div>
          );
        }

        return (
          <Select
            value={r.orderStatus}
            onChange={(val) => handleStatusChange(r._id, val)}
            className="w-full text-xs font-bold"
            size="small"
            options={STATUS_OPTIONS.map((st) => ({
              value: st.value,
              label: <Tag color={st.color} className="border-none font-bold text-[10px] m-0">{st.label}</Tag>,
            }))}
          />
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: '6%',
      align: 'right',
      render: (_, r) => (
        <Popconfirm
          title="Delete Order?"
          description="Permanently removes this test order and rebalances all linked stock."
          icon={<QuestionCircleOutlined className="text-rose-500" />}
          onConfirm={() => handleDeleteOrder(r._id)}
          okText="Yes, Delete"
          cancelText="No"
          okButtonProps={{ danger: true, size: 'small' }}
          cancelButtonProps={{ size: 'small' }}
        >
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            className="hover:!bg-rose-50 rounded-lg"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Live Orders & Kitchen Feed"
        subTitle="Manage incoming kitchen orders, advance delivery stages, handle cancellations, and purge test entries"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by Order ID, Customer Name, or Phone..."
      >
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            className="w-full"
            placeholder="Filter by Kitchen Outlet"
            allowClear
            value={branchFilter || undefined}
            onChange={(val) => setBranchFilter(val || '')}
            options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
          />
          <Select
            className="w-full"
            placeholder="Filter by Order Status"
            allowClear
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || '')}
            options={STATUS_OPTIONS.filter((s) => s.value !== 'CANCELLED').concat({
              value: 'CANCELLED',
              label: 'Cancelled',
            })}
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={orders}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>

        {/* Dedicated Cancellation Reason Modal */}
        <Modal
          open={!!cancelModalOrder}
          onCancel={() => setCancelModalOrder(null)}
          footer={null}
          title={null}
          centered
          width={480}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {cancelModalOrder && (
            <div className="pt-2 pb-1">
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <StopOutlined className="text-xl" />
                <h3 className="text-base font-bold text-neutral-900 m-0">
                  Cancel Order {cancelModalOrder.orderNumber}
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                Cancelling will restore the ingredient inventory to the kitchen and update the customer&apos;s live tracking screen.
              </p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Select Standard Reason
                  </label>
                  <Select
                    className="w-full"
                    value={selectedReason}
                    onChange={(val) => {
                      setSelectedReason(val);
                      setCustomReasonText('');
                    }}
                    options={PRESET_CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Or Enter Custom Message for Customer
                  </label>
                  <Input.TextArea
                    rows={2}
                    placeholder="e.g. Extreme rain in your area; delivery paused for rider safety."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-neutral-100">
                <Button onClick={() => setCancelModalOrder(null)} className="text-xs font-semibold">
                  Keep Order
                </Button>
                <Button
                  danger
                  type="primary"
                  loading={isUpdating}
                  onClick={handleConfirmCancellation}
                  className="text-xs font-bold"
                >
                  Confirm & Cancel Order
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}