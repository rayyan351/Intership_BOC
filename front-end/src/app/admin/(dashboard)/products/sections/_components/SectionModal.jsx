// front-end/src/app/admin/products/sections/_components/SectionModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { useGetProductsQuery } from '@/services/productApi';
import { useGetDealsQuery } from '@/services/dealApi';

const schema = yup.object().shape({
  title: yup.string().required('Section title is required'),
  subtitle: yup.string().optional(),
  displayOrder: yup.number().typeError('Must be a number').optional(),
  products: yup.array().of(yup.string()).optional(),
  deals: yup.array().of(yup.string()).optional(),
});

export default function SectionModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: products = [], isLoading: fetchingProducts } = useGetProductsQuery(undefined, { skip: !open });
  const { data: deals = [], isLoading: fetchingDeals } = useGetDealsQuery(undefined, { skip: !open });

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      subtitle: '',
      displayOrder: 1,
      products: [],
      deals: [],
    },
  });

  const productOptions = products.map((p) => ({
    label: `${p.name} (Rs. ${p.price})`,
    value: p._id,
  }));

  const dealOptions = deals.map((d) => ({
    label: `${d.title} (Rs. ${d.dealPrice})`,
    value: d._id,
  }));

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          title: initialValues.title || '',
          subtitle: initialValues.subtitle || '',
          displayOrder: initialValues.displayOrder || 1,
          products: (initialValues.products || []).map((p) => p._id || p),
          deals: (initialValues.deals || []).map((d) => d._id || d),
        });
      } else {
        reset({
          title: '',
          subtitle: '',
          displayOrder: 1,
          products: [],
          deals: [],
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    onSubmit(values);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Display Section' : 'Create Display Section'}
      open={open}
      onCancel={onClose}
      width={600}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-5">
        <FormInput
          name="title"
          label="Section Title"
          placeholder="e.g. Loaded Fries Zone, Grab The Wraps"
          control={control}
        />

        <FormInput
          name="subtitle"
          label="Subtitle / Description"
          placeholder="e.g. Crispy fries loaded with cheese and chicken"
          control={control}
        />

        <div className="space-y-1">
          <FormSelect
            name="products"
            label="Assigned Products"
            mode="multiple"
            maxTagCount="responsive" // Collapses overflow tags into "+X more" badge
            placeholder={fetchingProducts ? 'Loading products...' : 'Select items to display in this section'}
            control={control}
            options={productOptions}
            loading={fetchingProducts}
          />
        </div>

        <div className="space-y-1">
          <FormSelect
            name="deals"
            label="Assigned Deals / Bundles"
            mode="multiple"
            maxTagCount="responsive" // Collapses overflow tags into "+X more" badge
            placeholder={fetchingDeals ? 'Loading deals...' : 'Select deals to display in this section'}
            control={control}
            options={dealOptions}
            loading={fetchingDeals}
          />
        </div>

        <FormInput
          name="displayOrder"
          label="Display Priority Order"
          type="number"
          placeholder="1"
          control={control}
        />

        <div className="flex justify-end pt-4 mt-6">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">Cancel</CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Section' : 'Create Section'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}