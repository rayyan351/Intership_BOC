'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PageLayout from '../../../_components/layout/PageLayout';
import ConfirmModal from '../../../_components/modal/ConfirmModal';
import CategoryModal from './_components/categoryModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/categoryApi';

export default function CategoriesPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('categories:create');
  const canEdit = hasPermission('categories:edit');
  const canDelete = hasPermission('categories:delete');
  const canToggleStatus = hasPermission('categories:status') || hasPermission('categories:toggle_stock');

  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const handleSaveCategory = async (data) => {
    try {
      if (selectedCategory) {
        await updateCategory({ id: selectedCategory._id, label: data.label }).unwrap();
        showSuccess('Category updated successfully!');
      } else {
        await createCategory(data).unwrap();
        showSuccess(`Category "${data.label}" created successfully!`);
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save category');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);
      await updateCategory({ id: record._id, isShown: isChecked }).unwrap();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsedTime));
      }

      showSuccess(`"${record.label}" ${isChecked ? 'is now enabled' : 'is now disabled'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update category status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete._id).unwrap();
      showSuccess('Category deleted successfully!');
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Category Name',
      dataIndex: 'label',
      key: 'label',
      render: (text) => <span className="font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Category ID',
      dataIndex: 'id',
      key: 'id',
      render: (slug) => <Tag color="blue">{slug}</Tag>,
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
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr) => (
        <span className="text-gray-500 text-xs font-medium">
          {dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A'}
        </span>
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
      <PageLayout
        title="Categories"
        subTitle="Manage menu sections and category status"
        onAdd={
          canAdd
            ? () => {
                setSelectedCategory(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Add Category"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search categories..."
      >
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          bordered={false}
        />

        <CategoryModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleSaveCategory}
          loading={isCreating || isUpdating}
          initialValues={selectedCategory}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteCategory}
          title="Delete Category"
          description={`Are you sure you want to delete "${categoryToDelete?.label}"?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}