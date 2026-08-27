// src/app/admin/(dashboard)/inventory/_components/InventoryItemModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm, useWatch } from 'react-hook-form';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const CATEGORIES = [
  'Meat',
  'Dairy',
  'Bakery',
  'Produce',
  'Sauces & Condiments',
  'Packaging',
  'Beverages',
  'Other',
];

const PURCHASE_UNITS = [
  { label: 'Kilogram (kg)', value: 'kg', defaultFactor: 1000, recipeUnit: 'g' },
  { label: 'Liter (ltr)', value: 'liter', defaultFactor: 1000, recipeUnit: 'ml' },
  { label: 'Single Unit / Piece (pc)', value: 'piece', defaultFactor: 1, recipeUnit: 'piece' },
  { label: 'Carton (ctn)', value: 'carton', defaultFactor: 24, recipeUnit: 'piece' },
  { label: 'Box (bx)', value: 'box', defaultFactor: 100, recipeUnit: 'piece' },
  { label: 'Pack (pk)', value: 'pack', defaultFactor: 50, recipeUnit: 'piece' },
];

export default function InventoryItemModal({
  open,
  onClose,
  initialValues,
  suppliers = [],
  onSubmit,
  loading,
}) {
  const isEditing = Boolean(initialValues);

  const { register, handleSubmit, reset, setValue, control } = useForm({
    defaultValues: {
      name: '',
      sku: '',
      category: 'Meat',
      purchaseUnit: 'kg',
      recipeUnit: 'g',
      conversionFactor: 1000,
      costPerPurchaseUnit: 0,
      primarySupplier: '',
    },
  });

  const selectedPurchaseUnit = useWatch({ control, name: 'purchaseUnit' });
  const purchaseCost = useWatch({ control, name: 'costPerPurchaseUnit' }) || 0;
  const factor = useWatch({ control, name: 'conversionFactor' }) || 1;
  const recipeUnit = useWatch({ control, name: 'recipeUnit' }) || 'g';

  const calculatedCostPerRecipeUnit =
    factor > 0 ? (Number(purchaseCost) / Number(factor)).toFixed(4) : '0.0000';

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          sku: initialValues.sku || '',
          category: initialValues.category || 'Meat',
          purchaseUnit: initialValues.purchaseUnit || 'kg',
          recipeUnit: initialValues.recipeUnit || 'g',
          conversionFactor: initialValues.conversionFactor || 1000,
          costPerPurchaseUnit: initialValues.costPerPurchaseUnit || 0,
          primarySupplier: initialValues.primarySupplier?._id || initialValues.primarySupplier || '',
        });
      } else {
        reset({
          name: '',
          sku: '',
          category: 'Meat',
          purchaseUnit: 'kg',
          recipeUnit: 'g',
          conversionFactor: 1000,
          costPerPurchaseUnit: 0,
          primarySupplier: '',
        });
      }
    }
  }, [initialValues, reset, open]);

  const handleUnitChange = (e) => {
    const val = e.target.value;
    setValue('purchaseUnit', val);
    const matched = PURCHASE_UNITS.find((u) => u.value === val);
    if (matched) {
      setValue('conversionFactor', matched.defaultFactor);
      setValue('recipeUnit', matched.recipeUnit);
    }
  };

  const onFormSubmit = (data) => {
    onSubmit({
      name: data.name?.trim(),
      sku: data.sku?.trim().toUpperCase(),
      category: data.category || 'Meat',
      purchaseUnit: data.purchaseUnit || 'kg',
      recipeUnit: data.recipeUnit || 'g',
      conversionFactor: Number(data.conversionFactor) || 1,
      costPerPurchaseUnit: Number(data.costPerPurchaseUnit) || 0,
      primarySupplier: data.primarySupplier && data.primarySupplier !== '' ? data.primarySupplier : null,
    });
  };

  return (
    <CustomModal
      open={open}
      onCancel={onClose}
      title={isEditing ? 'Edit Raw Inventory Item' : 'Register Raw Material / Ingredient'}
      width={560}
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Item Name & SKU Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Beef Mince (80/20)"
              {...register('name', { required: true })}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              SKU / Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. RAW-BEEF-01"
              {...register('sku', { required: true })}
              disabled={isEditing}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#F4C61A] disabled:bg-neutral-100 disabled:text-neutral-500 transition"
              required
            />
          </div>
        </div>

        {/* Category & Supplier Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Primary Supplier
            </label>
            <select
              {...register('primarySupplier')}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
            >
              <option value="">Unassigned</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unit Conversion & Math Box */}
        <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-3.5">
          <span className="text-xs font-semibold text-neutral-800 block">
            Unit Conversion & Recipe Math
          </span>

          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div>
              <label className="block text-neutral-500 mb-1 font-medium text-[11px]">Purchase Unit</label>
              <select
                value={selectedPurchaseUnit}
                onChange={handleUnitChange}
                className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-semibold text-xs text-neutral-800 focus:outline-none focus:border-[#F4C61A] cursor-pointer"
              >
                {PURCHASE_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-500 mb-1 font-medium text-[11px]">Factor Ratio</label>
              <input
                type="number"
                {...register('conversionFactor', { required: true, min: 1 })}
                className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-white font-mono font-bold text-xs text-neutral-900 focus:outline-none focus:border-[#F4C61A]"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-500 mb-1 font-medium text-[11px]">Recipe Unit</label>
              <input
                type="text"
                {...register('recipeUnit', { required: true })}
                className="w-full h-9 px-2.5 rounded-xl border border-neutral-200 bg-neutral-100 font-semibold text-xs text-neutral-600 focus:outline-none"
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/60">
            <div>
              <label className="block text-neutral-600 text-xs font-semibold mb-1">
                Purchase Cost (per {selectedPurchaseUnit})
              </label>
              <div className="flex items-center">
                <span className="px-3 h-9 bg-neutral-100 border border-r-0 border-neutral-200 rounded-l-xl text-xs font-semibold text-neutral-600 flex items-center">
                  Rs.
                </span>
                <input
                  type="number"
                  step="any"
                  {...register('costPerPurchaseUnit', { required: true, min: 0 })}
                  className="w-full h-9 px-3 rounded-r-xl border border-neutral-200 bg-white font-bold text-neutral-900 text-xs focus:outline-none focus:border-[#F4C61A]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-600 text-xs font-semibold mb-1">
                Calculated Recipe Cost
              </label>
              <div className="h-9 px-3.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between text-xs font-semibold text-neutral-900 font-mono">
                <span>Rs. {calculatedCostPerRecipeUnit}</span>
                <span className="text-[11px] font-normal text-neutral-400 font-sans">/ {recipeUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Save Changes' : 'Register Item'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}