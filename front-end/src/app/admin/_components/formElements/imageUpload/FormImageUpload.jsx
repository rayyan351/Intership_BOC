// front-end/src/_components/formElements/imageUpload/FormImageUpload.jsx
'use client';

import React from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Controller } from 'react-hook-form';

export default function FormImageUpload({ name, label, control }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <div>
            <Upload
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return Upload.LIST_IGNORE;
                }
                onChange(file); // Pass raw File object to react-hook-form
                return false; // Prevent automatic upload
              }}
              maxCount={1}
              onRemove={() => onChange(null)}
              fileList={value ? [value] : []}
            >
              <Button icon={<UploadOutlined />}>Select Product Image</Button>
            </Upload>
            {error && <span className="text-xs text-red-500 mt-1">{error.message}</span>}
          </div>
        )}
      />
    </div>
  );
}