// front-end/src/app/admin/locations/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import BranchModal from './_components/BranchModal';
import { useToast } from '@/utils/toast';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '@/services/branchApi';

export default function LocationsPage() {
  const {contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: branches = [], isLoading } = useGetBranchesQuery({ all: 'true' });
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch, { isLoading: isDeleting }] = useDeleteBranchMutation();

  const handleSave = async (values) => {
    try {
      if (selectedBranch) {
        await updateBranch({ id: selectedBranch._id, ...values }).unwrap();
        showSuccess('Branch updated successfully!');
      } else {
        await createBranch(values).unwrap();
        showSuccess('Branch added successfully!');
      }
      setIsModalOpen(false);
      setSelectedBranch(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save branch');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    try {
      setUpdatingId(record._id);
      await updateBranch({ id: record._id, isShown: isChecked }).unwrap();
      showSuccess(`"${record.name}" is now ${isChecked ? 'active' : 'hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!branchToDelete) return;
    try {
      await deleteBranch(branchToDelete._id).unwrap();
      showSuccess('Branch deleted successfully!');
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete branch');
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Branch / Area',
      dataIndex: 'name',
      key: 'name',
      render: (text, r) => (
        <div>
          <span className="font-bold text-gray-900 block">{text}</span>
          <span className="text-xs text-gray-400">{r.address || 'No specific address'}</span>
        </div>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (city) => (
        <Tag color={city === 'Karachi' ? 'gold' : city === 'Lahore' ? 'green' : 'blue'}>
          {city}
        </Tag>
      ),
    },
    {
      title: 'Delivery Fee',
      dataIndex: 'deliveryFee',
      key: 'deliveryFee',
      render: (fee) => <span className="font-semibold text-gray-800">Rs. {fee || 0}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      render: (isShown, record) => (
        <Space size="small">
          <CustomSwitch
            checked={record.isShown ?? true}
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className="text-xs font-semibold text-gray-600">
            {record.isShown ?? true ? 'Active' : 'Disabled'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-gray-600" />}
            onClick={() => {
              setSelectedBranch(record);
              setIsModalOpen(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setBranchToDelete(record);
              setIsDeleteModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Store Locations & Outlets"
        subTitle="Manage operational cities, branch delivery areas, and fees"
        onAdd={() => {
          setSelectedBranch(null);
          setIsModalOpen(true);
        }}
        addText="Add New Branch"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search branch or city..."
      >
        <Table
          columns={columns}
          dataSource={filteredBranches}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          bordered={false}
        />

        <BranchModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBranch(null);
          }}
          onSubmit={handleSave}
          loading={isCreating || isUpdating}
          initialValues={selectedBranch}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Store Branch"
          description={`Are you sure you want to remove "${branchToDelete?.name}"?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}