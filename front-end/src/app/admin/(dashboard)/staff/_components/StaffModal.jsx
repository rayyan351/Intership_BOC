// src/app/admin/staff/_components/StaffModal.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Space, Switch, Divider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const AVAILABLE_PERMISSIONS = [
  { key: 'orders:read', label: 'View Branch Orders', desc: 'Can view live order queues and customer details' },
  { key: 'orders:create', label: 'Create POS Orders', desc: 'Can place walk-in and phone orders' },
  { key: 'orders:update_status', label: 'Update Order Status', desc: 'Can move orders to Cooking, Ready, and Dispatched' },
  { key: 'orders:cancel', label: 'Cancel Orders', desc: 'Can reject or cancel orders' },
  { key: 'pos:access', label: 'Access POS Terminal', desc: 'Can open cash register and billing terminal' },
  { key: 'inventory:toggle_availability', label: 'Toggle Item Stock', desc: 'Can mark burgers or items out-of-stock' },
  { key: 'reports:branch_view', label: 'View Branch Sales Report', desc: 'Can view daily sales summary for their branch' },
];

const ROLE_PRESETS = {
  branch_manager: [
    'orders:read',
    'orders:create',
    'orders:update_status',
    'orders:cancel',
    'pos:access',
    'inventory:toggle_availability',
    'reports:branch_view',
  ],
  branch_staff: [
    'orders:read',
    'orders:create',
    'orders:update_status',
    'pos:access',
  ],
  kitchen_staff: [
    'orders:read',
    'orders:update_status',
  ],
};

const schema = yup.object().shape({
  name: yup.string().required('Staff name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().when('$isEditing', {
    is: false,
    then: (schema) => schema.min(6, 'Min 6 characters').required('Password is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  role: yup.string().required('Role is required'),
  branch: yup.string().required('Branch assignment is required'),
});

export default function StaffModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialValues,
  branches = [],
}) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const branchOptions = branches.map((b) => ({
    label: `${b.name} (${b.city} - ${b.branchCode || 'No Code'})`,
    value: b._id,
  }));

  const roleOptions = [
    { label: 'Branch Manager', value: 'branch_manager' },
    { label: 'Counter Cashier / Staff', value: 'branch_staff' },
    { label: 'Kitchen Display Staff', value: 'kitchen_staff' },
  ];

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    context: { isEditing: !!initialValues },
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'branch_staff',
      branch: '',
    },
  });

  const currentRole = watch('role');

  // Handle role preset change
  const handleRoleChange = (newRole) => {
    setValue('role', newRole);
    if (ROLE_PRESETS[newRole]) {
      setSelectedPermissions(ROLE_PRESETS[newRole]);
    }
  };

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          email: initialValues.email || '',
          password: '',
          role: initialValues.role || 'branch_staff',
          branch: initialValues.branch?._id || initialValues.branch || '',
        });
        setSelectedPermissions(initialValues.permissions || ROLE_PRESETS[initialValues.role] || []);
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'branch_staff',
          branch: branchOptions[0]?.value || '',
        });
        setSelectedPermissions(ROLE_PRESETS.branch_staff);
      }
    }
  }, [open, initialValues, reset]);

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const onFormSubmit = (data) => {
    const payload = {
      ...data,
      permissions: selectedPermissions,
    };
    if (!payload.password) delete payload.password;
    onSubmit(payload);
  };

  return (
    <CustomModal
      title={initialValues ? `Edit Staff (${initialValues.employeeId || 'Staff'})` : 'Register New Staff Member'}
      open={open}
      onCancel={onClose}
      width={640}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            name="name"
            label="Full Name"
            placeholder="e.g. Ali Ahmed"
            control={control}
          />
          <FormInput
            name="email"
            label="Email Address"
            placeholder="e.g. ali@burgeroclock.com"
            control={control}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            name="password"
            label={initialValues ? 'New Password (leave blank to keep)' : 'Password'}
            type="password"
            placeholder="••••••••"
            control={control}
          />
          <FormSelect
            name="branch"
            label="Assigned Branch"
            placeholder="Select Branch"
            options={branchOptions}
            control={control}
          />
        </div>

        <div className="w-full">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Staff Role
          </label>
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:border-[#F4C61A]"
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <Divider className="my-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Access Control & Permissions Matrix
          </span>
        </Divider>

        {/* Permission Switches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto p-2 bg-neutral-50 rounded-xl border border-neutral-200">
          {AVAILABLE_PERMISSIONS.map((perm) => {
            const isChecked = selectedPermissions.includes(perm.key);
            return (
              <div
                key={perm.key}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-neutral-200"
              >
                <div className="flex flex-col pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900">{perm.label}</span>
                    <Tooltip title={perm.desc}>
                      <InfoCircleOutlined className="text-gray-400 text-[11px] cursor-pointer" />
                    </Tooltip>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{perm.key}</span>
                </div>
                <Switch
                  size="small"
                  checked={isChecked}
                  onChange={() => togglePermission(perm.key)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Staff Member' : 'Create Staff Member'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}