'use client';

import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tag } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import PermissionMatrixTable from './_components/PermissionMatrixTable';
import { useToast } from '@/utils/toast';
import {
  useGetRolesAndModulesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from '@/services/roleApi';

export default function RolesPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const { data, isLoading } = useGetRolesAndModulesQuery();
  const roles = data?.roles || [];

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('roles:create');
  const canEdit = hasPermission('roles:edit');
  const canDelete = hasPermission('roles:delete');

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [],
  });

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const handleStartCreate = () => {
    setSelectedRoleId(null);
    setFormData({ name: '', description: '', permissions: [] });
    setViewMode('form');
  };

  const handleStartEdit = (role) => {
    setSelectedRoleId(role._id);
    setFormData({
      name: role.name || '',
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setViewMode('form');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedRoleId(null);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Role name is required');
      return;
    }

    try {
      if (selectedRoleId) {
        await updateRole({ id: selectedRoleId, ...formData }).unwrap();
        showSuccess('Role updated successfully');
      } else {
        await createRole(formData).unwrap();
        showSuccess('Role created successfully');
      }
      setViewMode('list');
      setSelectedRoleId(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save role');
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      await deleteRole(id).unwrap();
      showSuccess('Role removed');
    } catch (err) {
      showError(err?.data?.message || 'Could not delete role');
    }
  };

  const columns = [
    {
      title: 'Role Name',
      dataIndex: 'name',
      key: 'name',
      width: '24%',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-neutral-900 text-sm">{text}</span>
          {record.isSystem && (
            <Tag color="default" className="text-[10px] uppercase font-bold border-none">
              System
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '42%',
      render: (text) => (
        <span className="text-xs text-neutral-500 font-normal">
          {text || '—'}
        </span>
      ),
    },
    {
      title: 'Active Capabilities',
      dataIndex: 'permissions',
      key: 'permissions',
      width: '20%',
      render: (perms) => (
        <div className="flex items-center gap-1.5">
          <SafetyCertificateOutlined className="text-neutral-400 text-xs" />
          <span className="text-xs font-semibold text-neutral-700">
            {perms?.length || 0} permissions
          </span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: '14%',
      render: (_, record) => {
        if (!canEdit && (!canDelete || record.isSystem)) {
          return (
            <Tag color="default" className="text-[10px] uppercase font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canEdit && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleStartEdit(record)}
                className="!text-xs font-semibold"
              >
                Edit
              </Button>
            )}

            {canDelete && !record.isSystem && (
              <Popconfirm
                title="Delete Role"
                description={`Delete "${record.name}" permanently?`}
                onConfirm={() => handleDeleteRole(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  className="!text-xs"
                />
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title={viewMode === 'form' ? (selectedRoleId ? 'Edit Role' : 'Create Role') : 'Roles & Permissions'}
        subTitle="Manage team roles and customize operational permissions"
        onAdd={viewMode === 'list' && canAdd ? handleStartCreate : null}
        addText="Create New Role"
      >
        {viewMode === 'form' ? (
          <form onSubmit={handleSaveForm} className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="w-8 h-8 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition shadow-sm"
                >
                  <ArrowLeftOutlined className="text-xs" />
                </button>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 m-0">
                    {selectedRoleId ? 'Edit Role Configuration' : 'New Role Configuration'}
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {formData.permissions.length} capabilities selected
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CustomButton variant="secondary" onClick={handleCancelForm} type="button">
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" htmlType="submit" loading={isCreating || isUpdating}>
                  {selectedRoleId ? 'Save Changes' : 'Create Role'}
                </CustomButton>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Branch Manager, Kitchen Staff"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400] transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Role Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handles kitchen prep and status flow"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400] transition"
                />
              </div>
            </div>

            {/* Self-contained matrix table */}
            <PermissionMatrixTable
              value={formData.permissions}
              onChange={(updatedPermissions) =>
                setFormData((prev) => ({ ...prev, permissions: updatedPermissions }))
              }
            />
          </form>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
            <Table
              columns={columns}
              dataSource={roles}
              rowKey="_id"
              loading={isLoading}
              pagination={false}
              size="middle"
            />
          </div>
        )}
      </PageLayout>
    </>
  );
}