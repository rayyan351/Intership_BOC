// src/app/admin/(dashboard)/branchoperations/staff/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Button, Popconfirm, Tag, Tooltip } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    ShopOutlined,
    LockOutlined,
} from '@ant-design/icons';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import PermissionMatrixTable from '../roles/_components/PermissionMatrixTable';
import { useToast } from '@/utils/toast';

import {
    useGetStaffMembersQuery,
    useCreateStaffMutation,
    useUpdateStaffMutation,
    useDeleteStaffMutation,
} from '@/services/staffApi';
import { useGetRolesAndModulesQuery } from '@/services/roleApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function StaffPage() {
    const { contextHolder, showSuccess, showError } = useToast();

    const { data: staffList = [], isLoading: isStaffLoading } = useGetStaffMembersQuery();
    const { data: rolesData, isLoading: isRolesLoading } = useGetRolesAndModulesQuery();
    const { data: branches = [], isLoading: isBranchesLoading } = useGetBranchesQuery();

    const roles = rolesData?.roles || [];
    const modules = rolesData?.modules || [];

    const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'
    const [selectedStaffId, setSelectedStaffId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: '',
        branchId: '',
        customPermissions: [],
        isActive: true,
    });

    const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
    const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
    const [deleteStaff] = useDeleteStaffMutation();

    const handleStartCreate = () => {
        setSelectedStaffId(null);
        const defaultBranch = branches[0]?._id || '';
        const defaultRole = roles[0];

        setFormData({
            name: '',
            email: '',
            password: '',
            roleId: defaultRole?._id || '',
            branchId: defaultBranch,
            customPermissions: defaultRole?.permissions ? [...defaultRole.permissions] : [],
            isActive: true,
        });
        setViewMode('form');
    };

    const handleStartEdit = (user) => {
        setSelectedStaffId(user._id);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            password: '', // Leave blank to retain existing
            roleId: user.roleId?._id || user.roleId || '',
            branchId: user.branch?._id || user.branch || '',
            customPermissions: user.customPermissions || [],
            isActive: user.isActive ?? true,
        });
        setViewMode('form');
    };

    const handleCancelForm = () => {
        setViewMode('list');
        setSelectedStaffId(null);
    };

    // When admin selects a role, dynamically clone that role's base permissions
    const handleRoleChange = (roleId) => {
        const matchedRole = roles.find((r) => r._id === roleId);
        setFormData((prev) => ({
            ...prev,
            roleId,
            customPermissions: matchedRole?.permissions ? [...matchedRole.permissions] : prev.customPermissions,
        }));
    };

    const handleToggleSingle = (key) => {
        setFormData((prev) => {
            const exists = prev.customPermissions.includes(key);
            return {
                ...prev,
                customPermissions: exists
                    ? prev.customPermissions.filter((k) => k !== key)
                    : [...prev.customPermissions, key],
            };
        });
    };

    const handleBatchToggle = (keys, enable) => {
        setFormData((prev) => {
            let updated;
            if (enable) {
                updated = Array.from(new Set([...prev.customPermissions, ...keys]));
            } else {
                updated = prev.customPermissions.filter((k) => !keys.includes(k));
            }
            return { ...prev, customPermissions: updated };
        });
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.roleId || !formData.branchId) {
            showError('Please fill all required profile fields');
            return;
        }

        if (!selectedStaffId && !formData.password.trim()) {
            showError('Password is required for new accounts');
            return;
        }

        try {
            if (selectedStaffId) {
                const payload = { ...formData };
                if (!payload.password.trim()) delete payload.password;

                await updateStaff({ id: selectedStaffId, ...payload }).unwrap();
                showSuccess('Staff account updated successfully');
            } else {
                await createStaff(formData).unwrap();
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
        try {
            await updateStaff({ id: user._id, isActive: checked }).unwrap();
            showSuccess(`Account ${checked ? 'activated' : 'deactivated'}`);
        } catch (err) {
            showError('Failed to update status');
        }
    };

    // Staff Table Overview Columns
    const columns = [
        {
            title: 'Staff Member',
            key: 'name',
            width: '28%',
            render: (_, record) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">{record.name}</span>
                        <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded border border-neutral-200">
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
            width: '20%',
            render: (_, record) => {
                const isMasterAdmin = record.role === 'admin' || record.role === 'super_admin';
                const activeCount = record.customPermissions?.length || record.roleId?.permissions?.length || 0;

                return (
                    <div>
                        <Tag
                            color={isMasterAdmin ? 'gold' : 'blue'}
                            className="m-0 font-bold uppercase text-[10px] px-2 py-0.5 border-none"
                        >
                            {record.roleId?.name || record.role || 'Staff'}
                        </Tag>
                        <span className="text-[11px] text-neutral-400 block mt-1">
                            {isMasterAdmin ? 'Full Master Access' : `${activeCount} Capabilities Active`}
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
                <div className="flex items-center gap-1.5">
                    <ShopOutlined className="text-neutral-400 text-xs" />
                    <div>
                        <span className="text-xs font-semibold text-neutral-800 block">
                            {record.branch?.name || 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                            {record.branch?.city || 'HQ'} ({record.branch?.branchCode || 'HQ-001'})
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
                        onChange={(checked) => handleToggleActiveState(record, checked)}
                    />
                    <span className={`text-[11px] font-bold ${record.isActive ? 'text-emerald-600' : 'text-neutral-400'}`}>
                        {record.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: '16%',
            render: (_, record) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(record)}
                        className="!text-xs font-semibold"
                    >
                        Edit
                    </Button>

                    <Popconfirm
                        title="Delete Staff"
                        description={`Delete account for ${record.name}?`}
                        onConfirm={() => handleDeleteStaff(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} className="!text-xs" />
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <>
            {contextHolder}
            <PageLayout
                title={viewMode === 'form' ? (selectedStaffId ? 'Edit Staff Account' : 'Create Staff Member') : 'Staff & Accounts'}
                subTitle="Manage outlet employees, credential assignments, and custom capability overrides"
                onAdd={viewMode === 'list' ? handleStartCreate : null}
                addText="Add Staff Member"
            >
                {viewMode === 'form' ? (
                    /* ===================== INLINE SINGLE-CANVAS STAFF STUDIO ===================== */
                    <form onSubmit={handleSaveForm} className="space-y-5 font-['Plus_Jakarta_Sans',sans-serif]">
                        {/* Top Action Header */}
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
                                        {selectedStaffId ? 'Edit Staff Credentials & Capabilities' : 'New Staff Credentials & Capabilities'}
                                    </h3>
                                    <span className="text-[11px] text-neutral-400 font-medium">
                                        {formData.customPermissions.length} capabilities configured for this user
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <CustomButton variant="secondary" onClick={handleCancelForm} type="button">
                                    Cancel
                                </CustomButton>
                                <CustomButton variant="primary" htmlType="submit" loading={isCreating || isUpdating}>
                                    {selectedStaffId ? 'Save Changes' : 'Create Account'}
                                </CustomButton>
                            </div>
                        </div>

                        {/* Profile Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ali Ahmed"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400] transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                                    Email / Login ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="staff@burgeroclock.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400] transition"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                                    Password {selectedStaffId ? '(Leave blank to keep current)' : <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full h-10 px-3.5 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400] transition"
                                    required={!selectedStaffId}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                                    Assigned Branch Outlet <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                                    required
                                >
                                    <option value="" disabled>Select Outlet</option>
                                    {branches.map((b) => (
                                        <option key={b._id} value={b._id}>
                                            {b.name} ({b.city} - {b.branchCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Role Template Selector Strip */}
                        <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                                    Select Base Role Template
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                    Selecting a role auto-populates its default capabilities below. You can customize them for this user.
                                </span>
                            </div>

                            <div className="min-w-[240px]">
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                                    required
                                >
                                    <option value="" disabled>Select Role Template</option>
                                    {roles.map((r) => (
                                        <option key={r._id} value={r._id}>
                                            {r.name} ({r.permissions?.length || 0} permissions)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Custom User Capabilities Table Overrides */}
                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                    User-Specific Permission Overrides
                                </span>
                                <span className="text-[11px] text-neutral-400 font-medium">
                                    {formData.customPermissions.length} Capabilities Granted
                                </span>
                            </div>

                            <PermissionMatrixTable
                                modules={modules}
                                selectedPermissions={formData.customPermissions}
                                onTogglePermission={handleToggleSingle}
                                onBatchToggle={handleBatchToggle}
                            />
                        </div>
                    </form>
                ) : (
                    /* ===================== STAFF TABLE OVERVIEW ===================== */
                    <div className="bg-white overflow-hidden shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
                        <Table
                            columns={columns}
                            dataSource={staffList}
                            rowKey="_id"
                            loading={isStaffLoading || isRolesLoading || isBranchesLoading}
                            pagination={{ pageSize: 10 }}
                            size="middle"
                        />
                    </div>
                )}
            </PageLayout>
        </>
    );
}