// src/app/admin/(dashboard)/categories/_components/DealCategoriesView.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Tag, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import DealCategoryModal from '@/app/admin/(dashboard)/products/categories/_components/dealCategoryModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetDealCategoriesQuery,
  useCreateDealCategoryMutation,
  useUpdateDealCategoryMutation,
  useDeleteDealCategoryMutation,
} from '@/services/dealCategoryApi';

export default function DealCategoriesView() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('dealcategories:create');
  const canEdit = hasPermission('dealcategories:edit');
  const canDelete = hasPermission('dealcategories:delete');
  const canToggleStatus = hasPermission('dealcategories:status') || hasPermission('dealcategories:toggle_stock');

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
    if (!canToggleStatus) return;
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
            disabled={!canToggleStatus}
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
      render: (_, record) => {
        if (!canEdit && !canDelete) {
          return (
            <Tag color="default" className="text-[10px] uppercase font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }
        return (
          <Space size="middle">
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined className="text-gray-600" />}
                onClick={() => {
                  setSelectedCategory(record);
                  setIsModalOpen(true);
                }}
              />
            )}
            {canDelete && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setCategoryToDelete(record);
                  setIsDeleteModalOpen(true);
                }}
              />
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
          <Input
            placeholder="Search deal categories..."
            prefix={<SearchOutlined className="text-neutral-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs min-h-[40px] rounded-xl"
            allowClear
          />
          {canAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedCategory(null);
                setIsModalOpen(true);
              }}
              className="bg-[#ffc400] hover:bg-[#e0b210] text-black font-bold h-10 px-5 rounded-xl border-none shadow-sm"
            >
              Create Deal Category
            </Button>
          )}
        </div>

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
      </div>
    </>
  );
}