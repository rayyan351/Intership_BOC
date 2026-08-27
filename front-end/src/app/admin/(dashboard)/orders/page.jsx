// src/app/admin/(dashboard)/orders/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Select, Tooltip, Popconfirm, Space } from 'antd';
import {
  LockOutlined,
  StopOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} from '@/services/orderApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PREPARING', label: 'Cooking / Preparing' },
  { value: 'READY', label: 'Ready for Pickup' },
  { value: 'ON_THE_WAY', label: 'On The Way' },
  { value: 'DELIVERED', label: 'Delivered (Completed)' },
  { value: 'CANCELLED', label: 'Cancel Order...' },
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
  const [deleteOrder] = useDeleteOrderMutation();

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
      showSuccess(`Order updated to ${newStatus.toLowerCase().replace(/_/g, ' ')}`);
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
          <span className="text-[11px] text-neutral-400 font-normal">
            {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Customer & Items',
      key: 'customer',
      width: '28%',
      render: (_, r) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-neutral-900 text-xs">{r.customer?.name}</span>
            <span className="text-[11px] text-neutral-400 font-mono">({r.customer?.phone})</span>
          </div>
          <span className="text-[11px] text-neutral-400 truncate block max-w-xs font-normal" title={r.customer?.address}>
            {r.customer?.address || 'Pickup / Counter Order'}
          </span>
          <div className="text-xs text-neutral-700 font-medium mt-1">
            {r.items?.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      title: 'Kitchen & Transit ETA',
      dataIndex: 'branch',
      key: 'branch',
      width: '18%',
      render: (b, r) => (
        <div>
          <span className="text-xs font-semibold text-neutral-800 block">
            📍 {b?.name ? `${b.name} (${b.city})` : 'Main Outlet'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
              <ThunderboltOutlined className="text-amber-500" /> ~{r.estimatedDeliveryMinutes || 30} mins
            </span>
            {r.distanceKm && (
              <span className="text-[11px] text-neutral-400 font-mono">
                ({r.distanceKm} km)
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Bill & Payment',
      key: 'total',
      width: '16%',
      render: (_, r) => {
        const isPaid = r.paymentStatus === 'PAID';
        const isCard = r.paymentMethod === 'CARD' || r.paymentMethod === 'ONLINE';

        return (
          <div>
            <span className="font-mono font-bold text-xs text-neutral-900 block">
              {formatPrice(r.totalAmount)}
            </span>
            <div className="flex gap-1.5 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isCard ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                {isCard ? 'Card' : 'COD'}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {r.paymentStatus}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Kitchen Stage',
      key: 'orderStatus',
      width: '20%',
      render: (_, r) => {
        const isLocked = r.orderStatus === 'DELIVERED' || r.orderStatus === 'CANCELLED';

        if (isLocked) {
          const isDelivered = r.orderStatus === 'DELIVERED';
          return (
            <div className="space-y-0.5">
              <Tooltip title="This order has reached its final state and cannot be modified.">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full cursor-not-allowed ${
                    isDelivered ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <LockOutlined className="text-[10px]" />
                  {isDelivered ? 'Delivered' : 'Cancelled'}
                </span>
              </Tooltip>
              {r.cancellationReason && (
                <span className="text-[11px] text-rose-500 truncate block max-w-[180px] font-normal" title={r.cancellationReason}>
                  {r.cancellationReason}
                </span>
              )}
            </div>
          );
        }

        return (
          <Select
            value={r.orderStatus}
            onChange={(val) => handleStatusChange(r._id, val)}
            className="w-full h-8 staff-modern-select"
            options={STATUS_OPTIONS.map((st) => ({
              value: st.value,
              label: <span className="text-xs font-semibold">{st.label}</span>,
            }))}
          />
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      width: '6%',
      align: 'right',
      render: (_, r) => (
        <Popconfirm
          title={<span className="font-bold text-xs text-neutral-900">Delete Order?</span>}
          description={<span className="text-[11px] text-neutral-500 max-w-[200px] block">Permanently deletes this order and reconciles all linked kitchen inventory.</span>}
          icon={<QuestionCircleOutlined className="text-rose-500" />}
          onConfirm={() => handleDeleteOrder(r._id)}
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, size: 'small', className: '!text-xs !font-bold !rounded-lg' }}
          cancelButtonProps={{ size: 'small', className: '!text-xs !rounded-lg' }}
        >
          <button
            type="button"
            className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition cursor-pointer"
          >
            <DeleteOutlined className="text-xs" />
          </button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Live Orders & Kitchen Feed"
        subTitle="Manage incoming kitchen orders, inspect dynamic transit metrics, advance delivery stages, and handle cancellations"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by Order ID, Customer Name, or Phone..."
      >
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Quick Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="All Kitchen Outlets"
              allowClear
              value={branchFilter || undefined}
              onChange={(val) => setBranchFilter(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
            <Select
              className="w-full h-10 staff-modern-select"
              placeholder="All Order Stages"
              allowClear
              value={statusFilter || undefined}
              onChange={(val) => setStatusFilter(val || '')}
              options={STATUS_OPTIONS.map((st) => ({
                value: st.value,
                label: st.label,
              }))}
            />
          </div>

          {/* Orders Feed Table */}
          <div className="overflow-hidden">
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="_id"
              loading={isLoading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => (
                  <span className="text-xs text-neutral-400 font-normal">
                    Showing {range[0]}-{range[1]} of {total} live orders
                  </span>
                ),
              }}
              size="middle"
            />
          </div>
        </div>

        {/* Cancellation Modal */}
        <CustomModal
          open={Boolean(cancelModalOrder)}
          onCancel={() => setCancelModalOrder(null)}
          title={`Cancel Order #${cancelModalOrder?.orderNumber || ''}`}
          width={480}
        >
          {cancelModalOrder && (
            <div className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 flex items-start gap-2.5">
                <StopOutlined className="text-rose-500 text-sm mt-0.5 shrink-0" />
                <p className="text-xs text-rose-800 m-0 leading-relaxed font-normal">
                  Cancelling will restore recipe ingredient inventory to the branch kitchen and immediately update the customer&apos;s live tracking screen.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Standard Cancellation Reason
                </label>
                <Select
                  className="w-full h-10 staff-modern-select"
                  value={selectedReason}
                  onChange={(val) => {
                    setSelectedReason(val);
                    setCustomReasonText('');
                  }}
                  options={PRESET_CANCEL_REASONS.map((r) => ({ value: r, label: r }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Custom Reason Message for Customer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Severe downpour in your sector; rider dispatch temporarily suspended."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-neutral-200 bg-white text-xs font-normal text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                />
              </div>

              <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
                <Space size="middle">
                  <CustomButton variant="secondary" type="button" onClick={() => setCancelModalOrder(null)}>
                    Keep Order
                  </CustomButton>
                  <CustomButton
                    variant="danger"
                    type="button"
                    loading={isUpdating}
                    onClick={handleConfirmCancellation}
                  >
                    Confirm Cancellation
                  </CustomButton>
                </Space>
              </div>
            </div>
          )}
        </CustomModal>
      </PageLayout>
    </>
  );
}