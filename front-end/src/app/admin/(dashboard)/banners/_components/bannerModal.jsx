'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const schema = yup.object().shape({
  title: yup.string().required('Please enter banner headline/title'),
  eyebrow: yup.string().optional(),
  description: yup.string().optional(),
  link: yup.string().optional(),
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

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      eyebrow: '',
      description: '',
      link: '',
      ctaText: '',
      image: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          title: initialValues.title || '',
          eyebrow: initialValues.eyebrow || '',
          description: initialValues.description || '',
          link: initialValues.link || '',
          ctaText: initialValues.ctaText || '',
          image: null,
        });
      } else {
        reset({
          title: '',
          eyebrow: "BURGER O'CLOCK EXCLUSIVE",
          description: '',
          link: '/#deals',
          ctaText: 'Explore Category',
          image: null,
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('eyebrow', values.eyebrow || '');
    formData.append('description', values.description || '');
    formData.append('link', values.link || '');
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
      width="60%"
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4">
        <FormInput
          name="eyebrow"
          label="Badge / Eyebrow Text (Optional)"
          placeholder="e.g. LIMITED TIME OFFER, BURGER O'CLOCK EXCLUSIVE"
          control={control}
        />

        <FormInput
          name="title"
          label="Banner Headline Title"
          placeholder="e.g. CHICKEN SLIDERS COMBO"
          control={control}
        />

        <FormInput
          name="description"
          label="Promo Description"
          placeholder="e.g. 4 juicy chicken sliders with loaded fries & 2 soft drinks."
          control={control}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            name="ctaText"
            label="CTA Button Text (Optional)"
            placeholder="e.g. Order Now, Explore Category"
            control={control}
          />
          <FormInput
            name="link"
            label="Target Link (Optional)"
            placeholder="e.g. /#deals, /#burgers, or https://..."
            control={control}
          />
        </div>

        <FormImageUpload
          name="image"
          label="Banner Background Image (Landscape recommended)"
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