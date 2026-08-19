// src/app/admin/_components/formElements/switch/CustomSwitch.jsx
'use client';

import React from 'react';
import { Switch } from 'antd';

export default function CustomSwitch({ checked, onChange, loading = false, disabled = false }) {
  return (
    <>
      <style jsx global>{`
        /* Slim, sleek capsule track */
        .sleek-brand-switch.ant-switch {
          min-width: 34px !important;
          height: 16px !important;
          background-color: #27272a !important; /* Muted zinc track */
          border: none !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .sleek-brand-switch.ant-switch-checked {
          background-color: #ffc400 !important; /* Signature Brand Yellow */
        }
        .sleek-brand-switch .ant-switch-handle {
          width: 12px !important;
          height: 12px !important;
          top: 2px !important;
          left: 2px !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .sleek-brand-switch.ant-switch-checked .ant-switch-handle {
          left: calc(100% - 14px) !important;
        }
        .sleek-brand-switch .ant-switch-handle::before {
          border-radius: 9999px !important;
          background-color: #ffffff !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
        }
        .sleek-brand-switch.ant-switch-checked .ant-switch-handle::before {
          background-color: #000000 !important; /* Crisp black thumb on yellow */
        }
      `}</style>
      <Switch
        checked={Boolean(checked)}
        onChange={onChange}
        loading={loading}
        disabled={disabled || loading}
        className="sleek-brand-switch"
      />
    </>
  );
}