'use client';

import React from 'react';
import { Form } from 'antd';
import { Controller } from 'react-hook-form';
import CustomSelect from './CustomSelect';
import FormLabel from '../label/FormLabel';

export default function FormSelect({
  name,
  label,
  control,
  placeholder,
  options = [],
  className = '',
  loading = false,
  disabled = false,
  allowClear = true,
  showSearch = false,
  ...props
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="mb-4">
          <FormLabel htmlFor={name}>{label}</FormLabel>
          <Form.Item
            validateStatus={error ? 'error' : ''}
            help={error?.message}
            className="mb-0"
          >
            <CustomSelect
              {...field}
              placeholder={placeholder}
              options={options}
              loading={loading}
              disabled={disabled}
              allowClear={allowClear}
              showSearch={showSearch}
              status={error ? 'error' : ''}
              className={className}
              {...props}
            />
          </Form.Item>
          </div>
      )}
    />
          );
}