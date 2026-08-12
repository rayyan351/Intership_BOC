'use client';

import React from 'react';
import { DatePicker } from 'antd';

export default function CustomDatePicker({
  placeholder,
  value,
  onChange,
  status,
  className = '',
  format = 'MM-DD-YYYY',
  disabled = false,
  allowClear = true,
  ...props
}) {
  const baseClasses = `h-10 w-full rounded-lg text-sm border-gray-200 hover:border-[#ffc400] focus:border-[#ffc400] ${className}`;

  return (
    <DatePicker
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      status={status}
      format={format}
      disabled={disabled}
      allowClear={allowClear}
      className={baseClasses}
      // {...props}
    />
  );
}