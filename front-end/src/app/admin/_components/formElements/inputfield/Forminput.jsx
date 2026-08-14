'use client';

import React from 'react';
import { Form } from 'antd';
import { Controller } from 'react-hook-form';
import CustomInput from './CustomInput';
import FormLabel from '../label/FormLabel';

export default function FormInput({
  name,
  label,
  control,
  placeholder,
  type = 'text',
  className = '',
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
            <CustomInput
              {...field}
              type={type}
              placeholder={placeholder}
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