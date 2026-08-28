// src/app/admin/(dashboard)/categories/_components/DealCategoriesView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import DealCategoryModal from './dealCategoryModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetDealCategoriesQuery,
  useCreateDealCategoryMutation,
  useUpdateDealCategoryMutation,
  useDeleteDealCategoryMutation,
} from '@/services/dealCategoryApi';

export default function DealCategoriesView({ searchTerm = '', createTrigger }) {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('dealcategories:edit');
  const canDelete = hasPermission('dealcategories:delete');
  const canToggleStatus = hasPermission('dealcategories:status') || hasPermission('dealcategories:toggle_stock');

  const { data: categories = [], isLoading } = useGetDealCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateDealCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateDealCategoryMutation();
  const [deleteCategory] = useDeleteDealCategoryMutation();

  // Listen for create button clicks from the top PageLayout
  useEffect(() => {
    if (createTrigger && createTrigger.startsWith('deal-category-')) {
      setSelectedCategory(null);
      setIsModalOpen(true);
    }
  }, [createTrigger]);

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

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id).unwrap();
      showSuccess('Deal category deleted successfully!');
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
      width: '35%',
      render: (text) => (
        <span className="font-semibold text-neutral-900 text-xs block">{text}</span>
      ),
    },
    {
      title: 'Category Code / Slug',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (name, r) => (
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
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
            {record.isShown ?? true ? 'Active' : 'Hidden'}
          </span>
        </div>
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
            onDelete={() => handleDelete(record._id)}
            deleteTitle="Delete Deal Category?"
            deleteDescription={`Are you sure you want to delete "${record.label}"? Deals associated with this category may need reassigning.`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredCategories}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 8,
              showTotal: (total, range) => (
                <span className="text-xs text-neutral-400 font-normal">
                  Showing {range[0]}-{range[1]} of {total} deal categories
                </span>
              ),
            }}
            size="middle"
          />
        </div>

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
      </div>
    </>
  );
}