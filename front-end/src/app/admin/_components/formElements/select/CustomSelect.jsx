'use client';

import React from 'react';
import { Select } from 'antd';

export default function CustomSelect({
  placeholder,
  value,
  onChange,
  options = [],
  status,
  className = '',
  loading = false,
  disabled = false,
  allowClear = false,
  showSearch = false,
  ...props
}) {
  const baseClasses = `h-10 w-full rounded-lg text-sm border-gray-200 hover:border-[#ffc400] focus:border-[#ffc400] ${className}`;

  return (
    <Select
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      status={status}
      loading={loading}
      disabled={disabled}
      allowClear={allowClear}
      showSearch={showSearch}
      className={baseClasses}
      {...props}
    />
  );
}