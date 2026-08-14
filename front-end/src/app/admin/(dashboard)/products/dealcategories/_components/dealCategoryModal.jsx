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
  label: yup.string().required('Category name is required'),
});

export default function DealCategoryModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { label: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ label: initialValues?.label || '' });
    }
  }, [open, initialValues, reset]);

  return (
    <CustomModal
      title={initialValues ? 'Edit Deal Category' : 'Create Deal Category'}
      open={open}
      onCancel={onClose}
      width={480}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <FormInput
          name="label"
          label="Deal Category Name"
          placeholder="e.g. Super Savor Deal, Share Box"
          control={control}
        />

        <div className="flex justify-end pt-4 mt-6">
          <Space size="middle">
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