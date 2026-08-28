// src/app/admin/(dashboard)/products/categories/_components/SectionModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space, Image } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
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
  banner: yup.mixed().nullable(),
  removeBanner: yup.boolean().default(false),
});

export default function SectionModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: products = [], isLoading: fetchingProducts } = useGetProductsQuery(undefined, { skip: !open });
  const { data: deals = [], isLoading: fetchingDeals } = useGetDealsQuery(undefined, { skip: !open });

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      subtitle: '',
      displayOrder: 1,
      products: [],
      deals: [],
      banner: null,
      removeBanner: false,
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
          banner: null,
          removeBanner: false,
        });
      } else {
        reset({
          title: '',
          subtitle: '',
          displayOrder: 1,
          products: [],
          deals: [],
          banner: null,
          removeBanner: false,
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('title', values.title.trim());
    formData.append('subtitle', (values.subtitle || '').trim());
    formData.append('displayOrder', values.displayOrder || 1);
    formData.append('products', JSON.stringify(values.products || []));
    formData.append('deals', JSON.stringify(values.deals || []));
    formData.append('removeBanner', values.removeBanner ? 'true' : 'false');

    if (values.banner) {
      formData.append('banner', values.banner);
    }

    onSubmit(formData);
  };

  const getPreviewUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Display Section' : 'Create Display Section'}
      open={open}
      onCancel={onClose}
      width={640}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1 font-['Plus_Jakarta_Sans',sans-serif]">
        <FormInput
          name="title"
          label="Section Title"
          placeholder="e.g. Loaded Fries Zone, The Classics, Grab The Wraps"
          control={control}
        />

        <FormInput
          name="subtitle"
          label="Subtitle / Description"
          placeholder="e.g. Crispy fries loaded with cheese and shredded chicken"
          control={control}
        />

        {/* Existing Banner Preview */}
        {initialValues?.banner && (
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
            <span className="text-xs text-neutral-500 font-semibold block mb-2">Current Active Banner:</span>
            <div className="relative w-full h-24 overflow-hidden rounded-xl border border-neutral-200 bg-black">
              <img
                src={getPreviewUrl(initialValues.banner)}
                alt="Current Section Banner"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <label className="flex items-center gap-2 mt-2.5 text-xs font-semibold text-rose-600 cursor-pointer">
              <input
                type="checkbox"
                onChange={(e) => setValue('removeBanner', e.target.checked)}
                className="rounded border-neutral-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              Remove current banner graphic
            </label>
          </div>
        )}

        <div className="space-y-1">
          <FormImageUpload
            name="banner"
            label="Section Divider Banner (Upload Artwork)"
            control={control}
          />
          <span className="text-[11px] text-neutral-400 block pl-1 font-normal">
            Banner artwork rendered prominently above this section on the storefront.
          </span>
        </div>

        <div className="space-y-1">
          <FormSelect
            name="products"
            label="Assigned Products"
            mode="multiple"
            maxTagCount="responsive"
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
            maxTagCount="responsive"
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

        {/* Action Controls */}
        <div className="flex justify-end pt-3 mt-5 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Save Changes' : 'Create Section'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}