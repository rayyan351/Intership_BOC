// src/app/admin/(dashboard)/inventory/suppliers/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import SupplierModal from './_components/SupplierModal';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import { useToast } from '@/utils/toast';

import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from '@/services/inventoryApi';

export default function SuppliersPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const { hasPermission } = usePermission();

  const canAdd = hasPermission('suppliers:create') || hasPermission('inventory:create');
  const canEdit = hasPermission('suppliers:edit') || hasPermission('inventory:edit');
  const canDelete = hasPermission('suppliers:delete') || hasPermission('inventory:delete');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: suppliers = [], isLoading } = useGetSuppliersQuery();
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();

  const handleSaveSupplier = async (formData) => {
    try {
      if (selectedSupplier) {
        await updateSupplier({ id: selectedSupplier._id, ...formData }).unwrap();
        showSuccess('Supplier updated successfully');
      } else {
        await createSupplier(formData).unwrap();
        showSuccess('New supplier registered successfully');
      }
      setIsModalOpen(false);
      setSelectedSupplier(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save supplier');
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await deleteSupplier(supplierToDelete._id).unwrap();
      showSuccess('Supplier removed successfully');
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to remove supplier');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.contactPerson?.toLowerCase().includes(term) ||
      s.phone?.includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: 'Company / Business',
      key: 'name',
      width: '26%',
      render: (_, record) => (
        <div>
          <span className="font-bold text-neutral-900 text-sm block">{record.name}</span>
          <span className="text-xs text-neutral-500">
            Contact: <strong className="text-neutral-700">{record.contactPerson || 'N/A'}</strong>
          </span>
        </div>
      ),
    },
    {
      title: 'Contact Details',
      key: 'contact',
      width: '24%',
      render: (_, record) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 font-mono text-neutral-800">
            <PhoneOutlined className="text-neutral-400" /> {record.phone}
          </div>
          {record.email && (
            <div className="flex items-center gap-1.5 text-neutral-500">
              <MailOutlined className="text-neutral-400" /> {record.email}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTerms',
      key: 'paymentTerms',
      width: '18%',
      render: (terms) => {
        const colors = {
          COD: 'orange',
          NET_7: 'blue',
          NET_15: 'cyan',
          NET_30: 'purple',
          PREPAID: 'green',
        };
        return (
          <Tag color={colors[terms] || 'default'} className="font-bold text-xs border-none">
            {terms?.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'NTN / Tax ID',
      dataIndex: 'taxNumber',
      key: 'taxNumber',
      width: '18%',
      render: (tax) => (
        <span className="text-xs font-mono font-semibold text-neutral-600">
          {tax || 'Unregistered'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '14%',
      render: (_, record) => (
        <Space size="small">
          {canEdit && (
            <Tooltip title="Edit Supplier Details">
              <Button
                size="small"
                type="text"
                icon={<EditOutlined className="text-gray-600" />}
                onClick={() => {
                  setSelectedSupplier(record);
                  setIsModalOpen(true);
                }}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="Delete Supplier">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setSupplierToDelete(record);
                  setIsDeleteModalOpen(true);
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Vendors & Suppliers"
        subTitle="Manage supplier directory, commercial payment terms, and vendor contacts"
        onAdd={
          canAdd
            ? () => {
                setSelectedSupplier(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Register Supplier"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by supplier name, contact, phone, or email..."
      >
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={filteredSuppliers}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            size="middle"
          />
        </div>

        <SupplierModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSupplier(null);
          }}
          initialValues={selectedSupplier}
          onSubmit={handleSaveSupplier}
          loading={isCreating || isUpdating}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSupplierToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Supplier"
          description={
            supplierToDelete
              ? `Are you sure you want to remove "${supplierToDelete.name}"?`
              : 'Are you sure you want to delete this supplier?'
          }
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}