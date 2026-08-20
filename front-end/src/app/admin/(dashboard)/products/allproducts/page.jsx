// src/app/admin/(dashboard)/products/allproducts/page.jsx
'use client';

import React, { useState } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Table, Button, Tag, Space, Image, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import MenuItemModal from './_components/menuItemModal';
import ConfirmModal from '../../../_components/modal/ConfirmModal';
import CustomSwitch from '../../../_components/formElements/switch/CustomSwitch';
import RecipeBuilderModal from './_components/recipeBuilderModal';
import PageLayout from '../../../_components/layout/PageLayout';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleAvailabilityMutation,
} from '@/services/productApi';

export default function ProductsPage() {
  const [toggleAvailability] = useToggleAvailabilityMutation();
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { hasPermission } = usePermission();

  const canAdd = hasPermission('products:create');
  const canEdit = hasPermission('products:edit');
  const canDelete = hasPermission('products:delete');
  const canToggleStock = hasPermission('products:toggle_stock');
  const canManageRecipe =
    hasPermission('recipes:view') ||
    hasPermission('recipes:edit') ||
    hasPermission('recipes:create') ||
    hasPermission('products:edit');

  // States for Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // States for Recipe Builder Modal
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [activeProductForRecipe, setActiveProductForRecipe] = useState(null);

  // RTK Query Hooks
  const { data: products = [], isLoading: loading } = useGetProductsQuery();
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

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

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete._id).unwrap();
      showSuccess('Product deleted successfully!');
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
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

      showSuccess(`"${record.name}" ${isChecked ? 'is now visible on site' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEditModal = (record) => {
    setSelectedProduct(record);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (record) => {
    setProductToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleOpenRecipeModal = (record) => {
    setActiveProductForRecipe(record);
    setRecipeModalOpen(true);
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
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (imgSrc) => (
        <Image
          src={imgSrc || '/placeholder.png'}
          alt="product"
          width={45}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder.png"
        />
      ),
    },
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-bold text-gray-900">{text}</span>,
    },
    {
      title: 'Categories',
      dataIndex: 'categories',
      key: 'categories',
      render: (cats) => (
        <Space size={[0, 4]} wrap>
          {cats?.map((cat) => (
            <Tag color="volcano" key={cat}>{cat}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Price (Rs)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className="font-medium text-gray-800">Rs {price}</span>,
    },
    {
      title: 'Entry Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr) => (
        <span className="text-gray-500 text-xs">
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
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      render: (isShown, record) => (
        <Space size="small">
          <CustomSwitch
            checked={record.isShown ?? true}
            disabled={!canToggleStock}
            loading={updatingId === record._id}
            onChange={(checked) => handleVisibilityToggle(record, checked)}
          />
          <span className="text-xs font-semibold text-gray-600">
            {record.isShown ? 'Shown' : 'Hidden'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => {
        if (!canEdit && !canDelete && !canManageRecipe) {
          return (
            <Tag color="default" className="text-[10px] uppercase font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <Space size="small">
            {canManageRecipe && (
              <Tooltip title="Configure Recipe & Bill of Materials (BOM)">
                <Button
                  size="small"
                  icon={<CalculatorOutlined className="text-amber-600" />}
                  onClick={() => handleOpenRecipeModal(record)}
                  className="!text-xs font-bold border-amber-300 bg-amber-50/50 hover:!bg-amber-100/60 hover:!border-amber-400 text-amber-900"
                >
                  BOM
                </Button>
              </Tooltip>
            )}

            {canEdit && (
              <Tooltip title="Edit Product Details">
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined className="text-gray-600" />}
                  onClick={() => handleOpenEditModal(record)}
                />
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Delete Product">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleOpenDeleteModal(record)}
                />
              </Tooltip>
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
        title="Products"
        subTitle="Manage restaurant menu items, pricing, and recipe configurations"
        onAdd={
          canAdd
            ? () => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Add new item"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search items or categories..."
      >
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8, responsive: true }}
          scroll={{ x: 'max-content' }}
          bordered={false}
        />

        {/* Add / Edit Product Modal */}
        <MenuItemModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSaveProduct}
          loading={isCreating || isUpdating}
          initialValues={selectedProduct}
        />

        {/* Recipe & Bill of Materials (BOM) Builder Modal */}
        <RecipeBuilderModal
          open={recipeModalOpen}
          onClose={() => {
            setRecipeModalOpen(false);
            setActiveProductForRecipe(null);
          }}
          product={activeProductForRecipe}
        />

        {/* Custom Confirm Delete Modal */}
        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={handleDeleteProduct}
          title="Delete Product"
          description={
            productToDelete
              ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`
              : 'Are you sure you want to delete this item?'
          }
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}