// src/app/admin/(dashboard)/branchoperations/roles/_components/RoleModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const schema = yup.object().shape({
  name: yup.string().required('Role name is required'),
  description: yup.string().optional(),
  color: yup.string().default('blue'),
});

const colorPresets = [
  { label: 'Amber', value: 'gold', hex: '#F59E0B' },
  { label: 'Emerald', value: 'green', hex: '#10B981' },
  { label: 'Blue', value: 'blue', hex: '#3B82F6' },
  { label: 'Indigo', value: 'purple', hex: '#6366F1' },
  { label: 'Rose', value: 'magenta', hex: '#F43F5E' },
  { label: 'Cyan', value: 'cyan', hex: '#06B6D4' },
  { label: 'Dark', value: 'default', hex: '#18181B' },
];

export default function RoleModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { control, handleSubmit, reset, setValue, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: '', description: '', color: 'blue' },
  });

  const selectedColor = watch('color');

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          description: initialValues.description || '',
          color: initialValues.color || 'blue',
        });
      } else {
        reset({ name: '', description: '', color: 'blue' });
      }
    }
  }, [open, initialValues, reset]);

  return (
    <CustomModal
      title={initialValues ? `Edit Role: ${initialValues.name}` : 'Create New Role'}
      open={open}
      onCancel={onClose}
      width={460}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <FormInput
          name="name"
          label="Role Title"
          placeholder="e.g. Branch Supervisor, Cashier"
          control={control}
        />

        <FormInput
          name="description"
          label="Role Description / Responsibilities"
          placeholder="e.g. Handles kitchen queue and counter operations"
          control={control}
        />

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-2">
            Badge Accent Color
          </label>
          <div className="flex items-center gap-2.5">
            {colorPresets.map((c) => {
              const isSelected = selectedColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setValue('color', c.value, { shouldValidate: true, shouldDirty: true })}
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-xs'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                >
                  {isSelected && <CheckOutlined className="text-white text-[10px]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Save Changes' : 'Create Role'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}