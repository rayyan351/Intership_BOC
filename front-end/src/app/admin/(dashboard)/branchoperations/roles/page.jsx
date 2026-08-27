// src/app/admin/(dashboard)/branchoperations/roles/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag } from 'antd';
import {
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { usePermission } from '@/hooks/usePermission';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import TableActions from '@/app/admin/_components/table/TableActions';
import PermissionMatrixTable from './_components/PermissionMatrixTable';
import { useToast } from '@/utils/toast';
import {
  useGetRolesAndModulesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from '@/services/roleApi';

const roleSchema = yup.object().shape({
  name: yup.string().required('Role name is required'),
  description: yup.string().optional(),
});

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
  const [permissions, setPermissions] = useState([]);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleStartCreate = () => {
    setSelectedRoleId(null);
    reset({ name: '', description: '' });
    setPermissions([]);
    setViewMode('form');
  };

  const handleStartEdit = (role) => {
    setSelectedRoleId(role._id);
    reset({
      name: role.name || '',
      description: role.description || '',
    });
    setPermissions(role.permissions || []);
    setViewMode('form');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedRoleId(null);
  };

  const handleSaveForm = async (values) => {
    try {
      const payload = {
        ...values,
        permissions,
      };

      if (selectedRoleId) {
        await updateRole({ id: selectedRoleId, ...payload }).unwrap();
        showSuccess('Role updated successfully');
      } else {
        await createRole(payload).unwrap();
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
      width: '28%',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-900 text-sm">{text}</span>
          {record.isSystem && (
            <span className="text-[10px] font-bold uppercase bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
              System
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '38%',
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
            {perms?.length || 0} capabilities
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
            <Tag color="default" className="text-[10px] font-bold text-neutral-400 border-none">
              View Only
            </Tag>
          );
        }

        return (
          <TableActions
            canEdit={canEdit}
            canDelete={canDelete && !record.isSystem}
            onEdit={() => handleStartEdit(record)}
            onDelete={() => handleDeleteRole(record._id)}
            deleteTitle="Delete Role Template?"
            deleteDescription={`Permanently remove "${record.name}"? Staff using this template may lose assigned defaults.`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title={viewMode === 'form' ? (selectedRoleId ? 'Edit Role' : 'Create Role') : 'Roles & Permissions'}
        subTitle={
          viewMode === 'form'
            ? 'Define role parameters and configure base module access'
            : 'Manage team role blueprints and operational capabilities'
        }
        onAdd={viewMode === 'list' && canAdd ? handleStartCreate : null}
        addText="Create New Role"
      >
        {viewMode === 'form' ? (
          <form onSubmit={handleSubmit(handleSaveForm)} className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition cursor-pointer shrink-0"
                >
                  <ArrowLeftOutlined className="text-xs" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 m-0 tracking-tight">
                    {selectedRoleId ? 'Edit Role Blueprint' : 'New Role Blueprint'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400 font-normal">
                      Configure base privileges for this role
                    </span>
                    <span className="w-1 h-1 rounded-full bg-neutral-300" />
                    <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {permissions.length} capabilities active
                    </span>
                  </div>
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

            {/* Inputs Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                name="name"
                label="Role Name"
                placeholder="e.g. Branch Manager, Kitchen Staff"
                control={control}
              />

              <FormInput
                name="description"
                label="Role Description"
                placeholder="e.g. Handles kitchen prep and order management"
                control={control}
              />
            </div>

            {/* Matrix Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <div>
                  <span className="text-sm font-semibold text-neutral-900 tracking-tight block">
                    Default Capabilities Blueprint
                  </span>
                  <span className="text-xs text-neutral-400 font-normal">
                    Users assigned to this role inherit these permissions by default
                  </span>
                </div>
                <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                  {permissions.length} selected
                </span>
              </div>

              <PermissionMatrixTable
                value={permissions}
                onChange={(updatedPermissions) => setPermissions(updatedPermissions)}
              />
            </div>
          </form>
        ) : (
          <div className="overflow-hidden">
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