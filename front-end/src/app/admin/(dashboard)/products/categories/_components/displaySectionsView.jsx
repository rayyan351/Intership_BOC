// src/app/admin/(dashboard)/categories/_components/DisplaySectionsView.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Image } from 'antd';
import { usePermission } from '@/hooks/usePermission';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
import SectionModal from './SectionModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} from '@/services/sectionApi';

export default function DisplaySectionsView({ searchTerm = '', createTrigger }) {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { hasPermission } = usePermission();
  const canEdit = hasPermission('sections:edit');
  const canDelete = hasPermission('sections:delete');
  const canToggleStatus = hasPermission('sections:status') || hasPermission('sections:toggle_stock');

  const { data: sections = [], isLoading } = useGetSectionsQuery();
  const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteSectionMutation();

  // Listen for create button clicks from the top PageLayout
  useEffect(() => {
    if (createTrigger && createTrigger.startsWith('section-')) {
      setSelectedSection(null);
      setIsModalOpen(true);
    }
  }, [createTrigger]);

  const handleSaveSection = async (formData) => {
    try {
      if (selectedSection) {
        await updateSection({ id: selectedSection._id, formData }).unwrap();
        showSuccess('Display section updated successfully!');
      } else {
        await createSection(formData).unwrap();
        showSuccess('Display section created successfully!');
      }
      setIsModalOpen(false);
      setSelectedSection(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save section');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    const startTime = Date.now();
    try {
      setUpdatingId(record._id);
      const formData = new FormData();
      formData.append('isShown', isChecked);
      await updateSection({ id: record._id, formData }).unwrap();

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 350) {
        await new Promise((resolve) => setTimeout(resolve, 350 - elapsedTime));
      }
      showSuccess(`"${record.title}" ${isChecked ? 'is now visible' : 'is now hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      await deleteSection(id).unwrap();
      showSuccess('Section deleted successfully!');
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete section');
    }
  };

  const filteredSections = sections.filter((sec) =>
    sec.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: '8%',
      render: (num) => (
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
          #{num}
        </span>
      ),
    },
    {
      title: 'Section Details',
      dataIndex: 'title',
      key: 'title',
      width: '26%',
      render: (text, record) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{text}</span>
          <span className="text-[11px] text-neutral-400 font-normal line-clamp-1">
            {record.subtitle || 'No subtitle configured'}
          </span>
        </div>
      ),
    },
    {
      title: 'Banner Artwork',
      dataIndex: 'banner',
      key: 'banner',
      width: '18%',
      render: (banner) =>
        banner ? (
          <Image
            src={banner.startsWith('http') ? banner : `http://localhost:5000${banner}`}
            alt="Section Banner"
            width={96}
            height={36}
            className="rounded-lg object-cover border border-neutral-100 shrink-0"
            fallback="/placeholder.png"
            preview={false}
          />
        ) : (
          <span className="text-xs text-neutral-400 font-normal">No banner</span>
        ),
    },
    {
      title: 'Curated Items',
      key: 'items',
      width: '20%',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
            {record.products?.length || 0} Products
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">
            {record.deals?.length || 0} Deals
          </span>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: '14%',
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
              setSelectedSection(record);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDeleteSection(record._id)}
            deleteTitle="Delete Display Section?"
            deleteDescription={`Are you sure you want to delete "${record.title}"? Curated layout ordering on the storefront will update.`}
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
            dataSource={filteredSections}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 8,
              showTotal: (total, range) => (
                <span className="text-xs text-neutral-400 font-normal">
                  Showing {range[0]}-{range[1]} of {total} display sections
                </span>
              ),
            }}
            size="middle"
          />
        </div>

        <SectionModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSection(null);
          }}
          onSubmit={handleSaveSection}
          loading={isCreating || isUpdating}
          initialValues={selectedSection}
        />
      </div>
    </>
  );
}