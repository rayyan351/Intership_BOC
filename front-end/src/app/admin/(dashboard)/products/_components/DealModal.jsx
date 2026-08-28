// src/app/admin/(dashboard)/products/_components/DealModal.jsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Space, Select, Tag, TimePicker, DatePicker, Radio } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  AppstoreAddOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
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

  // Add Custom Option
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
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-800 bg-slate-100 px-2 py-0.5 rounded-md mr-1 my-0.5">
        <span>{display}</span>
        {closable && (
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700 cursor-pointer ml-1">
            ×
          </button>
        )}
      </span>
    );
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Deal / Bundle' : 'Create New Deal'}
      open={open}
      onCancel={onClose}
      width={780}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-5 max-h-[78vh] overflow-y-auto pr-1 font-['Plus_Jakarta_Sans',sans-serif]">
        <FormInput
          name="title"
          label="Deal Title"
          placeholder="e.g. Sliders Party Box, Midnight Deal Box"
          control={control}
        />

        <FormSelect
          name="dealType"
          label="Deal Category / Type"
          placeholder={fetchingDealCategories ? 'Loading deal types...' : 'Select deal type'}
          control={control}
          options={dealTypeOptions}
          loading={fetchingDealCategories}
        />

        {/* TIME & SCHEDULE RESTRICTIONS */}
        <div className="border border-amber-200/80 rounded-2xl p-4 bg-amber-50/40 space-y-3">
          <div>
            <span className="text-xs font-bold text-amber-900 block tracking-tight">
              Deal Availability & Schedule
            </span>
            <span className="text-[11px] text-amber-700 font-normal">
              Choose when this deal appears and is orderable on the storefront.
            </span>
          </div>

          <Controller
            name="availabilityType"
            control={control}
            render={({ field }) => (
              <Radio.Group {...field} className="flex flex-wrap gap-3">
                <Radio value="always" className="text-xs font-semibold">Always Available (24/7)</Radio>
                <Radio value="time_window" className="text-xs font-semibold">Daily Time Window (e.g. Midnight Deal)</Radio>
                <Radio value="date_range" className="text-xs font-semibold">Seasonal / Date Range (e.g. Ramadan, Eid)</Radio>
              </Radio.Group>
            )}
          />

          {availabilityType === 'time_window' && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-amber-200">
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
                className="w-full sm:w-auto rounded-xl"
              />
              <span className="text-[11px] text-neutral-400 font-normal">
                (Supports overnight windows like 23:30 to 04:00)
              </span>
            </div>
          )}

          {availabilityType === 'date_range' && (
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-amber-200">
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
                className="w-full sm:w-auto rounded-xl"
              />
            </div>
          )}
        </div>

        {/* 1. FIXED INCLUSIONS */}
        <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/60 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-neutral-900 block tracking-tight">
                Fixed Items (Always Included)
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                Items that come automatically with this meal (e.g. Burger, Fries, Soft Drink)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddFixedItem}
              disabled={products.length === 0}
              className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1 cursor-pointer"
            >
              <PlusOutlined className="text-[10px]" /> Add Item
            </button>
          </div>

          {fixedItems.length === 0 ? (
            <p className="text-xs text-neutral-400 font-normal py-2 text-center">No fixed items added.</p>
          ) : (
            <div className="space-y-2">
              {fixedItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-neutral-200">
                  <Select
                    className="flex-1 h-9 staff-modern-select"
                    showSearch
                    optionFilterProp="label"
                    value={item.productId}
                    onChange={(val) => handleFixedItemChange(index, 'productId', val)}
                    options={products.map((p) => ({
                      value: String(p._id),
                      label: `${p.name} ${p.price > 0 ? `(Rs. ${p.price})` : ''}`,
                    }))}
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-neutral-400 font-medium">Qty:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={item.quantity}
                      onChange={(e) => handleFixedItemChange(index, 'quantity', Number(e.target.value) || 1)}
                      className="w-16 h-9 px-2 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFixedItem(index)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <DeleteOutlined className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. CUSTOMER CHOICE GROUPS */}
        <div className="border border-purple-200/70 rounded-2xl p-4 bg-purple-50/30 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-purple-900 block tracking-tight">
                Customer Choice Groups & Options
              </span>
              <span className="text-[11px] text-purple-600 font-normal">
                e.g. &quot;Pick 1 Slider&quot;, &quot;Choose 2 Dips&quot;, &quot;Select Soft Drink&quot;
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddChoiceGroup}
              className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
            >
              <AppstoreAddOutlined className="text-xs" /> Add Choice Group
            </button>
          </div>

          {choiceGroups.length === 0 ? (
            <p className="text-xs text-purple-400 font-normal py-2 text-center">No choice groups added.</p>
          ) : (
            <div className="space-y-4">
              {choiceGroups.map((cg, groupIndex) => {
                const selectedProductIds = (cg.options || [])
                  .filter((opt) => opt.productId)
                  .map((opt) => String(opt.productId));

                const draftName = customInputDrafts[groupIndex] || '';

                return (
                  <div key={groupIndex} className="bg-white p-4 rounded-2xl border border-purple-200 space-y-3 shadow-2xs">
                    {/* Header: Title & Pick Count */}
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="e.g. Pick 1 Slider OR Select Dip"
                        value={cg.title}
                        onChange={(e) => handleChoiceGroupFieldChange(groupIndex, 'title', e.target.value)}
                        className="flex-1 h-9 px-3 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                      />
                      <div className="flex items-center gap-1.5 whitespace-nowrap bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
                        <span className="text-xs text-purple-700 font-semibold">Pick Count:</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={cg.selectCount}
                          onChange={(e) => handleChoiceGroupFieldChange(groupIndex, 'selectCount', Number(e.target.value) || 1)}
                          className="w-12 h-7 px-1.5 rounded-lg border border-purple-200 bg-white font-mono font-bold text-xs text-neutral-900 text-center focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveChoiceGroup(groupIndex)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <DeleteOutlined className="text-xs" />
                      </button>
                    </div>

                    {/* Multi-Select Menu Products */}
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 mb-1 block">
                        Add Menu Products to Selection Pool:
                      </span>
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        maxTagCount="responsive"
                        className="w-full staff-modern-select"
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

                    {/* Presets */}
                    <div>
                      <span className="text-[11px] font-medium text-neutral-500 mb-1 block">Quick Add Presets:</span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {[...KIDDY_BOX_PRESETS, ...DIP_PRESETS].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddCustomOption(groupIndex, preset)}
                            className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Option Text Add */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add custom option (e.g. Robot Box, Glow Toy)..."
                        value={draftName}
                        onChange={(e) =>
                          setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomOption(groupIndex, draftName);
                            setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                          }
                        }}
                        className="flex-1 h-8 px-3 rounded-xl border border-neutral-200 text-xs font-normal focus:outline-none focus:border-[#F4C61A]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleAddCustomOption(groupIndex, draftName);
                          setCustomInputDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                        }}
                        disabled={!draftName.trim()}
                        className="h-8 px-3 rounded-xl bg-neutral-900 hover:bg-black disabled:opacity-40 text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Add Option
                      </button>
                    </div>

                    {/* Configured Options List */}
                    {cg.options && cg.options.length > 0 && (
                      <div className="pt-2 border-t border-neutral-100">
                        <span className="text-xs font-semibold text-neutral-700 block mb-2">
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
                                className="flex items-center justify-between bg-slate-50/70 px-2.5 py-1.5 rounded-xl border border-slate-100 text-xs"
                              >
                                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                      isProduct ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {isProduct ? 'Product' : 'Custom'}
                                  </span>
                                  <span className="font-semibold text-neutral-800 truncate" title={optionDisplayName}>
                                    {optionDisplayName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className="text-neutral-400 text-[10px]">+Rs.</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={2000}
                                    placeholder="0"
                                    value={opt.extraPrice}
                                    onChange={(e) => handleOptionExtraPriceChange(groupIndex, optIdx, Number(e.target.value) || 0)}
                                    className="w-16 h-7 px-1.5 rounded-lg border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(groupIndex, optIdx)}
                                    className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  >
                                    <DeleteOutlined className="text-xs" />
                                  </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <FormInput
            name="customOriginalPrice"
            label="Original Value (Rs.)"
            type="number"
            placeholder="e.g. 599"
            control={control}
          />

          <FormInput
            name="discountPercentage"
            label="Discount (%)"
            type="number"
            placeholder="e.g. 10"
            control={control}
          />

          <div className="flex flex-col justify-center bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
            <span className="text-xs text-neutral-500 font-semibold tracking-tight">Final Deal Price:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold font-mono text-neutral-900">Rs. {calculatedDealPrice}</span>
              {Number(discountPercentage) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>
          </div>
        </div>

        <FormImageUpload name="image" label="Deal Banner / Image" control={control} />
        <FormInput
          name="description"
          label="Description"
          placeholder="e.g. 1 fried chicken burger, 1 fries, 1 flavored milk, and 1 surprise cool toy."
          control={control}
        />

        <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Save Changes' : 'Create Deal'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}