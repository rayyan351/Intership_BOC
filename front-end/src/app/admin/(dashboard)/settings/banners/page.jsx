'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Image, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import BannerModal from './_components/bannerModal';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useToggleBannerStatusMutation,
} from '@/services/bannerApi';

export default function AdminBannersPage() {
  const { contextHolder, showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('banners:create');
  const canEdit = hasPermission('banners:edit');
  const canDelete = hasPermission('banners:delete');
  const canToggleStatus = hasPermission('banners:status') || hasPermission('banners:toggle_stock');

  const { data: banners = [], isLoading: loading } = useGetBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();
  const [toggleStatus] = useToggleBannerStatusMutation();

  const handleSaveBanner = async (formData) => {
    try {
      if (selectedBanner) {
        await updateBanner({ id: selectedBanner._id, formData }).unwrap();
        showSuccess('Banner updated successfully!');
      } else {
        await createBanner(formData).unwrap();
        showSuccess('Banner created successfully!');
      }
      setIsModalOpen(false);
      setSelectedBanner(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save banner');
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteBanner(bannerToDelete._id).unwrap();
      showSuccess('Banner deleted successfully!');
      setIsDeleteModalOpen(false);
      setBannerToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete banner');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);
      await toggleStatus({ id: record._id, isActive: isChecked }).unwrap();

      const elapsedTime = Date.now() - startTime;
      const minDelay = 350;
      if (elapsedTime < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsedTime));
      }

      showSuccess(`"${record.title}" ${isChecked ? 'is now active' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update banner status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenEditModal = (record) => {
    setSelectedBanner(record);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (record) => {
    setBannerToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBanner(null);
  };

  const filteredBanners = banners.filter((b) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      b.title?.toLowerCase().includes(searchLower) ||
      b.eyebrow?.toLowerCase().includes(searchLower) ||
      b.link?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Preview',
      dataIndex: 'desktopImage',
      key: 'desktopImage',
      render: (imgSrc, record) => (
        <Image
          src={imgSrc || record.image || '/placeholder.png'}
          alt="banner preview"
          width={80}
          height={45}
          className="rounded-lg object-cover"
          fallback="/placeholder.png"
        />
      ),
    },
    {
      title: 'Banner Headline',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          {record.eyebrow && (
            <span className="text-[10px] font-black text-amber-600 block uppercase tracking-wider">
              {record.eyebrow}
            </span>
          )}
          <span className="font-bold text-gray-900 text-sm">{text}</span>
        </div>
      ),
    },
    {
      title: 'Target Link & CTA',
      key: 'cta',
      render: (_, record) =>
        record.link ? (
          <Space orientation="vertical" size={2}>
            <span className="text-xs font-semibold text-gray-800">{record.link}</span>
            {record.ctaText && <Tag color="gold">{record.ctaText}</Tag>}
          </Space>
        ) : (
          <span className="text-gray-400 text-xs italic">No CTA attached</span>
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
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive, record) => (
        <Space size="small">
          <CustomSwitch
            checked={record.isActive ?? true}
            disabled={!canToggleStatus}
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className="text-xs font-semibold text-gray-600">
            {record.isActive ? 'Active' : 'Hidden'}
          </span>
        </Space>
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
                onClick={() => handleOpenEditModal(record)}
              />
            )}
            {canDelete && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleOpenDeleteModal(record)}
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
        title="Hero Slider Banners"
        subTitle="Manage dynamic hero carousel banners and promotional links on the storefront"
        onAdd={
          canAdd
            ? () => {
                setSelectedBanner(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Add New Banner"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search banners by title or link..."
      >
        <Table
          columns={columns}
          dataSource={filteredBanners}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8, responsive: true }}
          scroll={{ x: 'max-content' }}
          bordered={false}
        />

        <BannerModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSaveBanner}
          loading={isCreating || isUpdating}
          initialValues={selectedBanner}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setBannerToDelete(null);
          }}
          onConfirm={handleDeleteBanner}
          title="Delete Hero Banner"
          description={
            bannerToDelete
              ? `Are you sure you want to delete "${bannerToDelete.title}"? This slide will be permanently removed from the hero carousel.`
              : 'Are you sure you want to delete this banner?'
          }
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}