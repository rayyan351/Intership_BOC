'use client';

import React from 'react';
import { Button } from 'antd';

export default function CustomButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  onClick,
  htmlType = 'button',
  loading = false,
  icon,
  className = '',
  ...props
}) {
  const baseStyles =
    'h-10 px-5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center border-none cursor-pointer';

  const variants = {
    primary: 'bg-[#ffc400] text-black hover:!bg-[#e6b000] hover:!text-black shadow-none',
    secondary: 'bg-gray-100 text-gray-700 hover:!bg-gray-200 hover:!text-gray-900 shadow-none',
    danger: 'bg-red-50 text-red-600 hover:!bg-red-100 hover:!text-red-700 shadow-none',
  };

  return (
    <Button
      htmlType={htmlType}
      onClick={onClick}
      loading={loading}
      icon={icon}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}