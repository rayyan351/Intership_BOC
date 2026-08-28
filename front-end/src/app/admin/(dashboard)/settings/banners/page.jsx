// src/app/admin/banners/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Image } from 'antd';
import { usePermission } from '@/hooks/usePermission';

import BannerModal from './_components/bannerModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import { getImageUrl } from '@/config/site';
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
  const [deleteBanner] = useDeleteBannerMutation();
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

  const handleDeleteBanner = async (id) => {
    try {
      await deleteBanner(id).unwrap();
      showSuccess('Banner deleted successfully!');
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
      width: '14%',
      render: (imgSrc, record) => {
        const bannerImg = getImageUrl(imgSrc || record.image || '');
        return (
          <Image
            src={bannerImg}
            alt="banner preview"
            width={84}
            height={42}
            className="rounded-xl object-cover border border-neutral-100 shrink-0"
            fallback="/placeholder.png"
            preview={false}
          />
        );
      },
    },
    {
      title: 'Banner Headline',
      dataIndex: 'title',
      key: 'title',
      width: '32%',
      render: (text, record) => (
        <div>
          {record.eyebrow && (
            <span className="text-[10px] font-bold text-amber-700 block tracking-tight">
              {record.eyebrow}
            </span>
          )}
          <span className="font-semibold text-neutral-900 text-xs block">{text}</span>
        </div>
      ),
    },
    {
      title: 'Target Link & CTA',
      key: 'cta',
      width: '24%',
      render: (_, record) =>
        record.link ? (
          <div>
            <span className="text-xs font-semibold text-neutral-800 block">{record.link}</span>
            {record.ctaText && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 inline-block mt-1">
                {record.ctaText}
              </span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400 text-xs font-normal">No CTA attached</span>
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
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: '12%',
      render: (isActive, record) => (
        <div className="flex items-center gap-2">
          <CustomSwitch
            checked={record.isActive ?? true}
            disabled={!canToggleStatus}
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className={`text-[11px] font-semibold ${record.isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {record.isActive ? 'Active' : 'Hidden'}
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
            onDelete={() => handleDeleteBanner(record._id)}
            deleteTitle="Delete Hero Banner?"
            deleteDescription={`Are you sure you want to delete "${record.title}"? This slide will be permanently removed from the storefront hero carousel.`}
          />
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
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="overflow-hidden">
            <Table
              columns={columns}
              dataSource={filteredBanners}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 8,
                responsive: true,
                showTotal: (total, range) => (
                  <span className="text-xs text-neutral-400 font-normal">
                    Showing {range[0]}-{range[1]} of {total} banners
                  </span>
                ),
              }}
              scroll={{ x: 'max-content' }}
              size="middle"
            />
          </div>

          <BannerModal
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleSaveBanner}
            loading={isCreating || isUpdating}
            initialValues={selectedBanner}
          />
        </div>
      </PageLayout>
    </>
  );
}