// front-end/src/app/admin/products/deals/_components/DealModal.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Space, Button, InputNumber, Select, Tag, Input } from 'antd';
import { PlusOutlined, DeleteOutlined, AppstoreAddOutlined } from '@ant-design/icons';
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

const DIP_PRESETS = ['Chili Garlic Dip', 'Chipotle Mayo Dip', 'Mayo Garlic Dip'];

const schema = yup.object().shape({
  title: yup.string().required('Deal title is required'),
  dealType: yup.string().required('Select deal category / type'),
  customOriginalPrice: yup
    .number()
    .typeError('Enter valid original price')
    .min(0, 'Original price cannot be negative')
    .optional(),
  discountPercentage: yup
    .number()
    .typeError('Enter valid discount percentage')
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

  const [fixedItems, setFixedItems] = useState([]);
  // Normalized options structure: { productId: string | null, name: string, extraPrice: number }
  const [choiceGroups, setChoiceGroups] = useState([]);

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      dealType: '',
      customOriginalPrice: '',
      discountPercentage: 0,
      description: '',
      image: null,
    },
  });

  const discountPercentage = useWatch({ control, name: 'discountPercentage' }) || 0;
  const customOriginalPrice = useWatch({ control, name: 'customOriginalPrice' });

  const dealTypeOptions = dealCategories.map((cat) => ({
    label: cat.label,
    value: cat.label,
  }));

  // 1. Calculate sum from fixed items
  const fixedItemsSum = fixedItems.reduce((sum, item) => {
    const prod = products.find((p) => p._id === item.productId);
    return sum + (prod ? prod.price * (item.quantity || 1) : 0);
  }, 0);

  // 2. Calculate baseline sum from choice groups
  const choiceGroupsSum = choiceGroups.reduce((sum, group) => {
    const groupPrices = (group.options || []).map((opt) => {
      if (opt.productId) {
        const prod = products.find((p) => p._id === opt.productId);
        return prod ? prod.price : 0;
      }
      return 0;
    });

    const maxPriceInGroup = groupPrices.length > 0 ? Math.max(...groupPrices) : 0;
    return sum + maxPriceInGroup * (group.selectCount || 1);
  }, 0);

  const autoCalculatedTotal = fixedItemsSum + choiceGroupsSum;

  const effectiveOriginalPrice =
    customOriginalPrice !== undefined && customOriginalPrice !== '' && Number(customOriginalPrice) > 0
      ? Number(customOriginalPrice)
      : autoCalculatedTotal;

  const calculatedDealPrice = Math.round(
    effectiveOriginalPrice - (effectiveOriginalPrice * Number(discountPercentage)) / 100
  );

  useEffect(() => {
    if (open) {
      if (initialValues) {
        let existingDiscount = 0;
        if (initialValues.originalPrice && initialValues.dealPrice) {
          existingDiscount = Math.round(
            ((initialValues.originalPrice - initialValues.dealPrice) / initialValues.originalPrice) * 100
          );
        }

        reset({
          title: initialValues.title || '',
          dealType: initialValues.dealType || (dealTypeOptions[0]?.value || ''),
          customOriginalPrice: initialValues.originalPrice || '',
          discountPercentage: existingDiscount || 0,
          description: initialValues.description || '',
          image: null,
        });

        // 1. Map Fixed items cleanly
        const mappedFixed = (initialValues.fixedItems || initialValues.items || []).map((item) => ({
          productId: typeof item.product === 'object' ? item.product?._id : item.product,
          quantity: item.quantity || 1,
        }));
        setFixedItems(mappedFixed);

        // 2. Map Choice groups cleanly (Extract ID string and exact product name)
        const mappedChoices = (initialValues.choiceGroups || []).map((cg) => ({
          title: cg.title || '',
          selectCount: cg.selectCount || 1,
          options: (cg.options || []).map((opt) => {
            const rawProd = opt.product;
            const prodId = rawProd ? (typeof rawProd === 'object' ? rawProd._id : rawProd) : null;
            const matchedProd = prodId ? products.find((p) => p._id === prodId) : null;
            const optName = opt.name || rawProd?.name || matchedProd?.name || 'Item';

            return {
              productId: prodId,
              name: optName,
              extraPrice: opt.extraPrice || 0,
            };
          }),
        }));
        setChoiceGroups(mappedChoices);
      } else {
        reset({
          title: '',
          dealType: dealTypeOptions[0]?.value || '',
          customOriginalPrice: '',
          discountPercentage: 0,
          description: '',
          image: null,
        });
        setFixedItems([]);
        setChoiceGroups([]);
      }
    }
  }, [open, initialValues, reset, dealCategories]);

  useEffect(() => {
    if (autoCalculatedTotal > 0 && (!customOriginalPrice || customOriginalPrice === '')) {
      setValue('customOriginalPrice', autoCalculatedTotal);
    }
  }, [autoCalculatedTotal, setValue]);

  // Fixed items helpers
  const handleAddFixedItem = () => {
    if (products.length === 0) return;
    setFixedItems((prev) => [...prev, { productId: products[0]._id, quantity: 1 }]);
  };

  const handleRemoveFixedItem = (index) => {
    setFixedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFixedItemChange = (index, field, value) => {
    setFixedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Choice Groups helpers
  const handleAddChoiceGroup = () => {
    setChoiceGroups((prev) => [
      ...prev,
      { title: `Choice Group ${prev.length + 1}`, selectCount: 1, options: [] },
    ]);
  };

  const handleRemoveChoiceGroup = (index) => {
    setChoiceGroups((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChoiceGroupFieldChange = (groupIndex, field, value) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => (i === groupIndex ? { ...cg, [field]: value } : cg))
    );
  };

  // Multi-select menu products handler
  const handleProductSelectChange = (groupIndex, selectedProductIds) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        const currentCustomOptions = cg.options.filter((opt) => !opt.productId);

        const newProductOptions = selectedProductIds.map((prodId) => {
          const existing = cg.options.find((opt) => opt.productId === prodId);
          if (existing) return existing;
          const prod = products.find((p) => p._id === prodId);
          return {
            productId: prodId,
            name: prod?.name || 'Item',
            extraPrice: 0,
          };
        });

        return {
          ...cg,
          options: [...newProductOptions, ...currentCustomOptions],
        };
      })
    );
  };

  // Add Dip Preset / Custom non-menu option
  const handleAddCustomOption = (groupIndex, customName) => {
    if (!customName || !customName.trim()) return;
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        if (cg.options.some((opt) => opt.name.toLowerCase() === customName.trim().toLowerCase())) {
          return cg;
        }
        return {
          ...cg,
          options: [...cg.options, { productId: null, name: customName.trim(), extraPrice: 0 }],
        };
      })
    );
  };

  const handleOptionExtraPriceChange = (groupIndex, optionIndex, extraPrice) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        const updatedOptions = cg.options.map((opt, oi) =>
          oi === optionIndex ? { ...opt, extraPrice: extraPrice || 0 } : opt
        );
        return { ...cg, options: updatedOptions };
      })
    );
  };

  const handleRemoveOption = (groupIndex, optionIndex) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        return { ...cg, options: cg.options.filter((_, oi) => oi !== optionIndex) };
      })
    );
  };

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('dealType', values.dealType);
    formData.append('originalPrice', effectiveOriginalPrice);
    formData.append('dealPrice', calculatedDealPrice);
    formData.append('description', values.description || '');

    const formattedFixed = fixedItems.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));
    formData.append('fixedItems', JSON.stringify(formattedFixed));

    const formattedChoices = choiceGroups.map((cg) => ({
      title: cg.title,
      selectCount: cg.selectCount,
      required: true,
      options: cg.options.map((opt) => ({
        product: opt.productId || null,
        name: opt.name,
        extraPrice: Number(opt.extraPrice) || 0,
      })),
    }));
    formData.append('choiceGroups', JSON.stringify(formattedChoices));

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
      width={780}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-5 max-h-[78vh] overflow-y-auto pr-1">
        <FormInput name="title" label="Deal Title" placeholder="e.g. Sliders Party Box, Super Savor 1" control={control} />

        <FormSelect
          name="dealType"
          label="Deal Category / Type"
          placeholder={fetchingDealCategories ? 'Loading deal types...' : 'Select deal type'}
          control={control}
          options={dealTypeOptions}
          loading={fetchingDealCategories}
        />

        {/* 1. FIXED INCLUSIONS */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/60">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-800 block">Fixed Items (Always Included)</span>
              <span className="text-xs text-gray-500">Items that come automatically with this meal</span>
            </div>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddFixedItem}
              disabled={fetchingProducts || products.length === 0}
            >
              Add Fixed Item
            </Button>
          </div>

          {fixedItems.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2 text-center">No fixed items added.</p>
          ) : (
            <div className="space-y-2.5">
              {fixedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-white p-2 rounded-md border border-gray-200">
                  <Select
                    className="flex-1"
                    showSearch
                    optionFilterProp="label"
                    value={item.productId}
                    onChange={(val) => handleFixedItemChange(index, 'productId', val)}
                    options={products.map((p) => ({
                      value: p._id,
                      label: `${p.name} ${p.price > 0 ? `(Rs. ${p.price})` : ''}`,
                    }))}
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">Qty:</span>
                    <InputNumber
                      min={1}
                      max={20}
                      value={item.quantity}
                      onChange={(val) => handleFixedItemChange(index, 'quantity', val || 1)}
                      style={{ width: 60 }}
                    />
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveFixedItem(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. CUSTOMER CHOICE GROUPS */}
        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/30">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm font-semibold text-purple-900 block">Customer Choice Groups & Upgrades</span>
              <span className="text-xs text-purple-600">e.g. "Choose Fries (+Rs. 300 for Loaded)", "Select 3 Dips"</span>
            </div>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<AppstoreAddOutlined />}
              onClick={handleAddChoiceGroup}
            >
              Add Choice Group
            </Button>
          </div>

          {choiceGroups.length === 0 ? (
            <p className="text-xs text-purple-400 italic py-2 text-center">No customizable choice rules added.</p>
          ) : (
            <div className="space-y-4">
              {choiceGroups.map((cg, groupIndex) => {
                // Extract clean product string IDs to pre-fill the select field correctly
                const selectedProductIds = (cg.options || [])
                  .filter((opt) => Boolean(opt.productId))
                  .map((opt) => opt.productId);

                return (
                  <div key={groupIndex} className="bg-white p-4 rounded-lg border border-purple-200 space-y-3 shadow-xs">
                    {/* Header: Title & Pick Count */}
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="e.g. Choose Your Fries OR Select 3 Dips"
                        value={cg.title}
                        onChange={(e) => handleChoiceGroupFieldChange(groupIndex, 'title', e.target.value)}
                        className="font-medium text-gray-800"
                      />
                      <div className="flex items-center gap-1.5 whitespace-nowrap bg-purple-50 px-2.5 py-1 rounded-md border border-purple-100">
                        <span className="text-xs text-purple-700 font-semibold">Pick Count:</span>
                        <InputNumber
                          min={1}
                          max={10}
                          value={cg.selectCount}
                          onChange={(val) => handleChoiceGroupFieldChange(groupIndex, 'selectCount', val || 1)}
                          style={{ width: 55 }}
                        />
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveChoiceGroup(groupIndex)}
                      />
                    </div>

                    {/* Multi-Select Menu Products */}
                    <div>
                      <span className="text-xs text-gray-500 mb-1 block">Add Regular Menu Products to Choice Pool:</span>
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        className="w-full"
                        placeholder="Type to search burgers, fries, drinks..."
                        value={selectedProductIds}
                        onChange={(vals) => handleProductSelectChange(groupIndex, vals)}
                        options={products.map((p) => ({
                          value: p._id,
                          label: `${p.name} (Rs. ${p.price})`,
                        }))}
                      />
                    </div>

                    {/* Quick Add Dips Presets */}
                    <div>
                      <span className="text-xs text-gray-500 mb-1 block">Or Quick Add Dips / Sauces (Non-Menu Items):</span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {DIP_PRESETS.map((dipName) => (
                          <Button
                            key={dipName}
                            size="small"
                            onClick={() => handleAddCustomOption(groupIndex, dipName)}
                            className="text-xs"
                          >
                            + {dipName}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Option Details & +Extra Price Configuration */}
                    {cg.options.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-700 block mb-2">
                          Configured Options & Upgrade Prices:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cg.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs"
                            >
                              <div className="flex items-center gap-1.5 truncate max-w-42.5">
                                <Tag color={opt.productId ? 'blue' : 'orange'} className="text-[10px] px-1 py-0 m-0">
                                  {opt.productId ? 'Item' : 'Dip'}
                                </Tag>
                                <span className="font-medium text-gray-800 truncate" title={opt.name}>
                                  {opt.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-[11px]">+Rs.</span>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={2000}
                                  placeholder="0"
                                  value={opt.extraPrice}
                                  onChange={(val) => handleOptionExtraPriceChange(groupIndex, optIdx, val)}
                                  style={{ width: 60 }}
                                />
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined className="text-xs" />}
                                  onClick={() => handleRemoveOption(groupIndex, optIdx)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PRICING INPUTS */}
        <div className="grid grid-cols-3 gap-4">
          <FormInput
            name="customOriginalPrice"
            label="Original Value (Rs)"
            type="number"
            placeholder="e.g. 748"
            control={control}
          />

          <FormInput
            name="discountPercentage"
            label="Discount (%)"
            type="number"
            placeholder="e.g. 20"
            control={control}
          />

          <div className="flex flex-col justify-center bg-gray-50 p-3 rounded-md border border-gray-200">
            <span className="text-xs text-gray-500 font-medium">Final Deal Price:</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base font-bold text-gray-900">Rs. {calculatedDealPrice}</span>
              {Number(discountPercentage) > 0 && (
                <Tag color="green" className="font-bold text-[10px] px-1 py-0">
                  {discountPercentage}% OFF
                </Tag>
              )}
            </div>
          </div>
        </div>

        <FormImageUpload name="image" label="Deal Banner / Image" control={control} />
        <FormInput name="description" label="Description" placeholder="e.g. 1 Value Burger + 1 Drink + 3 Dips" control={control} />

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
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