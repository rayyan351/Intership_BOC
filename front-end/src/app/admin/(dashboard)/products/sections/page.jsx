'use client';

import React, { useState } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import PageLayout from '../../../_components/layout/PageLayout';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import SectionModal from './_components/SectionModal';
import { useToast } from '@/utils/toast';
import { formatRelativeTime } from '@/utils/formatDate';
import {
  useGetSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} from '@/services/sectionApi';

export default function SectionsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('sections:create');
  const canEdit = hasPermission('sections:edit');
  const canDelete = hasPermission('sections:delete');
  const canToggleStatus = hasPermission('sections:status') || hasPermission('sections:toggle_stock');

  const { data: sections = [], isLoading } = useGetSectionsQuery();
  const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();
  const [deleteSection, { isLoading: isDeleting }] = useDeleteSectionMutation();

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

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await deleteSection(sectionToDelete._id).unwrap();
      showSuccess('Section deleted successfully!');
      setIsDeleteModalOpen(false);
      setSectionToDelete(null);
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
      render: (num) => <Tag color="blue">#{num}</Tag>,
    },
    {
      title: 'Section Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <span className="font-bold text-gray-900 block">{text}</span>
          <span className="text-xs text-gray-500">{record.subtitle}</span>
        </div>
      ),
    },
    {
      title: 'Banner Preview',
      dataIndex: 'banner',
      key: 'banner',
      render: (banner) =>
        banner ? (
          <img
            src={banner.startsWith('http') ? banner : `http://localhost:5000${banner}`}
            alt="Banner"
            className="w-24 h-9 object-cover rounded border border-gray-200"
          />
        ) : (
          <span className="text-xs text-gray-400 italic">No Banner</span>
        ),
    },
    {
      title: 'Curated Items',
      key: 'items',
      render: (_, record) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          <Tag color="cyan">{record.products?.length || 0} Products</Tag>
          <Tag color="purple">{record.deals?.length || 0} Deals</Tag>
        </div>
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
                  setSelectedSection(record);
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
                  setSectionToDelete(record);
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
        title="Display Sections"
        subTitle="Manage homepage sections and curate assigned items"
        onAdd={
          canAdd
            ? () => {
                setSelectedSection(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Create Section"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search sections..."
      >
        <Table
          columns={columns}
          dataSource={filteredSections}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          bordered={false}
        />

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

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteSection}
          title="Delete Display Section"
          description={`Are you sure you want to delete "${sectionToDelete?.title}"?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}