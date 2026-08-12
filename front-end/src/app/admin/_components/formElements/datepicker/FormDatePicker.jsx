'use client';

import React from 'react';
import { Form } from 'antd';
import { Controller } from 'react-hook-form';
import CustomDatePicker from './CustomDatePicker';
import FormLabel from '../label/FormLabel';

export default function FormDatePicker({
  name,
  label,
  control,
  placeholder,
  className = '',
  format = 'DD-MM-YYYY',
  disabled = false,
  allowClear = true,
  ...props
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className="mb-4 flex flex-col w-full">
          <FormLabel htmlFor={name}>{label}</FormLabel>
          <Form.Item
            layout="vertical"
            validateStatus={error ? 'error' : ''}
            help={error?.message}
            className="mb-0 w-full"
          >
            <CustomDatePicker
              {...field}
              id={name}
              placeholder={placeholder}
              format={format}
              disabled={disabled}
              allowClear={allowClear}
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