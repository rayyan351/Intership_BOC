// front-end/src/app/admin/settings/page.jsx
'use client';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormImageUpload from '@/app/admin/_components/formElements/imageUpload/FormImageUpload';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useToast } from '@/utils/toast';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/services/settingApi';

const schema = yup.object().shape({
  storeName: yup.string().required('Brand/Store name is required'),
  siteTitle: yup.string().required('Browser tab title is required'),
  storeLogo: yup.mixed().nullable(),
  adminLogo: yup.mixed().nullable(),
  favicon: yup.mixed().nullable(),
  removeStoreLogo: yup.boolean().default(false),
  removeAdminLogo: yup.boolean().default(false),
  removeFavicon: yup.boolean().default(false),
});

export default function SettingsPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      storeName: '',
      siteTitle: '',
      storeLogo: null,
      adminLogo: null,
      favicon: null,
      removeStoreLogo: false,
      removeAdminLogo: false,
      removeFavicon: false,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeName: settings.storeName || "Burger O'Clock",
        siteTitle: settings.siteTitle || "Burger O'Clock - Best Burgers in Town",
        storeLogo: null,
        adminLogo: null,
        favicon: null,
        removeStoreLogo: false,
        removeAdminLogo: false,
        removeFavicon: false,
      });
    }
  }, [settings, reset]);

  const handleSaveSettings = async (values) => {
    try {
      const formData = new FormData();
      formData.append('storeName', values.storeName);
      formData.append('siteTitle', values.siteTitle);
      formData.append('removeStoreLogo', values.removeStoreLogo ? 'true' : 'false');
      formData.append('removeAdminLogo', values.removeAdminLogo ? 'true' : 'false');
      formData.append('removeFavicon', values.removeFavicon ? 'true' : 'false');

      if (values.storeLogo) formData.append('storeLogo', values.storeLogo);
      if (values.adminLogo) formData.append('adminLogo', values.adminLogo);
      if (values.favicon) formData.append('favicon', values.favicon);

      await updateSettings(formData).unwrap();
      showSuccess('Brand settings & SEO metadata updated successfully!');
    } catch (error) {
      showError(error?.data?.message || 'Failed to update settings');
    }
  };

  const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Store & Brand Settings"
        subTitle="Manage global store identity, browser tab title, favicon, and logos"
      >
        <div className="max-w-3xl bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-400 font-medium">Loading settings...</div>
          ) : (
            <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
              {/* Brand & SEO Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  name="storeName"
                  label="Brand Name"
                  placeholder="e.g. Burger O'Clock"
                  control={control}
                />
                <FormInput
                  name="siteTitle"
                  label="Browser Tab Title (SEO)"
                  placeholder="e.g. Burger O'Clock - Order Online"
                  control={control}
                />
              </div>

              {/* Favicon Section */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                <span className="block text-sm font-semibold text-neutral-800">
                  Browser Tab Favicon
                </span>

                {settings?.favicon && (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="h-10 w-10 relative bg-neutral-100 rounded flex items-center justify-center border border-neutral-200">
                      <img
                        src={getFullUrl(settings.favicon)}
                        alt="Current Favicon"
                        className="max-h-6 max-w-6 object-contain"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-red-600 cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => setValue('removeFavicon', e.target.checked)}
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      Remove Favicon
                    </label>
                  </div>
                )}

                <FormImageUpload
                  name="favicon"
                  label="Upload New Favicon (.ico, .png, .svg)"
                  control={control}
                />
              </div>

              {/* Storefront Navigation Logo */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                <span className="block text-sm font-semibold text-neutral-800">
                  Storefront Navigation Logo
                </span>
                
                {settings?.storeLogo && (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="h-12 w-36 relative bg-neutral-900 rounded p-1 flex items-center justify-center">
                      <img
                        src={getFullUrl(settings.storeLogo)}
                        alt="Current Store Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-red-600 cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => setValue('removeStoreLogo', e.target.checked)}
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      Remove Store Logo
                    </label>
                  </div>
                )}

                <FormImageUpload
                  name="storeLogo"
                  label="Upload New Storefront Logo"
                  control={control}
                />
              </div>

              {/* Admin Panel Header Logo */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
                <span className="block text-sm font-semibold text-neutral-800">
                  Admin Panel Header Logo
                </span>

                {settings?.adminLogo && (
                  <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-neutral-200">
                    <div className="h-12 w-36 relative bg-black rounded p-1 flex items-center justify-center">
                      <img
                        src={getFullUrl(settings.adminLogo)}
                        alt="Current Admin Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-red-600 cursor-pointer">
                      <input
                        type="checkbox"
                        onChange={(e) => setValue('removeAdminLogo', e.target.checked)}
                        className="rounded border-neutral-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      Remove Admin Logo
                    </label>
                  </div>
                )}

                <FormImageUpload
                  name="adminLogo"
                  label="Upload New Admin Logo"
                  control={control}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Space size="middle">
                  <CustomButton variant="primary" htmlType="submit" loading={isUpdating}>
                    Save Brand Settings
                  </CustomButton>
                </Space>
              </div>
            </form>
          )}
        </div>
      </PageLayout>
    </>
  );
}