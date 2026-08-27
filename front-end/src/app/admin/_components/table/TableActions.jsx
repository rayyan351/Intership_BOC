// src/app/admin/_components/table/TableActions.jsx
'use client';

import React from 'react';
import { Popconfirm, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, QuestionCircleOutlined } from '@ant-design/icons';

export default function TableActions({
  onEdit,
  onDelete,
  onView,
  deleteTitle = 'Delete Record?',
  deleteDescription = 'Are you sure you want to delete this record? This action cannot be undone.',
  canEdit = true,
  canDelete = true,
  canView = false,
  extraActions = null,
}) {
  return (
    <div className="flex items-center justify-end gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
      {extraActions}

      {canView && onView && (
        <Tooltip title="View Details">
          <button
            type="button"
            onClick={onView}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
          >
            <EyeOutlined className="text-xs" />
          </button>
        </Tooltip>
      )}

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="px-2.5 py-1 text-xs font-semibold rounded-lg text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer"
        >
          Edit
        </button>
      )}

      {canDelete && onDelete && (
        <Popconfirm
          title={<span className="font-bold text-xs text-neutral-900">{deleteTitle}</span>}
          description={<span className="text-[11px] text-neutral-500 max-w-[200px] block">{deleteDescription}</span>}
          icon={<QuestionCircleOutlined className="text-rose-500" />}
          onConfirm={onDelete}
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, size: 'small', className: '!text-xs !font-bold !rounded-lg' }}
          cancelButtonProps={{ size: 'small', className: '!text-xs !rounded-lg' }}
        >
          <button
            type="button"
            className="p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition cursor-pointer"
          >
            <DeleteOutlined className="text-xs" />
          </button>
        </Popconfirm>
      )}
    </div>
  );
}