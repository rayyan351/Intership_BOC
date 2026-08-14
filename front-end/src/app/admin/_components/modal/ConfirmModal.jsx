'use client';

import React from 'react';
import { ExclamationCircleFilled } from '@ant-design/icons';
import CustomModal from './CustomModal';
import CustomButton from '../formElements/button/Custombutton';

export default function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  confirmVariant = "danger", // 'danger' | 'primary' | 'secondary'
  icon = <ExclamationCircleFilled className="text-2xl" />,
  iconBgColor = "bg-red-100 text-red-600",
  loading = false,
}) {
  return (
    <CustomModal
      open={open}
      onCancel={onCancel}
      title=""
      width={420}
    >
      <div className="flex flex-col items-center text-center p-2">
        {/* Dynamic Icon Container */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${iconBgColor}`}>
          {icon}
        </div>

        {/* Dynamic Title & Description */}
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-2">{description}</p>

        {/* Dynamic Action Buttons */}
        <div className="flex justify-center gap-3 w-full mt-6">
          <CustomButton variant="secondary" onClick={onCancel} type="button">
            {cancelText}
          </CustomButton>
          <CustomButton
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </CustomButton>
        </div>
      </div>
    </CustomModal>
  );
}