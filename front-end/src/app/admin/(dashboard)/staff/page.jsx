// src/app/admin/staff/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Tag, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import ConfirmModal from '@/app/admin/_components/modal/ConfirmModal';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import StaffModal from './_components/StaffModal';
import { useToast } from '@/utils/toast';
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from '@/services/staffApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function StaffPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: staffList = [], isLoading } = useGetStaffQuery();
  const { data: branches = [] } = useGetBranchesQuery({ all: 'true' });

  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();

  const handleSave = async (values) => {
    try {
      if (selectedStaff) {
        await updateStaff({ id: selectedStaff._id, ...values }).unwrap();
        showSuccess('Staff member updated successfully!');
      } else {
        await createStaff(values).unwrap();
        showSuccess('Staff member registered successfully!');
      }
      setIsModalOpen(false);
      setSelectedStaff(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to save staff member');
    }
  };

  const handleStatusToggle = async (record, isChecked) => {
    try {
      setUpdatingId(record._id);
      await updateStaff({ id: record._id, isActive: isChecked }).unwrap();
      showSuccess(`${record.name} is now ${isChecked ? 'active' : 'suspended'}`);
    } catch (error) {
      showError(error?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteStaff(staffToDelete._id).unwrap();
      showSuccess('Staff member deleted successfully!');
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    } catch (error) {
      showError(error?.data?.message || 'Failed to delete staff member');
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleTag = (role) => {
    switch (role) {
      case 'branch_manager':
        return <Tag color="purple">Branch Manager</Tag>;
      case 'branch_staff':
        return <Tag color="blue">Counter Staff</Tag>;
      case 'kitchen_staff':
        return <Tag color="orange">Kitchen Staff</Tag>;
      default:
        return <Tag>{role}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-[#F4C61A] text-black font-bold" icon={<UserOutlined />}>
            {r.name?.charAt(0)}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{r.name}</span>
              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                {r.employeeId || 'N/A'}
              </span>
            </div>
            <span className="text-xs text-gray-400 block">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleTag(role),
    },
    {
      title: 'Assigned Branch',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch, r) =>
        branch ? (
          <div>
            <span className="font-semibold text-gray-800 block">{branch.name}</span>
            <span className="text-xs text-gray-400 font-mono">
              {branch.city} • {branch.branchCode || r.branchCode || 'No Code'}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms) => (
        <Tag color="cyan" className="font-semibold">
          {perms?.length || 0} features active
        </Tag>
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
            loading={updatingId === record._id}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <span className="text-xs font-semibold text-gray-600">
            {record.isActive ?? true ? 'Active' : 'Suspended'}
          </span>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-gray-600" />}
            onClick={() => {
              setSelectedStaff(record);
              setIsModalOpen(true);
            }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setStaffToDelete(record);
              setIsDeleteModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Staff & Access Control"
        subTitle="Manage branch employees, credential logins, and granular permission switches"
        onAdd={() => {
          setSelectedStaff(null);
          setIsModalOpen(true);
        }}
        addText="Add Staff Member"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by name, email, EMP-ID, or branch..."
      >
        <Table
          columns={columns}
          dataSource={filteredStaff}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          bordered={false}
        />

        <StaffModal
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStaff(null);
          }}
          onSubmit={handleSave}
          loading={isCreating || isUpdating}
          initialValues={selectedStaff}
          branches={branches}
        />

        <ConfirmModal
          open={isDeleteModalOpen}
          onCancel={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Staff Member"
          description={`Are you sure you want to remove ${staffToDelete?.name} (${staffToDelete?.employeeId})?`}
          loading={isDeleting}
        />
      </PageLayout>
    </>
  );
}