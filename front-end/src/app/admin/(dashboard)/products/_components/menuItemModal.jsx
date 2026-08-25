// src/app/admin/(dashboard)/products/_components/menuItemModal.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Space, Button, InputNumber, Input, Tag, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import { useGetCategoriesQuery } from '@/services/categoryApi';

const schema = yup.object().shape({
  name: yup.string().required('Item name is required'),
  categories: yup
    .array()
    .of(yup.string())
    .min(1, 'Select at least one category')
    .required('Categories are required'),
  price: yup
    .number()
    .typeError('Enter a valid price')
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  description: yup.string().optional(),
  image: yup.mixed().nullable(),
  isShown: yup.boolean().default(true),
});

export default function MenuItemModal({
  open,
  onClose,
  onSubmit,
  loading = false,
  initialValues = null,
}) {
  const { data: categories = [], isLoading: fetchingCategories } = useGetCategoriesQuery(
    undefined,
    { skip: !open }
  );

  const [customizations, setCustomizations] = useState([]);
  const [customOptionDrafts, setCustomOptionDrafts] = useState({});

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      categories: [],
      price: '',
      description: '',
      image: null,
      isShown: true,
    },
  });

  const categoryOptions = categories.map((cat) => ({
    label: cat.label,
    value: cat.label,
  }));

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          categories: Array.isArray(initialValues.categories)
            ? initialValues.categories
            : initialValues.category
            ? [initialValues.category]
            : [],
          price: initialValues.price ?? '',
          description: initialValues.description || '',
          image: null,
          isShown: initialValues.isShown ?? true,
        });

        // Map existing customizations
        const rawCustomizations = initialValues.customizations || [];
        const mappedCustomizations = rawCustomizations.map((cg) => ({
          title: cg.title || '',
          required: cg.required ?? false,
          maxSelect: cg.maxSelect || cg.selectCount || 1,
          options: (cg.options || []).map((opt) => ({
            name: opt.name || '',
            extraPrice: opt.extraPrice || opt.price || 0,
          })),
        }));
        setCustomizations(mappedCustomizations);
      } else {
        reset({
          name: '',
          categories: [],
          price: '',
          description: '',
          image: null,
          isShown: true,
        });
        setCustomizations([]);
      }
    }
  }, [open, initialValues, reset]);

  // Customization group helpers
  const handleAddCustomizationGroup = () => {
    setCustomizations((prev) => [
      ...prev,
      {
        title: `Customization Group ${prev.length + 1}`,
        required: false,
        maxSelect: 1,
        options: [],
      },
    ]);
  };

  const handleRemoveCustomizationGroup = (index) => {
    setCustomizations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGroupFieldChange = (groupIndex, field, value) => {
    setCustomizations((prev) =>
      prev.map((group, i) => (i === groupIndex ? { ...group, [field]: value } : group))
    );
  };

  // Option management inside group
  const handleAddOptionToGroup = (groupIndex, optionName) => {
    if (!optionName || !optionName.trim()) return;
    setCustomizations((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        const exists = (group.options || []).some(
          (opt) => opt.name?.toLowerCase() === optionName.trim().toLowerCase()
        );
        if (exists) return group;

        return {
          ...group,
          options: [...(group.options || []), { name: optionName.trim(), extraPrice: 0 }],
        };
      })
    );
  };

  const handleOptionExtraPriceChange = (groupIndex, optionIndex, extraPrice) => {
    setCustomizations((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        const updatedOptions = (group.options || []).map((opt, oi) =>
          oi === optionIndex ? { ...opt, extraPrice: extraPrice || 0 } : opt
        );
        return { ...group, options: updatedOptions };
      })
    );
  };

  const handleRemoveOption = (groupIndex, optionIndex) => {
    setCustomizations((prev) =>
      prev.map((group, i) => {
        if (i !== groupIndex) return group;
        return { ...group, options: (group.options || []).filter((_, oi) => oi !== optionIndex) };
      })
    );
  };

  const handleFinish = (values) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('price', Number(values.price));
    formData.append('description', values.description || '');
    formData.append('isShown', values.isShown);

    if (values.categories && Array.isArray(values.categories)) {
      values.categories.forEach((cat) => {
        formData.append('categories', cat);
      });
    }

    if (values.image) {
      formData.append('image', values.image);
    }

    const formattedCustomizations = customizations.map((cg) => ({
      title: cg.title,
      required: cg.required,
      maxSelect: cg.maxSelect,
      options: (cg.options || []).map((opt) => ({
        name: opt.name,
        extraPrice: Number(opt.extraPrice) || 0,
      })),
    }));
    formData.append('customizations', JSON.stringify(formattedCustomizations));

    onSubmit(formData);
  };

  return (
    <CustomModal
      title={initialValues ? 'Edit Menu Item' : 'Add New Menu Item'}
      open={open}
      onCancel={onClose}
      width={780}
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-5 max-h-[78vh] overflow-y-auto pr-1">
        <FormInput
          name="name"
          label="Item Name"
          placeholder="e.g. Classic Gourmet Beef Burger, Dynamite Wings"
          control={control}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            name="categories"
            label="Categories"
            mode="multiple"
            placeholder={fetchingCategories ? 'Loading categories...' : 'Select categories'}
            control={control}
            options={categoryOptions}
            loading={fetchingCategories}
          />

          <FormInput
            name="price"
            label="Price (PKR)"
            type="number"
            placeholder="e.g. 750"
            control={control}
          />
        </div>

        {/* CUSTOMIZATION GROUPS (Add-ons, Sauces, Patty Upgrades) */}
        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/30">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm font-semibold text-amber-900 block">
                Customizations & Add-on Groups
              </span>
              <span className="text-xs text-amber-700">
                Optional or required item modifiers (e.g. Extra Cheese Slice, Double Patty, Sauce Options).
              </span>
            </div>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<AppstoreAddOutlined />}
              onClick={handleAddCustomizationGroup}
            >
              Add Group
            </Button>
          </div>

          {customizations.length === 0 ? (
            <p className="text-xs text-amber-600/70 italic py-2 text-center">
              No customization options added for this item.
            </p>
          ) : (
            <div className="space-y-4">
              {customizations.map((group, groupIndex) => {
                const draftName = customOptionDrafts[groupIndex] || '';

                return (
                  <div
                    key={groupIndex}
                    className="bg-white p-4 rounded-lg border border-amber-200 space-y-3 shadow-xs"
                  >
                    {/* Header: Title, Required Flag, Max Select */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <Input
                        placeholder="e.g. Add Extra Toppings OR Choose Bun Style"
                        value={group.title}
                        onChange={(e) =>
                          handleGroupFieldChange(groupIndex, 'title', e.target.value)
                        }
                        className="font-medium text-gray-800 flex-1"
                      />

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                          <span className="text-xs text-amber-800 font-semibold">Max Pick:</span>
                          <InputNumber
                            min={1}
                            max={10}
                            value={group.maxSelect}
                            onChange={(val) =>
                              handleGroupFieldChange(groupIndex, 'maxSelect', val || 1)
                            }
                            style={{ width: 55 }}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200">
                          <span className="text-xs text-neutral-600 font-semibold">Required:</span>
                          <Switch
                            size="small"
                            checked={group.required}
                            onChange={(checked) =>
                              handleGroupFieldChange(groupIndex, 'required', checked)
                            }
                          />
                        </div>

                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveCustomizationGroup(groupIndex)}
                        />
                      </div>
                    </div>

                    {/* Quick Input for modifier options */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        size="small"
                        placeholder="Add option (e.g. Extra Cheddar Cheese, Jalapeno Dip)..."
                        value={draftName}
                        onChange={(e) =>
                          setCustomOptionDrafts((prev) => ({
                            ...prev,
                            [groupIndex]: e.target.value,
                          }))
                        }
                        onPressEnter={() => {
                          handleAddOptionToGroup(groupIndex, draftName);
                          setCustomOptionDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                        }}
                      />
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          handleAddOptionToGroup(groupIndex, draftName);
                          setCustomOptionDrafts((prev) => ({ ...prev, [groupIndex]: '' }));
                        }}
                        disabled={!draftName.trim()}
                      >
                        Add
                      </Button>
                    </div>

                    {/* Options List */}
                    {group.options && group.options.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs font-semibold text-gray-700 block mb-2">
                          Options & Upgrade Charges:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs"
                            >
                              <span className="font-medium text-gray-800 truncate max-w-[170px]">
                                {opt.name}
                              </span>

                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-[11px]">+Rs.</span>
                                <InputNumber
                                  size="small"
                                  min={0}
                                  max={2000}
                                  placeholder="0"
                                  value={opt.extraPrice}
                                  onChange={(val) =>
                                    handleOptionExtraPriceChange(groupIndex, optIdx, val)
                                  }
                                  style={{ width: 65 }}
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

        <FormImageUpload name="image" label="Product Image" control={control} />

        <FormInput
          name="description"
          label="Description"
          placeholder="e.g. Smashed beef patty with melted cheddar, iceberg lettuce, and signature sauce."
          control={control}
        />

        <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-lg border border-neutral-200">
          <div>
            <span className="text-xs font-bold text-gray-800 block">Live Menu Visibility</span>
            <span className="text-[11px] text-gray-500">
              When enabled, this item appears across the live storefront menu.
            </span>
          </div>
          <Controller
            name="isShown"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Switch checked={value} onChange={onChange} />
            )}
          />
        </div>

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Item' : 'Create Item'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}