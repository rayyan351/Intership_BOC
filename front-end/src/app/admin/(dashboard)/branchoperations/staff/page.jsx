// src/app/admin/(dashboard)/branchoperations/staff/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import { Table, Tag, Popconfirm } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ShopOutlined,
  UserOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { usePermission } from '@/hooks/usePermission';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import PermissionMatrixTable from '../roles/_components/PermissionMatrixTable';
import TableActions from '@/app/admin/_components/table/TableActions';
import StaffMetricsBar from './_components/StaffMetricsBar';
import StaffFilterBar from './_components/StaffFilterBar';
import { useToast } from '@/utils/toast';

import {
  useGetStaffMembersQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from '@/services/staffApi';
import { useGetRolesAndModulesQuery } from '@/services/roleApi';
import { useGetBranchesQuery } from '@/services/branchApi';

const staffSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().optional(),
  roleId: yup.string().required('Role template assignment is required'),
  branchId: yup.string().required('Branch outlet assignment is required'),
  isActive: yup.boolean().default(true),
});

export default function StaffPage() {
  const { contextHolder, showSuccess, showError } = useToast();

  const { hasPermission } = usePermission();
  const canAdd = hasPermission('staff:create');
  const canEdit = hasPermission('staff:edit');
  const canDelete = hasPermission('staff:delete');
  const canToggleStatus = hasPermission('staff:status') || hasPermission('staff:toggle_stock');

  const { data: staffList = [], isLoading: isStaffLoading } = useGetStaffMembersQuery();
  const { data: rolesData, isLoading: isRolesLoading } = useGetRolesAndModulesQuery();
  const { data: branches = [], isLoading: isBranchesLoading } = useGetBranchesQuery();

  const roles = rolesData?.roles || [];

  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('account_details');
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [customPermissions, setCustomPermissions] = useState([]);

  // Multi-Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('');
  const [selectedCityFilter, setSelectedCityFilter] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: '',
      branchId: '',
      isActive: true,
    },
  });

  const availableCities = useMemo(() => {
    const cities = new Set(branches.map((b) => b.city).filter(Boolean));
    return Array.from(cities);
  }, [branches]);

  const filteredBranchOptions = useMemo(() => {
    if (!selectedCityFilter) return branches;
    return branches.filter((b) => b.city?.toLowerCase() === selectedCityFilter.toLowerCase());
  }, [branches, selectedCityFilter]);

  const filteredStaffList = useMemo(() => {
    return staffList.filter((staff) => {
      const staffBranchId = staff.branch?._id || staff.branch;
      const staffRoleId = staff.roleId?._id || staff.roleId;
      const staffCity = staff.branch?.city;

      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = staff.name?.toLowerCase().includes(query);
        const matchesEmail = staff.email?.toLowerCase().includes(query);
        const matchesEmpId = staff.employeeId?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesEmpId) return false;
      }

      if (selectedCityFilter && staffCity?.toLowerCase() !== selectedCityFilter.toLowerCase()) {
        return false;
      }

      if (selectedBranchFilter && String(staffBranchId) !== String(selectedBranchFilter)) {
        return false;
      }

      if (selectedRoleFilter && String(staffRoleId) !== String(selectedRoleFilter) && staff.role !== selectedRoleFilter) {
        return false;
      }

      if (selectedStatusFilter !== '') {
        const isActiveBool = selectedStatusFilter === 'active';
        if (staff.isActive !== isActiveBool) return false;
      }

      return true;
    });
  }, [
    staffList,
    searchTerm,
    selectedCityFilter,
    selectedBranchFilter,
    selectedRoleFilter,
    selectedStatusFilter,
  ]);

  const metrics = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.isActive !== false).length;
    const inactive = staffList.filter((s) => s.isActive === false).length;
    return { total, active, inactive };
  }, [staffList]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCityFilter('');
    setSelectedBranchFilter('');
    setSelectedRoleFilter('');
    setSelectedStatusFilter('');
  };

  const hasActiveFilters = Boolean(
    searchTerm || selectedCityFilter || selectedBranchFilter || selectedRoleFilter || selectedStatusFilter !== ''
  );

  const handleStartCreate = () => {
    setSelectedStaffId(null);
    setActiveTab('account_details');
    const defaultBranch = branches[0]?._id || '';
    const defaultRole = roles[0];

    reset({
      name: '',
      email: '',
      password: '',
      roleId: defaultRole?._id || '',
      branchId: defaultBranch,
      isActive: true,
    });
    setCustomPermissions(defaultRole?.permissions ? [...defaultRole.permissions] : []);
    setViewMode('form');
  };

  const handleStartEdit = (user) => {
    setSelectedStaffId(user._id);
    setActiveTab('account_details');
    reset({
      name: user.name || '',
      email: user.email || '',
      password: '',
      roleId: user.roleId?._id || user.roleId || '',
      branchId: user.branch?._id || user.branch || '',
      isActive: user.isActive ?? true,
    });
    setCustomPermissions(user.customPermissions || []);
    setViewMode('form');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedStaffId(null);
  };

  const handleRoleSelection = (roleId) => {
    setValue('roleId', roleId);
    const matchedRole = roles.find((r) => r._id === roleId);
    if (matchedRole?.permissions) {
      setCustomPermissions([...matchedRole.permissions]);
    }
  };

  const handleSaveForm = async (values) => {
    if (!selectedStaffId && !values.password?.trim()) {
      showError('Password is required for new accounts');
      return;
    }

    try {
      const payload = {
        ...values,
        customPermissions,
      };

      if (selectedStaffId) {
        if (!payload.password?.trim()) delete payload.password;
        await updateStaff({ id: selectedStaffId, ...payload }).unwrap();
        showSuccess('Staff account updated successfully');
      } else {
        await createStaff(payload).unwrap();
        showSuccess('Staff account created successfully');
      }
      setViewMode('list');
      setSelectedStaffId(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save staff record');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      await deleteStaff(id).unwrap();
      showSuccess('Staff record deleted');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete staff member');
    }
  };

  const handleToggleActiveState = async (user, checked) => {
    if (!canToggleStatus) return;
    try {
      await updateStaff({ id: user._id, isActive: checked }).unwrap();
      showSuccess(`Account ${checked ? 'activated' : 'deactivated'}`);
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const columns = [
    {
      title: 'Staff Member',
      key: 'name',
      width: '28%',
      render: (_, record) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 text-sm">{record.name}</span>
            <span className="text-[11px] font-mono font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
              {record.employeeId || 'EMP-1000'}
            </span>
          </div>
          <span className="text-xs text-neutral-400 block mt-0.5">{record.email}</span>
        </div>
      ),
    },
    {
      title: 'Assigned Role',
      key: 'role',
      width: '22%',
      render: (_, record) => {
        const isMasterAdmin = record.role === 'admin' || record.role === 'super_admin';
        const activeCount = Array.isArray(record.customPermissions)
          ? record.customPermissions.length
          : (record.roleId?.permissions?.length || 0);

        return (
          <div>
            <span
              className={`inline-block font-bold text-[11px] px-2.5 py-0.5 rounded-full ${isMasterAdmin ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-700'
                }`}
            >
              {record.roleId?.name || record.role || 'Staff'}
            </span>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {isMasterAdmin ? 'Full Master Access' : `${activeCount} capabilities active`}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Branch Outlet',
      key: 'branch',
      width: '22%',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-500 flex items-center justify-center text-xs">
            <ShopOutlined />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-800 block">
              {record.branch?.name || 'Unassigned'}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              {record.branch?.city || 'HQ'} {record.branch?.branchCode ? `(${record.branch.branchCode})` : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '14%',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <CustomSwitch
            checked={record.isActive}
            disabled={!canToggleStatus}
            onChange={(checked) => handleToggleActiveState(record, checked)}
          />
          <span className={`text-[11px] font-semibold ${record.isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {record.isActive ? 'Active' : 'Inactive'}
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
            onEdit={() => handleStartEdit(record)}
            onDelete={() => handleDeleteStaff(record._id)}
            deleteTitle="Delete Staff Member?"
            deleteDescription={`Permanently delete credentials for ${record.name}?`}
          />
        );
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title={viewMode === 'form' ? (selectedStaffId ? 'Edit Staff Profile' : 'Create Staff Member') : 'Staff & Accounts'}
        subTitle={
          viewMode === 'form'
            ? 'Configure profile credentials, assign outlet, and customize permissions'
            : 'Manage outlet employees, credential assignments, and custom capability overrides'
        }
        onAdd={viewMode === 'list' && canAdd ? handleStartCreate : null}
        addText="Add Staff Member"
      >
        {viewMode === 'form' ? (
          <form onSubmit={handleSubmit(handleSaveForm)} className="space-y-6">
            {/* Top Bar: Tabs & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition cursor-pointer shrink-0"
                >
                  <ArrowLeftOutlined className="text-xs" />
                </button>

                {/* Navigation Pill Tabs */}
                <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('account_details')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'account_details'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    <UserOutlined className={activeTab === 'account_details' ? 'text-amber-500' : ''} />
                    <span>Account & Role Setup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('permissions')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${activeTab === 'permissions'
                        ? 'bg-white text-neutral-900 shadow-xs font-bold'
                        : 'text-neutral-500 hover:text-neutral-900'
                      }`}
                  >
                    <KeyOutlined className={activeTab === 'permissions' ? 'text-amber-500' : ''} />
                    <span>Permission Matrix</span>
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-neutral-50 text-neutral-700 border border-neutral-200/60">
                      {customPermissions.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <CustomButton variant="secondary" onClick={handleCancelForm} type="button">
                  Cancel
                </CustomButton>
                <CustomButton variant="primary" htmlType="submit" loading={isCreating || isUpdating}>
                  {selectedStaffId ? 'Save Changes' : 'Create Account'}
                </CustomButton>
              </div>
            </div>

            {/* TAB 1: Account Setup */}
            {activeTab === 'account_details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-1">
                {/* Column 1: Personal Credentials */}
                <div className="space-y-4">
                  <div className="border-b border-neutral-100 pb-2">
                    <span className="text-sm font-semibold text-neutral-900 tracking-tight block">
                      1. Login Credentials
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      Authentication details used to access the management portal
                    </span>
                  </div>

                  <FormInput
                    name="name"
                    label="Full Name"
                    placeholder="e.g. Ali Ahmed"
                    control={control}
                  />

                  <FormInput
                    name="email"
                    label="Email / Login ID"
                    placeholder="staff@burgeroclock.com"
                    type="email"
                    control={control}
                  />

                  <FormInput
                    name="password"
                    label={selectedStaffId ? 'Password (Leave blank to retain current)' : 'Password'}
                    placeholder="••••••••"
                    type="password"
                    control={control}
                  />
                </div>

                {/* Column 2: Kitchen Branch & Role Blueprint */}
                <div className="space-y-4">
                  <div className="border-b border-neutral-100 pb-2">
                    <span className="text-sm font-semibold text-neutral-900 tracking-tight block">
                      2. Outlet & Role Assignment
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      Assign kitchen outlet and default permission blueprint
                    </span>
                  </div>

                  <FormSelect
                    name="branchId"
                    label="Assigned Kitchen Branch"
                    placeholder="Select Outlet"
                    control={control}
                    options={branches.map((b) => ({
                      value: b._id,
                      label: `${b.name} (${b.city})`,
                    }))}
                  />

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Base Role Template
                    </label>
                    <Controller
                      name="roleId"
                      control={control}
                      render={({ field }) => (
                        <FormSelect
                          name="roleId"
                          control={control}
                          placeholder="Select Role Template"
                          options={roles.map((r) => ({
                            value: r._id,
                            label: `${r.name} (${r.permissions?.length || 0} permissions template)`,
                          }))}
                          onChange={(val) => handleRoleSelection(val)}
                        />
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-50/70 border border-neutral-100 mt-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 mb-1">
                      <SafetyCertificateOutlined className="text-amber-500" />
                      <span>Custom Permission Overrides</span>
                    </div>
                    <p className="text-xs text-neutral-500 m-0 leading-relaxed font-normal">
                      This user currently has <strong>{customPermissions.length}</strong> active capabilities. Switch to the <strong>Permission Matrix</strong> tab to customize individual permissions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Permission Matrix */}
            {activeTab === 'permissions' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <div>
                    <span className="text-sm font-semibold text-neutral-900 tracking-tight block">
                      Granular Permission Overrides
                    </span>
                    <span className="text-xs text-neutral-400 font-normal">
                      Toggle specific module and action privileges for this employee
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                    {customPermissions.length} permissions active
                  </span>
                </div>

                <PermissionMatrixTable
                  value={customPermissions}
                  onChange={(updatedPermissions) => setCustomPermissions(updatedPermissions)}
                />
              </div>
            )}
          </form>
        ) : (
          <div className="space-y-6">
            <StaffMetricsBar
              metrics={metrics}
              activeStatusFilter={selectedStatusFilter}
              onStatusFilterChange={setSelectedStatusFilter}
            />

            <StaffFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              cityFilter={selectedCityFilter}
              onCityFilterChange={(city) => {
                setSelectedCityFilter(city);
                setSelectedBranchFilter('');
              }}
              branchFilter={selectedBranchFilter}
              onBranchFilterChange={setSelectedBranchFilter}
              roleFilter={selectedRoleFilter}
              onRoleFilterChange={setSelectedRoleFilter}
              statusFilter={selectedStatusFilter}
              onStatusFilterChange={setSelectedStatusFilter}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              availableCities={availableCities}
              branchOptions={filteredBranchOptions}
              roles={roles}
            />

            <div className="overflow-hidden">
              <Table
                columns={columns}
                dataSource={filteredStaffList}
                rowKey="_id"
                loading={isStaffLoading || isRolesLoading || isBranchesLoading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total, range) => (
                    <span className="text-xs text-neutral-400 font-normal">
                      Showing {range[0]}-{range[1]} of {total} staff accounts
                    </span>
                  ),
                }}
                size="middle"
              />
            </div>
          </div>
        )}
      </PageLayout>
    </>
  );
}