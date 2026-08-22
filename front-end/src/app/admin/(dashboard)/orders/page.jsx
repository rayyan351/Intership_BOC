// src/app/admin/(dashboard)/orders/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Select, Button, Modal, Space, Popconfirm } from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CarOutlined,
  FireOutlined,
  CloseCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/orderApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'blue' },
  { value: 'PREPARING', label: 'Cooking / Preparing', color: 'gold' },
  { value: 'READY', label: 'Ready for Pickup', color: 'cyan' },
  { value: 'ON_THE_WAY', label: 'On The Way', color: 'orange' },
  { value: 'DELIVERED', label: 'Delivered (Completed)', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
];

export default function AdminOrdersPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: orders = [], isLoading } = useGetOrdersQuery({
    branchId: branchFilter || undefined,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

  const { data: branches = [] } = useGetBranchesQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // If marking delivered, also mark payment as PAID if it was COD
      const payload = {
        id,
        orderStatus: newStatus,
      };
      if (newStatus === 'DELIVERED') {
        payload.paymentStatus = 'PAID';
      }

      await updateStatus(payload).unwrap();
      showSuccess(`Order status updated to ${newStatus}`);

      if (selectedOrder?._id === id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newStatus,
          paymentStatus: newStatus === 'DELIVERED' ? 'PAID' : prev.paymentStatus,
        }));
      }
    } catch (err) {
      showError(err?.data?.message || 'Failed to update order status');
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
      title: 'Customer & Address',
      key: 'customer',
      width: '24%',
      render: (_, r) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{r.customer?.name}</span>
          <span className="text-[11px] text-neutral-500 font-mono block">{r.customer?.phone}</span>
          <span className="text-[10px] text-neutral-400 truncate block max-w-xs" title={r.customer?.address}>
            {r.customer?.address}
          </span>
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
      title: 'Total & Payment',
      key: 'total',
      width: '16%',
      render: (_, r) => (
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
              color={r.paymentStatus === 'PAID' ? 'green' : 'gold'}
              className="font-bold text-[9px] border-none"
            >
              {r.paymentStatus}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Live Kitchen Status',
      key: 'orderStatus',
      width: '18%',
      render: (_, r) => (
        <Select
          value={r.orderStatus}
          onChange={(val) => handleStatusUpdate(r._id, val)}
          className="w-full text-xs font-bold"
          size="small"
          options={STATUS_OPTIONS.map((st) => ({
            value: st.value,
            label: <Tag color={st.color} className="border-none font-bold text-[10px] m-0">{st.label}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '8%',
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setSelectedOrder(r)}
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Live Orders & Dispatch Feed"
        subTitle="Manage incoming kitchen orders, advance preparation stages, and complete fulfillment"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by Order ID, Customer Name, or Phone..."
      >
        {/* Filter Bar */}
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
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Orders Table */}
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

        {/* Order Details & Fast Action Modal */}
        <Modal
          open={!!selectedOrder}
          onCancel={() => setSelectedOrder(null)}
          footer={null}
          title={null}
          centered
          width={640}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {selectedOrder && (
            <div className="pt-2 pb-1">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 m-0">
                    Order {selectedOrder.orderNumber}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Outlet: {selectedOrder.branch?.name || 'Main'} • Placed:{' '}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <Tag color="blue" className="font-bold text-xs">
                  {selectedOrder.orderStatus}
                </Tag>
              </div>

              {/* Customer summary */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 mb-3 text-xs">
                <span className="font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                  Customer & Delivery Location
                </span>
                <div className="text-neutral-900 font-medium">
                  {selectedOrder.customer?.name} ({selectedOrder.customer?.phone})
                </div>
                <div className="text-neutral-500">{selectedOrder.customer?.address}</div>
                {selectedOrder.orderNotes && (
                  <div className="text-amber-700 mt-1">
                    <strong>Note:</strong> {selectedOrder.orderNotes}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items?.map((itm, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-lg border border-neutral-200 flex justify-between items-center text-xs font-mono"
                  >
                    <div>
                      <strong className="text-neutral-900 font-sans">{itm.name}</strong>
                      <span className="text-neutral-400 block">Qty: {itm.quantity}</span>
                    </div>
                    <span className="font-bold text-neutral-900">
                      {formatPrice(itm.itemTotal || itm.price * itm.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Stepper Progression Bar */}
              <div className="p-3 bg-neutral-900 text-white rounded-xl mb-4 text-xs flex justify-between items-center">
                <span>Current Stage:</span>
                <span className="font-bold text-[#ffc400] uppercase tracking-wider">
                  {selectedOrder.orderStatus}
                </span>
              </div>

              {/* Quick Action Stage Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex flex-wrap gap-2 justify-end">
                {selectedOrder.orderStatus === 'PENDING' && (
                  <Button
                    type="primary"
                    icon={<FireOutlined />}
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'PREPARING')}
                    className="!bg-amber-600 hover:!bg-amber-700 text-xs font-bold"
                  >
                    Start Cooking (PREPARING)
                  </Button>
                )}

                {selectedOrder.orderStatus === 'PREPARING' && (
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'READY')}
                    className="!bg-cyan-600 hover:!bg-cyan-700 text-xs font-bold"
                  >
                    Food Ready (READY)
                  </Button>
                )}

                {selectedOrder.orderStatus === 'READY' && (
                  <Button
                    type="primary"
                    icon={<CarOutlined />}
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'ON_THE_WAY')}
                    className="!bg-blue-600 hover:!bg-blue-700 text-xs font-bold"
                  >
                    Dispatch with Rider (ON THE WAY)
                  </Button>
                )}

                {selectedOrder.orderStatus === 'ON_THE_WAY' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleStatusUpdate(selectedOrder._id, 'DELIVERED')}
                    className="!bg-emerald-600 hover:!bg-emerald-700 text-xs font-bold"
                  >
                    Complete & Deliver Order (DELIVERED)
                  </Button>
                )}

                {selectedOrder.orderStatus !== 'CANCELLED' && selectedOrder.orderStatus !== 'DELIVERED' && (
                  <Popconfirm
                    title="Cancel Order?"
                    description="Cancelling will automatically restore raw ingredients back to inventory."
                    onConfirm={() => handleStatusUpdate(selectedOrder._id, 'CANCELLED')}
                    okText="Yes, Cancel"
                    cancelText="No"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<CloseCircleOutlined />} className="text-xs font-semibold">
                      Cancel Order
                    </Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}