// front-end/src/app/admin/products/categories/_components/CategoryModal.jsx
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Space } from 'antd';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';

const schema = yup.object().shape({
  label: yup.string().required('Please enter category name'),
});

export default function CategoryModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { label: '' },
  });

  useEffect(() => {
    if (initialValues) {
      reset({ label: initialValues.label || '' });
    } else {
      reset({ label: '' });
    }
  }, [initialValues, reset, open]);

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Category' : 'Add New Category'}
      open={open}
      onCancel={onClose}
      width={450}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
        <FormInput
          name="label"
          label="Category Name"
          placeholder="e.g. Gourmet Burgers, Beverages, Desserts"
          control={control}
        />
        <div className="flex justify-end pt-4">
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