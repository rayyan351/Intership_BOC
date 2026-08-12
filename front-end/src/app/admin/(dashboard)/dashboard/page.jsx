'use client';

import React from 'react';
import { Card, Row, Col, Table, Tag } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

export default function DashboardPage() {
  const stats = [
    {
      title: 'TOTAL SALES',
      value: '$12,480',
      icon: <DollarOutlined className="text-xl text-gray-400" />,
    },
    {
      title: 'TOTAL ORDERS',
      value: '342',
      icon: <ShoppingCartOutlined className="text-xl text-gray-400" />,
    },
    {
      title: 'ACTIVE USERS',
      value: '1,204',
      icon: <UserOutlined className="text-xl text-gray-400" />,
    },
    {
      title: 'PENDING ORDERS',
      value: '8',
      icon: <ClockCircleOutlined className="text-xl text-gray-400" />,
    },
  ];

  const recentOrders = [
    {
      key: '1',
      orderId: '#ORD-9901',
      customer: 'John Doe',
      total: '$34.50',
      status: 'Delivered',
    },
    {
      key: '2',
      orderId: '#ORD-9902',
      customer: 'Sarah Smith',
      total: '$18.00',
      status: 'Preparing',
    },
    {
      key: '3',
      orderId: '#ORD-9903',
      customer: 'Ali Khan',
      total: '$42.10',
      status: 'Pending',
    },
  ];

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    { title: 'Customer', dataIndex: 'customer', key: 'customer' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color =
          status === 'Delivered'
            ? 'green'
            : status === 'Preparing'
            ? 'orange'
            : 'gold';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-900">
        Dashboard
      </h1>

      {/* Grid spacing with better responsive wrapping */}
      <Row gutter={[20, 20]}>
        {stats.map((item, idx) => (
          <Col xs={24} sm={12} lg={12} xl={6} key={idx}>
            <Card className="border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {item.value}
                  </p>
                </div>
                {item.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<span className="font-bold text-gray-900">Recent Orders</span>}
        className="border border-gray-100 shadow-sm rounded-xl"
      >
        <Table
          columns={columns}
          dataSource={recentOrders}
          pagination={false}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}