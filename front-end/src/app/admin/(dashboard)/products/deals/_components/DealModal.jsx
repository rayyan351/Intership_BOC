'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Space, Button, InputNumber, Select, Tag, Input, Radio, TimePicker, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, AppstoreAddOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import { useGetProductsQuery } from '@/services/productApi';
import { useGetDealCategoriesQuery } from '@/services/dealCategoryApi';

const DIP_PRESETS = ['Chili Garlic Dip', 'Chipotle Mayo Dip', 'Mayo Garlic Dip'];
const KIDDY_BOX_PRESETS = ['Kitty Box', 'Dinosaur Box', 'Unicorn Box', 'Cool Toy'];

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
  availabilityType: yup.string().default('always'),
  startTime: yup.string().optional(),
  endTime: yup.string().optional(),
  startDate: yup.mixed().optional().nullable(),
  endDate: yup.mixed().optional().nullable(),
  description: yup.string().optional(),
  image: yup.mixed().nullable(),
});

export default function DealModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { data: products = [] } = useGetProductsQuery(undefined, { skip: !open });
  const { data: dealCategories = [], isLoading: fetchingDealCategories } = useGetDealCategoriesQuery(
    undefined,
    { skip: !open }
  );

  const [fixedItems, setFixedItems] = useState([]);
  const [choiceGroups, setChoiceGroups] = useState([]);
  const [customInputDrafts, setCustomInputDrafts] = useState({});

  // Fast ID Lookup Map
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      map.set(String(p._id), p);
      if (p.id) map.set(String(p.id), p);
    });
    return map;
  }, [products]);

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      dealType: '',
      customOriginalPrice: '',
      discountPercentage: 0,
      availabilityType: 'always',
      startTime: '',
      endTime: '',
      startDate: null,
      endDate: null,
      description: '',
      image: null,
    },
  });

  const discountPercentage = useWatch({ control, name: 'discountPercentage' }) || 0;
  const customOriginalPrice = useWatch({ control, name: 'customOriginalPrice' });
  const availabilityType = useWatch({ control, name: 'availabilityType' });
  const watchedStartTime = useWatch({ control, name: 'startTime' });
  const watchedEndTime = useWatch({ control, name: 'endTime' });
  const watchedStartDate = useWatch({ control, name: 'startDate' });
  const watchedEndDate = useWatch({ control, name: 'endDate' });

  const dealTypeOptions = dealCategories.map((cat) => ({
    label: cat.label,
    value: cat.label,
  }));

  const extractId = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val._id) return String(val._id);
    return null;
  };

  // 1. Fixed Items Sum
  const fixedItemsSum = fixedItems.reduce((sum, item) => {
    const prod = productMap.get(String(item.productId));
    return sum + (prod ? prod.price * (item.quantity || 1) : 0);
  }, 0);

  // 2. Choice Groups Baseline Sum
  const choiceGroupsSum = choiceGroups.reduce((sum, group) => {
    const groupPrices = (group.options || []).map((opt) => {
      if (opt.productId) {
        const prod = productMap.get(String(opt.productId));
        return prod ? prod.price : 0;
      }
      return 0;
    });

    const maxPriceInGroup = groupPrices.length > 0 ? Math.max(...groupPrices, 0) : 0;
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
          availabilityType: initialValues.availabilityType || 'always',
          startTime: initialValues.startTime || '',
          endTime: initialValues.endTime || '',
          startDate: initialValues.startDate ? dayjs(initialValues.startDate) : null,
          endDate: initialValues.endDate ? dayjs(initialValues.endDate) : null,
          description: initialValues.description || '',
          image: null,
        });

        // Map Fixed items
        const rawFixed = initialValues.fixedItems || initialValues.items || [];
        const mappedFixed = rawFixed.map((item) => ({
          productId: extractId(item.product) || extractId(item),
          quantity: item.quantity || 1,
        }));
        setFixedItems(mappedFixed);

        // Map Choice Groups
        const rawChoiceGroups = initialValues.choiceGroups || [];
        const mappedChoices = rawChoiceGroups.map((cg) => ({
          title: cg.title || '',
          selectCount: cg.selectCount || 1,
          options: (cg.options || []).map((opt) => {
            const rawId = extractId(opt.product) || (opt.productId ? String(opt.productId) : null);
            const isCustom = !rawId && opt.name;

            return {
              productId: isCustom ? null : rawId,
              name: opt.name || 'Item',
              image: opt.image || null,
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
          availabilityType: 'always',
          startTime: '00:00',
          endTime: '04:00',
          startDate: null,
          endDate: null,
          description: '',
          image: null,
        });
        setFixedItems([]);
        setChoiceGroups([]);
      }
    }
  }, [open, initialValues, reset]);

  useEffect(() => {
    if (autoCalculatedTotal > 0 && (!customOriginalPrice || customOriginalPrice === '')) {
      setValue('customOriginalPrice', autoCalculatedTotal);
    }
  }, [autoCalculatedTotal, setValue, customOriginalPrice]);

  // Fixed items helpers
  const handleAddFixedItem = () => {
    if (products.length === 0) return;
    setFixedItems((prev) => [...prev, { productId: String(products[0]._id), quantity: 1 }]);
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

  // Product Selection Change
  const handleProductSelectChange = (groupIndex, selectedProductIds) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;

        const customItems = (cg.options || []).filter((opt) => !opt.productId);

        const productItems = selectedProductIds.map((prodId) => {
          const existing = (cg.options || []).find((opt) => String(opt.productId) === String(prodId));
          const prod = productMap.get(String(prodId));

          if (existing) {
            return {
              ...existing,
              name: prod?.name || existing.name,
            };
          }

          return {
            productId: String(prodId),
            name: prod?.name || 'Item',
            image: prod?.image || null,
            extraPrice: 0,
          };
        });

        return {
          ...cg,
          options: [...productItems, ...customItems],
        };
      })
    );
  };

  // Add Custom Option (Box, Toy, Dip, etc.)
  const handleAddCustomOption = (groupIndex, customName, customImage = null) => {
    if (!customName || !customName.trim()) return;
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        const exists = (cg.options || []).some(
          (opt) => opt.name?.toLowerCase() === customName.trim().toLowerCase()
        );
        if (exists) return cg;

        return {
          ...cg,
          options: [
            ...(cg.options || []),
            { productId: null, name: customName.trim(), image: customImage, extraPrice: 0 },
          ],
        };
      })
    );
  };

  const handleOptionExtraPriceChange = (groupIndex, optionIndex, extraPrice) => {
    setChoiceGroups((prev) =>
      prev.map((cg, i) => {
        if (i !== groupIndex) return cg;
        const updatedOptions = (cg.options || []).map((opt, oi) =>
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
        return { ...cg, options: (cg.options || []).filter((_, oi) => oi !== optionIndex) };
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
    formData.append('availabilityType', values.availabilityType || 'always');

    if (values.availabilityType === 'time_window') {
      formData.append('startTime', values.startTime || '');
      formData.append('endTime', values.endTime || '');
    } else if (values.availabilityType === 'date_range') {
      formData.append('startDate', values.startDate ? new Date(values.startDate).toISOString() : '');
      formData.append('endDate', values.endDate ? new Date(values.endDate).toISOString() : '');
    }

    const formattedFixed = fixedItems.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
    }));
    formData.append('fixedItems', JSON.stringify(formattedFixed));

    const formattedChoices = choiceGroups.map((cg) => ({
      title: cg.title,
      selectCount: cg.selectCount,
      required: true,
      options: (cg.options || []).map((opt) => {
        const prod = opt.productId ? productMap.get(String(opt.productId)) : null;
        return {
          product: opt.productId || null,
          name: prod?.name || opt.name,
          image: opt.image || prod?.image || null,
          extraPrice: Number(opt.extraPrice) || 0,
        };
      }),
    }));
    formData.append('choiceGroups', JSON.stringify(formattedChoices));

    if (values.image) {
      formData.append('image', values.image);
    }

    onSubmit(formData);
  };

  const renderProductTag = ({ label, value, closable, onClose }) => {
    const prod = productMap.get(String(value));
    const display = label || prod?.name || value;

    return (
      <Tag
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 4 }}
        className="text-xs font-semibold text-gray-800 bg-gray-100 border-gray-200"
      >
        {display}
      </Tag>
    );
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Deal / Bundle' : 'Create New Deal'}
      open={open}
      onCancel={onClose}
      width={780}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-5 max-h-[78vh] overflow-y-auto pr-1">
        <FormInput name="title" label="Deal Title" placeholder="e.g. Sliders Party Box, Midnight Deals Box" control={control} />

        <FormSelect
          name="dealType"
          label="Deal Category / Type"
          placeholder={fetchingDealCategories ? 'Loading deal types...' : 'Select deal type'}
          control={control}
          options={dealTypeOptions}
          loading={fetchingDealCategories}
        />

        {/* TIME & SCHEDULE RESTRICTIONS */}
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/40 space-y-3">
          <div>
            <span className="text-sm font-semibold text-amber-900 block">Deal Availability & Schedule</span>
            <span className="text-xs text-amber-700">Choose when this deal appears and is orderable on the storefront.</span>
          </div>

          <Controller
            name="availabilityType"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field} className="flex flex-wrap gap-3">
                <Radio value="always">Always Available (24/7)</Radio>
                <Radio value="time_window">Daily Time Window (e.g. Midnight Deal)</Radio>
                <Radio value="date_range">Seasonal / Date Range (e.g. Ramadan, Eid)</Radio>
              </Radio.Group>
            )}
          />

          {availabilityType === 'time_window' && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-md border border-amber-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 whitespace-nowrap">
                <ClockCircleOutlined /> Active Daily Hours:
              </div>
              <TimePicker.RangePicker
                format="HH:mm"
                value={[
                  watchedStartTime ? dayjs(watchedStartTime, 'HH:mm') : null,
                  watchedEndTime ? dayjs(watchedEndTime, 'HH:mm') : null,
                ]}
                onChange={(times, timeStrings) => {
                  setValue('startTime', timeStrings[0] || '');
                  setValue('endTime', timeStrings[1] || '');
                }}
                className="w-full sm:w-auto"
              />
              <span className="text-[11px] text-gray-500 italic">
                (Supports overnight windows like 23:30 to 04:00)
              </span>
            </div>
          )}

          {availabilityType === 'date_range' && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-md border border-amber-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 whitespace-nowrap">
                <CalendarOutlined /> Active Date Range:
              </div>
              <DatePicker.RangePicker
                showTime
                value={[
                  watchedStartDate ? dayjs(watchedStartDate) : null,
                  watchedEndDate ? dayjs(watchedEndDate) : null,
                ]}
                onChange={(dates) => {
                  setValue('startDate', dates ? dates[0] : null);
                  setValue('endDate', dates ? dates[1] : null);
                }}
                className="w-full sm:w-auto"
              />
            </div>
          )}
        </div>

        {/* 1. FIXED INCLUSIONS */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/60">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-800 block">Fixed Items (Always Included)</span>
              <span className="text-xs text-gray-500">Items that come automatically with this meal (e.g. Burger, Fries, Milk)</span>
            </div>
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAddFixedItem}
              disabled={products.length === 0}
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
                      value: String(p._id),
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
              <span className="text-sm font-semibold text-purple-900 block">Customer Choice Groups & Options</span>
              <span className="text-xs text-purple-600">e.g. "Meal Box" (Pick 1), "Surprise" (Pick 1), "Choose 3 Dips"</span>
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
            <p className="text-xs text-purple-400 italic py-2 text-center">No choice groups added.</p>
          ) : (
            <div className="space-y-4">
              {choiceGroups.map((cg, groupIndex) => {
                const selectedProductIds = (cg.options || [])
                  .filter((opt) => opt.productId)
                  .map((opt) => String(opt.productId));

                const draftName = customInputDrafts[groupIndex] || '';

                return (
                  <div key={groupIndex} className="bg-white p-4 rounded-lg border border-purple-200 space-y-3 shadow-xs">
                    {/* Header: Title & Pick Count */}
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="e.g. Meal Box OR Surprise OR Choose Fries"
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
                      <span className="text-xs text-gray-500 mb-1 block">Add Menu Products / Sliders to Pool:</span>
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        className="w-full"
                        placeholder="Select products..."
                        value={selectedProductIds}
                        tagRender={renderProductTag}
                        onChange={(vals) => handleProductSelectChange(groupIndex, vals)}
                        options={products.map((p) => ({
                          value: String(p._id),
                          label: `${p.name} ${p.isDealOnly ? '(Deal Only)' : `(Rs. ${p.price})`}`,
                        }))}
                      />
                    </div>

                    {/* Presets / Quick Add */}
                    <div>
                      <span className="text-xs text-gray-500 mb-1 block">Quick Add Presets:</span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {[...KIDDY_BOX_PRESETS, ...DIP_PRESETS].map((preset) => (
                          <Button
                            key={preset}
                            size="small"
                            onClick={() => handleAddCustomOption(groupIndex, preset)}
                            className="text-xs"
                          >
                            + {preset}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Text/Box/Toy Add Field */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        size="small"
                        placeholder="Add custom option (e.g. Robot Box, Glow Toy)..."
                        value={draftName}
                        onChange={(e) =>
                          setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: e.target.value }))
                        }
                        onPressEnter={() => {
                          handleAddCustomOption(groupIndex, draftName);
                          setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                        }}
                      />
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          handleAddCustomOption(groupIndex, draftName);
                          setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                        }}
                        disabled={!draftName.trim()}
                      >
                        Add Option
                      </Button>
                    </div>

                    {/* Configured Options List */}
                    {cg.options && cg.options.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-700 block mb-2">
                          Configured Options & Upgrades:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cg.options.map((opt, optIdx) => {
                            const isProduct = Boolean(opt.productId && productMap.has(String(opt.productId)));
                            const prod = isProduct ? productMap.get(String(opt.productId)) : null;
                            const optionDisplayName = prod?.name || opt.name;

                            return (
                              <div
                                key={optIdx}
                                className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs"
                              >
                                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                                  <Tag
                                    color={isProduct ? 'blue' : 'green'}
                                    className="text-[10px] px-1 py-0 m-0"
                                  >
                                    {isProduct ? 'Product' : 'Option'}
                                  </Tag>
                                  <span className="font-medium text-gray-800 truncate" title={optionDisplayName}>
                                    {optionDisplayName}
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
                            );
                          })}
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
            placeholder="e.g. 599"
            control={control}
          />

          <FormInput
            name="discountPercentage"
            label="Discount (%)"
            type="number"
            placeholder="e.g. 0"
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
        <FormInput name="description" label="Description" placeholder="e.g. 1 fried chicken burger, 1 fries, 1 flavored milk, and 1 surprise cool toy." control={control} />

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