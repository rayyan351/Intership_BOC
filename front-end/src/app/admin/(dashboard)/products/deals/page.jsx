'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space, Image } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PageLayout from '../../../_components/layout/PageLayout';
import ConfirmModal from '../../../_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import DealModal from './_components/DealModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetDealsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
} from '@/services/dealApi';

export default function DealsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('deals:create');
  const canEdit = hasPermission('deals:edit');
  const canDelete = hasPermission('deals:delete');
  const canToggleStatus = hasPermission('deals:status') || hasPermission('deals:toggle_stock');

  const { data: deals = [], isLoading } = useGetDealsQuery();
  const [createDeal, { isLoading: isCreating }] = useCreateDealMutation();
  const [updateDeal, { isLoading: isUpdating }] = useUpdateDealMutation();
  const [deleteDeal, { isLoading: isDeleting }] = useDeleteDealMutation();

  const handleSaveDeal = async (formData) => {
    try {
      if (selectedDeal) {
        await updateDeal({ id: selectedDeal._id, body: formData }).unwrap();
        showSuccess('Deal updated successfully!');
      } else {
        await createDeal(formData).unwrap();
        showSuccess('Deal created successfully!');
      }
      setIsModalOpen(false);
      setSelectedDeal(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save deal');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);

      const formData = new FormData();
      formData.append('isShown', isChecked);

      await updateDeal({ id: record._id, body: formData }).unwrap();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsedTime));
      }

      showSuccess(`"${record.title}" ${isChecked ? 'is now active' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update deal status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDeal = async () => {
    if (!dealToDelete) return;
    try {
      await deleteDeal(dealToDelete._id).unwrap();
      showSuccess('Deal deleted successfully!');
      setIsDeleteModalOpen(false);
      setDealToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete deal');
    }
  };

  const filteredDeals = deals.filter((deal) =>
    deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.dealType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Deal',
      key: 'deal',
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Image
            src={record.image}
            alt={record.title}
            width={48}
            height={48}
            className="rounded-lg object-cover border border-gray-100 min-w-[48px]"
            fallback="/placeholder.png"
          />
          <div className="min-w-0">
            <span className="font-bold text-gray-900 block truncate">{record.title}</span>
            <span className="text-xs text-gray-500 line-clamp-1">{record.description}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'dealType',
      key: 'dealType',
      width: 140,
      render: (type) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: 'Inclusions & Choices',
      key: 'inclusions',
      width: 320,
      render: (_, record) => (
        <div className="space-y-1">
          {record.fixedItems?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.fixedItems.map((item, idx) => (
                <Tag key={idx} color="default" className="text-xs">
                  {item.quantity}x {item.product?.name || 'Item'}
                </Tag>
              ))}
            </div>
          )}

          {record.choiceGroups?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {record.choiceGroups.map((cg, idx) => (
                <Tag key={idx} color="purple" className="text-xs">
                  {cg.selectCount}x {cg.title} ({cg.options?.length || 0} options)
                </Tag>
              ))}
            </div>
          )}

          {!record.fixedItems?.length && !record.choiceGroups?.length && (
            <span className="text-xs text-gray-400 italic">No items linked</span>
          )}
        </div>
      ),
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 150,
      render: (_, record) => {
        const discount =
          record.originalPrice > 0
            ? Math.round(((record.originalPrice - record.dealPrice) / record.originalPrice) * 100)
            : 0;
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900">Rs. {record.dealPrice}</span>
              {discount > 0 && <Tag color="green" className="text-[10px] px-1 py-0">{discount}% OFF</Tag>}
            </div>
            {record.originalPrice > 0 && (
              <span className="text-xs text-gray-400 line-through">Rs. {record.originalPrice}</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: 120,
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
      width: 120,
      render: (dateStr) => (
        <span className="text-gray-600 text-xs font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100 whitespace-nowrap">
          {formatRelativeTime(dateStr)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 90,
      render: (_, record) => {
        if (!canEdit && !canDelete) {
          return (
            <Tag color="default" className="text-[10px] uppercase font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <Space size="small">
            {canEdit && (
              <Button
                type="text"
                icon={<EditOutlined className="text-gray-600" />}
                onClick={() => {
                  setSelectedDeal(record);
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
                  setDealToDelete(record);
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
        title="Deals & Bundles"
        subTitle="Create discounted product bundles and combo offers"
        onAdd={
          canAdd
            ? () => {
                setSelectedDeal(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Create Deal"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search deals..."
      >
        <div className="w-full overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredDeals}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            scroll={{ x: 1100 }}
            bordered={false}
          />
        </div>

        <DealModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDeal(null);
          }}
          onSubmit={handleSaveDeal}
          loading={isCreating || isUpdating}
          initialValues={selectedDeal}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteDeal}
          title="Delete Deal"
          description={`Are you sure you want to delete "${dealToDelete?.title}"?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}