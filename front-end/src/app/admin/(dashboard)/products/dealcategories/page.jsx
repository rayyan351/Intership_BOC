'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import DealCategoryModal from './_components/dealCategoryModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetDealCategoriesQuery,
  useCreateDealCategoryMutation,
  useUpdateDealCategoryMutation,
  useDeleteDealCategoryMutation,
} from '@/services/dealCategoryApi';

export default function DealCategoriesPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [], isLoading } = useGetDealCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateDealCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateDealCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteDealCategoryMutation();

  const handleSave = async (formData) => {
    try {
      if (selectedCategory) {
        await updateCategory({ id: selectedCategory._id, body: formData }).unwrap();
        showSuccess('Deal category updated successfully!');
      } else {
        await createCategory(formData).unwrap();
        showSuccess('Deal category created successfully!');
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save deal category');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);
      await updateCategory({ id: record._id, body: { isShown: isChecked } }).unwrap();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsedTime));
      }
      showSuccess(`"${record.label}" ${isChecked ? 'is now active' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete._id).unwrap();
      showSuccess('Deal category deleted successfully!');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete deal category');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Deal Category Name',
      dataIndex: 'label',
      key: 'label',
      render: (text) => <span className="font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Category ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="blue">{id}</Tag>,
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
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (dateStr) => (
        <span className="text-gray-600 text-xs font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
          {formatRelativeTime(dateStr)}
        </span>
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
              setSelectedCategory(record);
              setIsModalOpen(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setCategoryToDelete(record);
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
        title="Deal Categories"
        subTitle="Manage classifications and categories for deals, combos, and bundles"
        onAdd={() => {
          setSelectedCategory(null);
          setIsModalOpen(true);
        }}
        addText="Create Deal Category"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search deal categories..."
      >
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          bordered={false}
        />

        <DealCategoryModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleSave}
          loading={isCreating || isUpdating}
          initialValues={selectedCategory}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Deal Category"
          description={`Are you sure you want to delete "${categoryToDelete?.label}"?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}