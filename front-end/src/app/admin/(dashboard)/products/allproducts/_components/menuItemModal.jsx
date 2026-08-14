'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '../../../../_components/formElements/inputfield/Forminput';
import CustomButton from '../../../../_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import FormImageUpload from '../../../../_components/formElements/imageUpload/FormImageUpload';
import { useGetCategoriesQuery } from '@/services/categoryApi';

// Updated Yup schema to expect an array of categories
const schema = yup.object().shape({
  name: yup.string().required('Please enter item name'),
  categories: yup
    .array()
    .of(yup.string())
    .min(1, 'Please select at least one category')
    .required('Please select category'),
  price: yup
    .number()
    .typeError('Price must be a valid number')
    .positive('Price must be greater than 0')
    .required('Please enter price'),
  image: yup.mixed().nullable(),
  description: yup.string().optional(),
});

export default function MenuItemModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: rawCategories = [], isLoading: fetchingCategories } = useGetCategoriesQuery(undefined, {
    skip: !open,
  });

  const categories = rawCategories.map((cat) => ({
    value: cat.label, // Storing human-readable label
    label: cat.label,
  }));

  const isEditMode = Boolean(initialValues);

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      categories: [],
      price: '',
      image: null,
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Pre-fill categories multi-select correctly from initialValues
        let prefilledCats = [];
        if (Array.isArray(initialValues.categories)) {
          prefilledCats = initialValues.categories;
        } else if (typeof initialValues.categories === 'string') {
          prefilledCats = [initialValues.categories];
        }

        reset({
          name: initialValues.name || '',
          categories: prefilledCats,
          price: initialValues.price || '',
          description: initialValues.description || '',
          image: null,
        });
      } else {
        reset({
          name: '',
          categories: [],
          price: '',
          image: null,
          description: '',
        });
      }
    }
  }, [open, initialValues, reset]);

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    
    // Serialize categories array into JSON string for FormData
    formData.append('categories', JSON.stringify(values.categories));
    
    formData.append('price', values.price);
    formData.append('description', values.description || '');
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
        <FormInput name="name" label="Item Name" placeholder="e.g. Classic Beef Burger" control={control} />
        
        <FormSelect
          name="categories"
          label="Assigned Categories"
          mode="multiple"
          placeholder={fetchingCategories ? 'Loading...' : 'Select categories to display this item under'}
          control={control}
          options={categories}
          loading={fetchingCategories}
        />

        <FormInput name="price" label="Price (Rs)" placeholder="e.g. 999" control={control} />
        <FormImageUpload name="image" label="Product Image" control={control} />
        <FormInput name="description" label="Description" placeholder="e.g. Juicy beef patty" control={control} />

        <div className="flex justify-end pt-4 mt-6">
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