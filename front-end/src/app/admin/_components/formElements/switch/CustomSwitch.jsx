'use client';

import React from 'react';
import { Switch } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

export default function CustomSwitch({ checked, onChange, loading = false, disabled = false }) {
  return (
    <Switch
      checked={Boolean(checked)}
      onChange={onChange}
      loading={loading}
      disabled={disabled || loading}
      size="medium"
      style={{
        backgroundColor: checked ? '#ffc400' : '#d1d5db',
      }}
      className="custom-brand-switch"
    />
  );
}