'use client';

import React from 'react';
import { Input } from 'antd';

export default function CustomInput({
  placeholder,
  prefix,
  value,
  onChange,
  type = 'text',
  status,
  className = '',
  ...props
}) {
  const baseClasses = `h-10 rounded-lg text-sm border-gray-200 hover:border-[#ffc400] focus:border-[#ffc400] focus:shadow-none shadow-none ${className}`;

  if (type === 'password') {
    return (
      <Input.Password
        placeholder={placeholder}
        prefix={prefix}
        value={value}
        onChange={onChange}
        status={status}
        className={baseClasses}
        {...props}
      />
    );
  }

  return (
    <Input
      type={type}
      placeholder={placeholder}
      prefix={prefix}
      value={value}
      onChange={onChange}
      status={status}
      className={baseClasses}
      {...props}
    />
  );
}