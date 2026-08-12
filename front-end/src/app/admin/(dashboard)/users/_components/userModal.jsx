'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '../../../_components/formElements/inputfield/Forminput';
import CustomButton from '../../../_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';

// Yup validation schema
const schema = yup.object().shape({
  name: yup.string().required('Please enter name'),
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Please enter email'),
  role: yup.string().required('Please select role'),
  status: yup.string().required('Please select status'),
});

export default function UserModal({ open, onClose, onSubmit }) {
  const { control, handleSubmit, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      status: '',
    },
  });

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleFinish = (values) => {
    console.log("values", values);
    onSubmit(values);
    reset();
    onClose();
  };

  return (
    <CustomModal
      title="Add New User"
      open={open}
      onCancel={onClose}
      width="80%"
    >
      <form onSubmit={handleSubmit(handleFinish)} className="mt-4 space-y-4">
        <FormInput
          name="name"
          label="Name"
          placeholder="e.g. John Doe"
          control={control}
        />

        <FormInput
          name="email"
          label="Email Address"
          placeholder="e.g. john@burgeroclock.com"
          control={control}
        />

        <FormSelect
          name="role"
          label="Role"
          placeholder="Select user role"
          control={control}
          options={[
            { value: 'Admin', label: 'Admin' },
            { value: 'Manager', label: 'Manager' },
            { value: 'Staff', label: 'Staff' },
          ]}
        />

        <FormSelect
          name="status"
          label="Status"
          placeholder="Select status"
          control={control}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />

        {/* Action Row */}
        <div className="flex justify-end pt-4 mt-6">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit">
              Add User
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}