// src/app/admin/banners/_components/BannerModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useGetTargetOptionsQuery } from '@/services/bannerApi';

const schema = yup.object().shape({
  title: yup.string().required('Please enter banner reference title'),
  link: yup.string().required('Please select a target destination section'),
  ctaText: yup.string().optional(),
  image: yup.mixed().nullable(),
});

export default function BannerModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialValues,
}) {
  const isEditMode = Boolean(initialValues);

  const { data: targetOptions = [], isLoading: fetchingOptions } =
    useGetTargetOptionsQuery(undefined, { skip: !open });

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      link: undefined,
      ctaText: '',
      image: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          title: initialValues.title || '',
          link: initialValues.link || undefined,
          ctaText: initialValues.ctaText || '',
          image: null,
        });
      } else {
        reset({
          title: '',
          link: undefined,
          ctaText: '',
          image: null,
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('link', values.link);
    formData.append('ctaText', values.ctaText || '');

    if (values.image) {
      formData.append('image', values.image);
    }

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={isEditMode ? 'Edit Hero Banner' : 'Add New Hero Banner'}
      open={open}
      onCancel={onClose}
      width="50%"
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4">
        <FormInput
          name="title"
          label="Internal Reference Title"
          placeholder="e.g. Share Box Deal Banner"
          control={control}
        />

        <FormSelect
          name="link"
          label="Target Menu Section (Clicking the slide glides here)"
          placeholder={fetchingOptions ? 'Loading sections...' : 'Select a menu section or category'}
          options={targetOptions}
          control={control}
          loading={fetchingOptions}
        />

        <FormInput
          name="ctaText"
          label="CTA Button Text (Optional)"
          placeholder="e.g. Order Now, Explore Deals (leave blank for no button)"
          control={control}
        />

        <FormImageUpload
          name="image"
          label="Banner Graphic / Artwork"
          control={control}
        />

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update Banner' : 'Publish Banner'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}