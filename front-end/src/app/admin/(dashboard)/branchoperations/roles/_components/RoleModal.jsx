// src/app/admin/(dashboard)/branchoperations/roles/_components/RoleModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
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
  { label: 'Amber', value: 'gold', hex: '#f59e0b' },
  { label: 'Emerald', value: 'green', hex: '#10b981' },
  { label: 'Blue', value: 'blue', hex: '#3b82f6' },
  { label: 'Indigo', value: 'purple', hex: '#6366f1' },
  { label: 'Rose', value: 'magenta', hex: '#f43f5e' },
  { label: 'Cyan', value: 'cyan', hex: '#06b6d4' },
  { label: 'Dark', value: 'default', hex: '#18181b' },
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
      title={initialValues ? `Edit Role: ${initialValues.name}` : 'Create Custom Role'}
      open={open}
      onCancel={onClose}
      width={460}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <FormInput
          name="name"
          label="Role Name"
          placeholder="e.g. Branch Supervisor, Cashier"
          control={control}
        />

        <FormInput
          name="description"
          label="Description / Responsibilities"
          placeholder="e.g. Handles kitchen queue and counter operations"
          control={control}
        />

        <div>
          <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
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
                  className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                    isSelected ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-100">
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