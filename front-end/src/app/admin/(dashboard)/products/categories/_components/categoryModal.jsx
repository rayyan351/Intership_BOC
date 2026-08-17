// front-end/src/app/admin/products/categories/_components/CategoryModal.jsx
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
    formData.append('label', data.label);
    formData.append('name', data.label.toLowerCase().replace(/[\s_-]+/g, ''));

    if (data.banner) {
      formData.append('banner', data.banner);
    }

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Category' : 'Add New Category'}
      open={open}
      onCancel={onClose}
      width={560}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
        <FormInput
          name="label"
          label="Category Name"
          placeholder="e.g. The Classics, Gourmet Burgers, Sides"
          control={control}
        />

        {/* Section Divider Banner Upload */}
        <FormImageUpload
          name="banner"
          label="Section Divider Banner (Wide Artwork displayed directly above category items)"
          control={control}
        />

        <div className="flex justify-end pt-4 border-t border-gray-100 mt-5">
          <Space>
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Category' : 'Create Category'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}