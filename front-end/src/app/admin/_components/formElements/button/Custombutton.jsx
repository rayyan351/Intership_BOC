// src/app/admin/_components/formElements/button/Custombutton.jsx
'use client';

import React from 'react';
import { Button } from 'antd';

export default function CustomButton({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark'
  size = 'middle', // 'small' | 'middle' | 'large'
  onClick,
  htmlType = 'button',
  loading = false,
  disabled = false,
  icon,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-semibold font-[\'Plus_Jakarta_Sans\',sans-serif] tracking-tight transition-all duration-150 ease-in-out cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 border-0';

  const sizeStyles = {
    small: 'h-8 px-3 rounded-lg text-xs',
    middle: 'h-9 px-4 rounded-xl text-xs',
    large: 'h-11 px-5 rounded-xl text-sm font-bold',
  };

  const variants = {
    // Signature Warm Yellow Primary Button
    primary:
      '!bg-[#F4C61A] !text-black hover:!bg-[#e5b713] hover:!text-black shadow-xs font-bold hover:shadow-sm',
    
    // Clean Neutral Secondary Button (Bordered Surface)
    secondary:
      '!bg-white !text-neutral-700 !border !border-neutral-200/90 hover:!bg-neutral-50 hover:!text-neutral-900 hover:!border-neutral-300 shadow-2xs',
    
    // Minimal Dark Button
    dark:
      '!bg-neutral-900 !text-white hover:!bg-neutral-800 hover:!text-white shadow-xs font-semibold',
    
    // Soft Rose Danger Button
    danger:
      '!bg-rose-50 !text-rose-600 !border !border-rose-200/80 hover:!bg-rose-100 hover:!text-rose-700 shadow-2xs',
    
    // Ghost / Subdued Link Button
    ghost:
      '!bg-transparent !text-neutral-600 hover:!bg-neutral-100 hover:!text-neutral-900',
  };

  return (
    <Button
      htmlType={htmlType}
      onClick={onClick}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.middle} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </Button>
  );
}