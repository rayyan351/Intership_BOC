// src/app/admin/(dashboard)/branchoperations/locations/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import TableActions from '@/app/admin/_components/table/TableActions';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import BranchModal from './_components/BranchModal';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';
import {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '@/services/branchApi';

export default function LocationsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('locations:create');
  const canEdit = hasPermission('locations:edit');
  const canDelete = hasPermission('locations:delete');
  const canToggleStatus = hasPermission('locations:status') || hasPermission('locations:toggle_stock');

  const { data: branches = [], isLoading } = useGetBranchesQuery({ all: 'true' });
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  const handleSave = async (values) => {
    try {
      if (selectedBranch) {
        await updateBranch({ id: selectedBranch._id, ...values }).unwrap();
        showSuccess('Branch outlet updated successfully!');
      } else {
        await createBranch(values).unwrap();
        showSuccess('New branch outlet created successfully!');
      }
      setIsModalOpen(false);
      setSelectedBranch(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save branch outlet');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    if (!canToggleStatus) return;
    try {
      setUpdatingId(record._id);
      await updateBranch({ id: record._id, isShown: isChecked }).unwrap();
      showSuccess(`"${record.name}" is now ${isChecked ? 'active' : 'hidden'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update branch status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBranch(id).unwrap();
      showSuccess('Branch outlet deleted successfully!');
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete branch outlet');
    }
  };

  const filteredBranches = branches.filter(
    (b) =>
      b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Branch Outlet',
      dataIndex: 'name',
      key: 'name',
      width: '28%',
      render: (text, r) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm">{text}</span>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
              {r.branchCode || 'HQ-001'}
            </span>
          </div>
          <span className="text-xs text-neutral-400 block mt-0.5 font-normal">
            {r.address || 'No physical address specified'}
          </span>
        </div>
      ),
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: '14%',
      render: (city) => (
        <Tag
          color={city === 'Karachi' ? 'gold' : city === 'Lahore' ? 'green' : 'blue'}
          className="border-none font-semibold text-[11px] px-2.5 py-0.5 rounded-full"
        >
          {city}
        </Tag>
      ),
    },
    {
      title: 'Coordinates & Geo-Radius',
      key: 'coords',
      width: '24%',
      render: (_, r) => (
        r.latitude && r.longitude ? (
          <a
            href={r.googleMapsUrl || `https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline font-mono inline-flex items-center gap-1.5"
          >
            <EnvironmentOutlined className="text-neutral-400 text-xs" />
            <span>{r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}</span>
            <span className="text-[11px] font-sans font-semibold text-neutral-400">({r.deliveryRadiusKm || 8} km radius)</span>
          </a>
        ) : (
          <span className="text-xs text-neutral-400 font-normal">No GPS coordinates set</span>
        )
      ),
    },
    {
      title: 'Base Delivery Fee',
      dataIndex: 'deliveryFee',
      key: 'deliveryFee',
      width: '14%',
      render: (fee) => (
        <span className="text-xs font-semibold text-neutral-800">
          {fee ? formatPrice(fee) : 'Free'}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isShown',
      key: 'isShown',
      width: '10%',
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
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '10%',
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
              setSelectedBranch(record);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDelete(record._id)}
            deleteTitle="Delete Store Branch?"
            deleteDescription={`Are you sure you want to remove "${record.name}"? Orders routing to this outlet may be disrupted.`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Store Locations & Outlets"
        subTitle="Manage operational cities, branch kitchen coordinates, and delivery dispatch radius"
        onAdd={
          canAdd
            ? () => {
                setSelectedBranch(null);
                setIsModalOpen(true);
              }
            : null
        }
        addText="Add New Branch"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by outlet name, code, or city..."
      >
        <div className="overflow-hidden">
          <Table
            columns={columns}
            dataSource={filteredBranches}
            rowKey="_id"
            loading={isLoading}
            pagination={{
              pageSize: 8,
              showTotal: (total, range) => (
                <span className="text-xs text-neutral-400 font-normal">
                  Showing {range[0]}-{range[1]} of {total} branch locations
                </span>
              ),
            }}
            size="middle"
          />
        </div>

        <BranchModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedBranch(null);
          }}
          onSubmit={handleSave}
          loading={isCreating || isUpdating}
          initialValues={selectedBranch}
          existingBranches={branches}
        />
      </PageLayout>
    </>
  );
}