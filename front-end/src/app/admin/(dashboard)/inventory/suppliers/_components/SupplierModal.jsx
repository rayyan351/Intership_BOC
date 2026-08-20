// src/app/admin/(dashboard)/inventory/suppliers/_components/SupplierModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Modal } from 'antd';
import { useForm } from 'react-hook-form';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';

const PAYMENT_TERMS = [
  { label: 'Cash on Delivery (COD)', value: 'COD' },
  { label: 'Net 7 Days', value: 'NET_7' },
  { label: 'Net 15 Days', value: 'NET_15' },
  { label: 'Net 30 Days', value: 'NET_30' },
  { label: 'Prepaid / Advance', value: 'PREPAID' },
];

export default function SupplierModal({
  open,
  onClose,
  initialValues,
  onSubmit,
  loading,
}) {
  const isEditing = Boolean(initialValues);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
      paymentTerms: 'COD',
    },
  });

  useEffect(() => {
    if (initialValues && open) {
      reset({
        name: initialValues.name || '',
        contactPerson: initialValues.contactPerson || '',
        phone: initialValues.phone || '',
        email: initialValues.email || '',
        address: initialValues.address || '',
        taxNumber: initialValues.taxNumber || '',
        paymentTerms: initialValues.paymentTerms || 'COD',
      });
    } else if (open) {
      reset({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        paymentTerms: 'COD',
      });
    }
  }, [initialValues, open, reset]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      centered
      width={560}
      className="font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div className="pt-2 pb-1">
        <h3 className="text-lg font-bold text-neutral-900 m-0">
          {isEditing ? 'Edit Supplier / Vendor' : 'Register New Vendor / Supplier'}
        </h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Maintain vendor contact information, business identifiers, and commercial payment terms.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Business / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Al-Madina Fresh Poultry"
                {...register('name', { required: true })}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Aslam"
                {...register('contactPerson')}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 0300-1234567"
                {...register('phone', { required: true })}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. accounts@vendor.com"
                {...register('email')}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                NTN / Tax ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 7894561-2"
                {...register('taxNumber')}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <select
                {...register('paymentTerms')}
                className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#ffc400]"
              >
                {PAYMENT_TERMS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Physical Warehouse / Business Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot 45, Sector 15, Korangi Industrial Area, Karachi"
              {...register('address')}
              className="w-full h-10 px-3 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-900 focus:outline-none focus:border-[#ffc400]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <CustomButton variant="secondary" type="button" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {isEditing ? 'Save Changes' : 'Register Vendor'}
            </CustomButton>
          </div>
        </form>
      </div>
    </Modal>
  );
}