'use client';

import React, { useEffect } from 'react';
import { Space, Switch } from 'antd';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '../../../../_components/formElements/inputfield/Forminput';
import CustomButton from '../../../../_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import FormImageUpload from '../../../../_components/formElements/imageUpload/FormImageUpload';
import { useGetCategoriesQuery } from '@/services/categoryApi';

// Dynamic Yup validation: allows price = 0 for deal-only items (sliders, dips, bundle add-ons)
const schema = yup.object().shape({
  name: yup.string().required('Please enter item name'),
  isDealOnly: yup.boolean().default(false),
  categories: yup
    .array()
    .of(yup.string())
    .when('isDealOnly', {
      is: false,
      then: (s) => s.min(1, 'Please select at least one category').required('Please select category'),
      otherwise: (s) => s.optional(),
    }),
  price: yup
    .number()
    .typeError('Price must be a valid number')
    .when('isDealOnly', {
      is: true,
      then: (s) => s.min(0, 'Price cannot be negative').required('Please enter price'),
      otherwise: (s) => s.positive('Regular menu items must have a price greater than 0').required('Please enter price'),
    }),
  image: yup.mixed().nullable(),
  description: yup.string().optional(),
});

export default function MenuItemModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: rawCategories = [], isLoading: fetchingCategories } = useGetCategoriesQuery(undefined, {
    skip: !open,
  });

  const categories = rawCategories.map((cat) => ({
    value: cat.label,
    label: cat.label,
  }));

  const isEditMode = Boolean(initialValues);

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      categories: [],
      price: '',
      image: null,
      description: '',
      isDealOnly: false,
    },
  });

  const isDealOnly = useWatch({ control, name: 'isDealOnly' });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        let prefilledCats = [];
        if (Array.isArray(initialValues.categories)) {
          prefilledCats = initialValues.categories;
        } else if (typeof initialValues.categories === 'string') {
          prefilledCats = [initialValues.categories];
        }

        reset({
          name: initialValues.name || '',
          categories: prefilledCats,
          price: initialValues.price !== undefined ? initialValues.price : '',
          description: initialValues.description || '',
          image: null,
          isDealOnly: Boolean(initialValues.isDealOnly),
        });
      } else {
        reset({
          name: '',
          categories: [],
          price: '',
          image: null,
          description: '',
          isDealOnly: false,
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('categories', JSON.stringify(values.categories || []));
    formData.append('price', values.price);
    formData.append('description', values.description || '');
    formData.append('isDealOnly', Boolean(values.isDealOnly));

    if (values.image) {
      formData.append('image', values.image);
    }

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={isEditMode ? 'Edit Product' : 'Add new item'}
      open={open}
      onCancel={onClose}
      width="80%"
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4">
        {/* Deal-Only Toggle Banner */}
        <div className="flex items-center justify-between p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg">
          <div>
            <span className="text-sm font-semibold text-purple-900 block">
              Deal-Only / Add-on Item (e.g. Sliders, Dips)
            </span>
            <span className="text-xs text-purple-600 block mt-0.5">
              Enable this if the item is exclusive to deals/bundles and should not appear as a standalone menu product. Allows Rs. 0 price.
            </span>
          </div>
          <Controller
            name="isDealOnly"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={(checked) => {
                  field.onChange(checked);
                  if (checked && !control._formValues.price) {
                    setValue('price', 0);
                  }
                }}
              />
            )}
          />
        </div>

        <FormInput name="name" label="Item Name" placeholder="e.g. Classic Beef Slider, Truffle Mayo Dip" control={control} />
        
        <FormSelect
          name="categories"
          label={`Assigned Categories ${isDealOnly ? '(Optional for Deal-Only Items)' : ''}`}
          mode="multiple"
          placeholder={fetchingCategories ? 'Loading...' : 'Select categories to display this item under'}
          control={control}
          options={categories}
          loading={fetchingCategories}
        />

        <FormInput
          name="price"
          label={isDealOnly ? 'Price / Base Value (Rs) - Can be 0' : 'Price (Rs)'}
          placeholder={isDealOnly ? '0' : 'e.g. 999'}
          control={control}
        />

        <FormImageUpload name="image" label="Product Image" control={control} />
        <FormInput name="description" label="Description" placeholder="e.g. 2 oz mini beef patty slider with caramelized onions" control={control} />

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">Cancel</CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update Item' : 'Add Item'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}