// src/app/admin/(dashboard)/products/categories/_components/CategoryModal.jsx
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Space } from 'antd';

import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';

const schema = yup.object().shape({
  label: yup.string().required('Please enter category name'),
  banner: yup.mixed().nullable(),
});

export default function CategoryModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      label: '',
      banner: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          label: initialValues.label || initialValues.name || '',
          banner: null,
        });
      } else {
        reset({
          label: '',
          banner: null,
        });
      }
    }
  }, [initialValues, reset, open]);

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    formData.append('label', data.label.trim());
    formData.append('name', data.label.trim().toLowerCase().replace(/[\s_-]+/g, ''));

    if (data.banner) {
      formData.append('banner', data.banner);
    }

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Menu Category' : 'Add New Category'}
      open={open}
      onCancel={onClose}
      width={540}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <FormInput
          name="label"
          label="Category Name"
          placeholder="e.g. The Classics, Gourmet Burgers, Sides"
          control={control}
        />

        {/* Section Divider Banner Upload */}
        <div className="space-y-1">
          <FormImageUpload
            name="banner"
            label="Section Divider Banner (Optional Artwork)"
            control={control}
          />
          <span className="text-[11px] text-neutral-400 block pl-1">
            Wide banner displayed directly above this category on the live customer menu.
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex justify-end pt-3 mt-5 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Save Changes' : 'Create Category'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}