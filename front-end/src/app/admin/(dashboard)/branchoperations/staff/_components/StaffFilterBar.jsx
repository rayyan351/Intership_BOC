// src/app/admin/(dashboard)/branchoperations/staff/_components/StaffFilterBar.jsx
'use client';

import React from 'react';
import { Select, Input, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';

export default function StaffFilterBar({
  searchTerm,
  onSearchChange,
  cityFilter,
  onCityFilterChange,
  branchFilter,
  onBranchFilterChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  hasActiveFilters,
  availableCities = [],
  branchOptions = [],
  roles = [],
}) {
  return (
    <>
      <style jsx global>{`
        .staff-modern-select .ant-select-selector {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
          border-radius: 0.75rem !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
        }
        .staff-modern-select:hover .ant-select-selector {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
        }
        .staff-modern-select.ant-select-focused .ant-select-selector {
          background-color: #ffffff !important;
          border-color: #f4c61a !important;
          box-shadow: 0 0 0 2px rgba(244, 198, 26, 0.15) !important;
        }
        .staff-modern-select .ant-select-selection-placeholder {
          color: #94a3b8 !important;
          font-weight: 400 !important;
        }
      `}</style>

      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-semibold text-neutral-500 tracking-tight">
            Quick Filters
          </span>
          {hasActiveFilters && (
            <Button
              type="link"
              size="small"
              onClick={onResetFilters}
              icon={<ClearOutlined />}
              className="!text-xs !text-rose-600 hover:!text-rose-700 !p-0 !font-semibold cursor-pointer !h-auto"
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Search */}
          <div>
            <Input
              placeholder="Search name, email, ID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              prefix={<SearchOutlined className="text-neutral-400 mr-1" />}
              allowClear
              className="h-10 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border-slate-200 hover:border-slate-300 focus:border-[#F4C61A] text-xs font-medium shadow-none transition"
            />
          </div>

          {/* City Filter */}
          <div>
            <Select
              placeholder="All Cities"
              allowClear
              value={cityFilter || undefined}
              onChange={(val) => onCityFilterChange(val || '')}
              className="w-full h-10 staff-modern-select"
              options={availableCities.map((city) => ({
                value: city,
                label: `City: ${city}`,
              }))}
            />
          </div>

          {/* Branch Filter */}
          <div>
            <Select
              placeholder="All Outlets"
              allowClear
              showSearch
              optionFilterProp="label"
              value={branchFilter || undefined}
              onChange={(val) => onBranchFilterChange(val || '')}
              className="w-full h-10 staff-modern-select"
              options={branchOptions.map((b) => ({
                value: b._id,
                label: `${b.name} (${b.city})`,
              }))}
            />
          </div>

          {/* Role Filter */}
          <div>
            <Select
              placeholder="All Roles"
              allowClear
              value={roleFilter || undefined}
              onChange={(val) => onRoleFilterChange(val || '')}
              className="w-full h-10 staff-modern-select"
              options={roles.map((r) => ({
                value: r._id,
                label: `${r.name}`,
              }))}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select
              placeholder="All Statuses"
              allowClear
              value={statusFilter !== '' ? statusFilter : undefined}
              onChange={(val) => onStatusFilterChange(val !== undefined ? val : '')}
              className="w-full h-10 staff-modern-select"
              options={[
                { value: 'active', label: 'Active only' },
                { value: 'inactive', label: 'Inactive only' },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}