// front-end/src/app/admin/locations/_components/BranchModal.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const schema = yup.object().shape({
  name: yup.string().required('Branch / Area name is required'),
  city: yup.string().required('City selection is required'),
  address: yup.string().optional(),
  phone: yup.string().optional(),
  deliveryFee: yup.number().typeError('Must be a number').optional(),
  displayOrder: yup.number().typeError('Must be a number').optional(),
});

const cityOptions = [
  { label: 'Karachi', value: 'Karachi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
];

export default function BranchModal({ open, onClose, onSubmit, loading, initialValues }) {
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      city: 'Karachi',
      address: '',
      phone: '',
      deliveryFee: 0,
      displayOrder: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          city: initialValues.city || 'Karachi',
          address: initialValues.address || '',
          phone: initialValues.phone || '',
          deliveryFee: initialValues.deliveryFee || 0,
          displayOrder: initialValues.displayOrder || 1,
        });
      } else {
        reset({
          name: '',
          city: 'Karachi',
          address: '',
          phone: '',
          deliveryFee: 0,
          displayOrder: 1,
        });
      }
    }
  }, [open, initialValues, reset]);

  return (
    <CustomModal
      title={initialValues ? 'Edit Store Location' : 'Add New Store Location'}
      open={open}
      onCancel={onClose}
      width={540}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <FormInput
          name="name"
          label="Branch / Area Name"
          placeholder="e.g. SMCHS, Clifton Block 2, Gulberg III"
          control={control}
        />

        <FormSelect
          name="city"
          label="Target City"
          placeholder="Select City"
          options={cityOptions}
          control={control}
        />

        <FormInput
          name="address"
          label="Complete Address / LandMark"
          placeholder="e.g. Plot 14-C, Main Commercial Street"
          control={control}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormInput
            name="phone"
            label="Contact Number"
            placeholder="e.g. 0300-1234567"
            control={control}
          />
          <FormInput
            name="deliveryFee"
            label="Delivery Fee (Rs.)"
            type="number"
            placeholder="0"
            control={control}
          />
        </div>

        <FormInput
          name="displayOrder"
          label="Display Priority"
          type="number"
          placeholder="1"
          control={control}
        />

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Branch' : 'Add Branch'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}