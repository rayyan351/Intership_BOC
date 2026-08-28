// src/app/admin/(dashboard)/products/_components/AllProductsView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Table, Tag, Space } from 'antd';
import { PictureOutlined } from '@ant-design/icons';
import MenuItemModal from './menuItemModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import { formatPrice } from '@/lib/currency';
import { getImageUrl } from '@/config/site';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleAvailabilityMutation,
} from '@/services/productApi';

function ItemAvatar({ src, name }) {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = React.useMemo(() => {
    if (!src || typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (!trimmed || trimmed.includes('placeholder.png')) return '';

    return getImageUrl(trimmed);
  }, [src]);

  if (!cleanSrc || hasError) {
    return (
      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 text-slate-400 select-none">
        <PictureOutlined className="text-base text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-11 h-11 rounded-xl overflow-hidden border border-neutral-200/80 shrink-0 bg-slate-50 relative flex items-center justify-center">
      <img
        src={cleanSrc}
        alt={name || 'Item thumbnail'}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

export default function AllProductsView({ searchTerm = '', createTrigger }) {
  const [toggleAvailability] = useToggleAvailabilityMutation();
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('products:edit');
  const canDelete = hasPermission('products:delete');
  const canToggleStock = hasPermission('products:toggle_stock');

  const [updatingId, setUpdatingId] = useState(null);

  const { data: products = [], isLoading: loading } = useGetProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();

  // Listen for create button clicks from top PageLayout
  useEffect(() => {
    if (createTrigger && createTrigger.startsWith('product-')) {
      setSelectedProduct(null);
      setIsModalOpen(true);
    }
  }, [createTrigger]);

  const handleSaveProduct = async (formData) => {
    try {
      if (selectedProduct) {
        await updateProduct({ id: selectedProduct._id, formData }).unwrap();
        showSuccess('Product updated successfully!');
      } else {
        await createProduct(formData).unwrap();
        showSuccess('Product created successfully!');
      }
      setIsModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id).unwrap();
      showSuccess('Product deleted successfully!');
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete product');
    }
  };

  const handleVisibilityToggle = async (record, isChecked) => {
    if (!canToggleStock) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);

      await toggleAvailability({ id: record._id, isShown: isChecked }).unwrap();

      const elapsedTime = Date.now() - startTime;
      const minDelay = 350;
      if (elapsedTime < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsedTime));
      }

      showSuccess(`"${record.name}" ${isChecked ? 'is now visible on menu' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update visibility');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEditModal = (record) => {
    setSelectedProduct(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const filteredItems = products.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = item.name?.toLowerCase().includes(searchLower);
    const matchesCategory = item.categories?.some((cat) =>
      cat.toLowerCase().includes(searchLower)
    );
    return matchesName || matchesCategory;
  });

  const columns = [
    {
      title: 'Item',
      key: 'item',
      width: '30%',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <ItemAvatar src={r.image} name={r.name} />
          <div className="min-w-0">
            <span className="font-semibold text-neutral-900 text-xs block truncate">{r.name}</span>
            <span className="text-[11px] text-neutral-400 font-normal block truncate">
              {r.description || 'No item description'}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      width: '18%',
      render: (cats) => (
        <Space size={[0, 4]} wrap>
          {cats && cats.length > 0 ? (
            cats.map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
              >
                {cat}
              </span>
            ))
          ) : (
            <span className="text-[11px] text-neutral-400 font-normal">Unassigned</span>
          )}
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: '14%',
      render: (price) => (
        <span className="text-xs font-mono font-bold text-neutral-900">
          {formatPrice(price || 0)}
        </span>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '13%',
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
      width: '13%',
      render: (dateStr) => (
        <span className="text-neutral-500 text-xs font-normal">
          {formatRelativeTime(dateStr)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: '12%',
      render: (isShown, record) => (
        <div className="flex items-center gap-2">
          <CustomSwitch
            checked={record.isShown ?? true}
            disabled={!canToggleStock}
            loading={updatingId === record._id}
            onChange={(checked) => handleVisibilityToggle(record, checked)}
          />
          <span className={`text-[11px] font-semibold ${record.isShown ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {record.isShown ? 'Shown' : 'Hidden'}
          </span>
        </div>
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
            onEdit={() => handleOpenEditModal(record)}
            onDelete={() => handleDeleteProduct(record._id)}
            deleteTitle="Delete Menu Product?"
            deleteDescription={`Permanently delete "${record.name}"? Customer carts and menu categories will be updated.`}
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
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 8,
            responsive: true,
            showTotal: (total, range) => (
              <span className="text-xs text-neutral-400 font-normal">
                Showing {range[0]}-{range[1]} of {total} items
              </span>
            ),
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
        />

        <MenuItemModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSaveProduct}
          loading={isCreating || isUpdating}
          initialValues={selectedProduct}
        />
      </div>
    </>
  );
}