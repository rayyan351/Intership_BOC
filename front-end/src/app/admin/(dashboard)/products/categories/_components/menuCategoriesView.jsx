// src/app/admin/(dashboard)/categories/_components/MenuCategoriesView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import CategoryModal from './categoryModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/services/categoryApi';

export default function MenuCategoriesView({ searchTerm = '', createTrigger }) {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('categories:edit');
  const canDelete = hasPermission('categories:delete');
  const canToggleStatus = hasPermission('categories:status') || hasPermission('categories:toggle_stock');

  const { data: categories = [], isLoading } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  // Listen for create button clicks from the top PageLayout
  useEffect(() => {
    if (createTrigger && createTrigger.startsWith('category-')) {
      setSelectedCategory(null);
      setIsModalOpen(true);
    }
  }, [createTrigger]);

  const handleSaveCategory = async (data) => {
    try {
      if (selectedCategory) {
        await updateCategory({ id: selectedCategory._id, formData: data }).unwrap();
        showSuccess('Category updated successfully!');
      } else {
        await createCategory(data).unwrap();
        showSuccess('Category created successfully!');
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

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id).unwrap();
      showSuccess('Category deleted successfully!');
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
      width: '32%',
      render: (text) => (
        <span className="font-semibold text-neutral-900 text-xs block">{text}</span>
      ),
    },
    {
      title: 'Category ID / Slug',
      dataIndex: 'name',
      key: 'name',
      width: '24%',
      render: (name, r) => (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
          {name || r.id || r._id}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: '18%',
      render: (isShown, record) => (
        <div className="flex items-center gap-2">
          <CustomSwitch
            checked={record.isShown ?? true}
            disabled={!canToggleStatus}
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className={`text-[11px] font-semibold ${record.isShown ?? true ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {record.isShown ?? true ? 'Active' : 'Disabled'}
          </span>
        </div>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '14%',
      render: (dateStr) => (
        <span className="text-neutral-400 text-xs font-normal">
          {dateStr ? new Date(dateStr).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: '14%',
      render: (dateStr) => (
        <span className="text-neutral-500 text-xs font-normal whitespace-nowrap">
          {formatRelativeTime(dateStr)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '8%',
      render: (_, record) => {
        if (!canEdit && !canDelete) {
          return (
            <Tag color="default" className="text-[10px] font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <TableActions
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={() => {
              setSelectedCategory(record);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDeleteCategory(record._id)}
            deleteTitle="Delete Menu Category?"
            deleteDescription={`Are you sure you want to delete "${record.label}"? Products linked to this category may need reassigning.`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 8,
            showTotal: (total, range) => (
              <span className="text-xs text-neutral-400 font-normal">
                Showing {range[0]}-{range[1]} of {total} categories
              </span>
            ),
          }}
          size="middle"
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
      </div>
    </>
  );
}