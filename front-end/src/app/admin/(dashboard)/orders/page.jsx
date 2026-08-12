'use client';

import React, { useState } from 'react';
import { Table, Tag, Button, Select, Card, Space, Modal } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const initialOrders = [
    { key: '1', id: '#ORD-9901', customer: 'John Doe', items: '2x Cheese Burger, 1x Fries', total: '$24.50', status: 'Pending', time: '10 mins ago' },
    { key: '2', id: '#ORD-9902', customer: 'Sarah Smith', items: '1x Double Smash, 1x Shake', total: '$18.00', status: 'Preparing', time: '25 mins ago' },
  ];

  const [orders, setOrders] = useState(initialOrders);

  const handleStatusChange = (key, newStatus) => {
    setOrders((prev) => prev.map((ord) => (ord.key === key ? { ...ord, status: newStatus } : ord)));
  };

  const columns = [
    { title: 'Order ID', dataIndex: 'id', key: 'id', render: (text) => <strong>{text}</strong> },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Items Summary', dataIndex: 'items', key: 'items' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Select
          value={status}
          onChange={(val) => handleStatusChange(record.key, val)}
          options={[
            { value: 'Pending', label: 'Pending' },
            { value: 'Preparing', label: 'Preparing' },
            { value: 'Delivered', label: 'Delivered' },
            { value: 'Cancelled', label: 'Cancelled' },
          ]}
          className="w-32"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<EyeOutlined />} onClick={() => setSelectedOrder(record)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">Orders Management</h1>
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <Table columns={columns} dataSource={orders} />
      </Card>

      <Modal
        title={`Order Details - ${selectedOrder?.id}`}
        open={!!selectedOrder}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
      >
        {selectedOrder && (
          <div className="space-y-3 pt-2">
            <p><strong>Customer:</strong> {selectedOrder.customer}</p>
            <p><strong>Items:</strong> {selectedOrder.items}</p>
            <p><strong>Total Amount:</strong> {selectedOrder.total}</p>
            <p><strong>Placed:</strong> {selectedOrder.time}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}