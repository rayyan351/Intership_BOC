'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import UserModal from './_components/userModal';
import PageLayout from '../../_components/layout/PageLayout';

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([
    { key: '1', name: 'Alex Morgan', email: 'alex@burgeroclock.com', role: 'Admin', status: 'Active' },
    { key: '2', name: 'Sarah Khan', email: 'sarah@burgeroclock.com', role: 'Manager', status: 'Active' },
    { key: '3', name: 'Mike Ross', email: 'mike@burgeroclock.com', role: 'Staff', status: 'Inactive' },
  ]);

  const handleAddUser = (newValues) => {
    const newUser = { key: String(users.length + 1), ...newValues };
    setUsers((prev) => [...prev, newUser]);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'Admin' ? 'gold' : role === 'Manager' ? 'blue' : 'default'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined className="text-gray-600" />} />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <PageLayout
      title="User Management"
      subTitle="Manage admin roles and permissions"
      onAdd={() => setIsModalOpen(true)}
      addText="Add new user"
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      searchPlaceholder="Search users by name or email..."
    >
      <Table
        columns={columns}
        dataSource={filteredUsers}
        pagination={{ pageSize: 5, responsive: true }}
        scroll={{ x: 'max-content' }}
        bordered={false}
      />
      <UserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddUser}
      />
    </PageLayout>
  );
}