'use client';

import React, { useEffect, useState } from 'react';
import { Space, Button, InputNumber, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import { useGetProductsQuery } from '@/services/productApi';
import { useGetDealCategoriesQuery } from '@/services/dealCategoryApi';

const schema = yup.object().shape({
  title: yup.string().required('Deal title is required'),
  dealType: yup.string().required('Select deal type'),
  discountPercentage: yup
    .number()
    .typeError('Enter a valid discount percentage')
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .required('Discount percentage is required'),
  description: yup.string().optional(),
  image: yup.mixed().nullable(),
});

export default function DealModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: products = [], isLoading: fetchingProducts } = useGetProductsQuery(undefined, { skip: !open });
  const { data: dealCategories = [], isLoading: fetchingDealCategories } = useGetDealCategoriesQuery(
    undefined,
    { skip: !open }
  );

  const [selectedItems, setSelectedItems] = useState([]); // Array of { productId, quantity }

  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      dealType: '',
      discountPercentage: 0,
      description: '',
      image: null,
    },
  });

  const discountPercentage = useWatch({ control, name: 'discountPercentage' }) || 0;

  // Map database deal categories into dynamic select options
  const dealTypeOptions = dealCategories.map((cat) => ({
    label: cat.label,
    value: cat.label,
  }));

  // Calculate sum of individual items in deal
  const calculatedOriginalPrice = selectedItems.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    return sum + (prod ? prod.price * (item.quantity || 1) : 0);
  }, 0);

  // Calculate final deal price based on percentage discount
  const calculatedDealPrice = Math.round(
    calculatedOriginalPrice - (calculatedOriginalPrice * Number(discountPercentage)) / 100
  );

  useEffect(() => {
    if (open) {
      if (initialValues) {
        // Calculate existing discount percentage if initialValues has pricing
        let existingDiscount = 0;
        if (initialValues.originalPrice && initialValues.dealPrice) {
          existingDiscount = Math.round(
            ((initialValues.originalPrice - initialValues.dealPrice) / initialValues.originalPrice) * 100
          );
        }

        reset({
          title: initialValues.title || '',
          dealType: initialValues.dealType || (dealTypeOptions[0]?.value || ''),
          discountPercentage: existingDiscount || 0,
          description: initialValues.description || '',
          image: null,
        });

        const mappedItems = (initialValues.items || []).map((item) => ({
          productId: item.product?._id || item.product,
          quantity: item.quantity || 1,
        }));
        setSelectedItems(mappedItems);
      } else {
        reset({
          title: '',
          dealType: dealTypeOptions[0]?.value || '',
          discountPercentage: 0,
          description: '',
          image: null,
        });
        setSelectedItems([]);
      }
    }
  }, [open, initialValues, reset, dealCategories]);

  const handleAddItem = () => {
    if (products.length === 0) return;
    setSelectedItems((prev) => [...prev, { productId: products[0]._id, quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('dealType', values.dealType);
    formData.append('originalPrice', calculatedOriginalPrice);
    formData.append('dealPrice', calculatedDealPrice); // Sends calculated final price
    formData.append('description', values.description || '');

    const formattedItems = selectedItems.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));

    formData.append('items', JSON.stringify(formattedItems));

    if (values.image) {
      formData.append('image', values.image);
    }

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Deal / Bundle' : 'Create New Deal'}
      open={open}
      onCancel={onClose}
      width={650}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4">
        <FormInput name="title" label="Deal Title" placeholder="e.g. Budget Combo 1" control={control} />

        <FormSelect
          name="dealType"
          label="Deal Category / Type"
          placeholder={fetchingDealCategories ? 'Loading deal types...' : 'Select deal type'}
          control={control}
          options={dealTypeOptions}
          loading={fetchingDealCategories}
        />

        {/* Dynamic Included Products Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-800">Included Products in Deal</span>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              disabled={fetchingProducts || products.length === 0}
            >
              Add Product
            </Button>
          </div>

          {selectedItems.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2 text-center">No products added to this deal yet.</p>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-white p-2.5 rounded-md border border-gray-200">
                  <Select
                    className="flex-1"
                    showSearch
                    optionFilterProp="children"
                    value={item.productId}
                    onChange={(val) => handleItemChange(index, 'productId', val)}
                    options={products.map((p) => ({
                      value: p._id,
                      label: `${p.name} (Rs. ${p.price})`,
                    }))}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">Qty:</span>
                    <InputNumber
                      min={1}
                      max={20}
                      value={item.quantity}
                      onChange={(val) => handleItemChange(index, 'quantity', val || 1)}
                      style={{ width: 65 }}
                    />
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveItem(index)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Automatic Price Summary */}
          <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
            <span className="text-gray-600 font-medium">Original Combined Value:</span>
            <span className="font-bold text-gray-900 text-sm">Rs. {calculatedOriginalPrice}</span>
          </div>
        </div>

        {/* Discount & Calculated Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            name="discountPercentage"
            label="Discount Percentage (%)"
            type="number"
            placeholder="e.g. 20"
            control={control}
          />

          <div className="flex flex-col justify-center bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Calculated Final Price:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-bold text-gray-900">Rs. {calculatedDealPrice}</span>
              {Number(discountPercentage) > 0 && (
                <Tag color="green" className="font-bold text-xs">
                  {discountPercentage}% OFF
                </Tag>
              )}
            </div>
          </div>
        </div>

        <FormImageUpload name="image" label="Deal Banner / Image" control={control} />
        <FormInput name="description" label="Description" placeholder="e.g. 1 Zinger + 1 Regular Fries + 1 Drink" control={control} />

        <div className="flex justify-end pt-4 mt-6">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">Cancel</CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Deal' : 'Create Deal'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}