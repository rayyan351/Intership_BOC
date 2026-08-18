// front-end/src/app/admin/locations/_components/BranchModal.jsx
'use client';

import React, { useEffect, useState } from 'react';
import { Space, Tooltip } from 'antd';
import { EnvironmentOutlined, CompassOutlined } from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';

const schema = yup.object().shape({
  name: yup.string().required('Branch / Area name is required'),
  city: yup.string().required('City selection is required'),
  address: yup.string().optional(),
  phone: yup.string().optional(),
  latitude: yup.number().transform((val) => (isNaN(val) ? null : val)).nullable().optional(),
  longitude: yup.number().transform((val) => (isNaN(val) ? null : val)).nullable().optional(),
  googleMapsUrl: yup.string().optional(),
  deliveryRadiusKm: yup.number().typeError('Must be a number').optional(),
  deliveryFee: yup.number().typeError('Must be a number').optional(),
  displayOrder: yup.number().typeError('Must be a number').optional(),
});

const cityOptions = [
  { label: 'Karachi', value: 'Karachi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
];

export default function BranchModal({ open, onClose, onSubmit, loading, initialValues }) {
  const [gpsLoading, setGpsLoading] = useState(false);

  const { control, handleSubmit, reset, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      city: 'Karachi',
      address: '',
      phone: '',
      latitude: '',
      longitude: '',
      googleMapsUrl: '',
      deliveryRadiusKm: 8,
      deliveryFee: 0,
      displayOrder: 1,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        reset({
          name: initialValues.name || '',
          city: initialValues.city || 'Karachi',
          address: initialValues.address || '',
          phone: initialValues.phone || '',
          latitude: initialValues.latitude ?? '',
          longitude: initialValues.longitude ?? '',
          googleMapsUrl: initialValues.googleMapsUrl || '',
          deliveryRadiusKm: initialValues.deliveryRadiusKm || 8,
          deliveryFee: initialValues.deliveryFee || 0,
          displayOrder: initialValues.displayOrder || 1,
        });
      } else {
        reset({
          name: '',
          city: 'Karachi',
          address: '',
          phone: '',
          latitude: '',
          longitude: '',
          googleMapsUrl: '',
          deliveryRadiusKm: 8,
          deliveryFee: 0,
          displayOrder: 1,
        });
      }
    }
  }, [open, initialValues, reset]);

  // Use browser GPS to populate coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });
        setValue('googleMapsUrl', `https://www.google.com/maps?q=${lat},${lng}`);
        setGpsLoading(false);
      },
      (err) => {
        console.error(err);
        alert('Failed to detect GPS location. Please enter manually.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <CustomModal
      title={initialValues ? `Edit Branch (${initialValues.branchCode || 'Location'})` : 'Add New Branch Location'}
      open={open}
      onCancel={onClose}
      width={600}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            name="name"
            label="Branch / Area Name"
            placeholder="e.g. SMCHS, Clifton Block 2"
            control={control}
          />
          <FormSelect
            name="city"
            label="Target City"
            placeholder="Select City"
            options={cityOptions}
            control={control}
          />
        </div>

        <FormInput
          name="address"
          label="Complete Address / Landmark"
          placeholder="e.g. Plot 14-C, Main Commercial Street"
          control={control}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            name="phone"
            label="Contact Number"
            placeholder="e.g. 0300-1234567"
            control={control}
          />
          <FormInput
            name="deliveryFee"
            label="Delivery Fee (Rs.)"
            type="number"
            placeholder="0"
            control={control}
          />
        </div>

        {/* Google Maps Coordinates Section */}
        <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <EnvironmentOutlined className="text-[#F4C61A]" />
              Google Maps Coordinates
            </span>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={gpsLoading}
              className="text-[11px] font-bold text-neutral-700 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-300 px-2.5 py-1 rounded-md transition flex items-center gap-1"
            >
              <CompassOutlined />
              {gpsLoading ? 'Detecting...' : 'Use My GPS'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              name="latitude"
              label="Latitude"
              type="number"
              step="any"
              placeholder="e.g. 24.8607"
              control={control}
            />
            <FormInput
              name="longitude"
              label="Longitude"
              type="number"
              step="any"
              placeholder="e.g. 67.0011"
              control={control}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormInput
              name="googleMapsUrl"
              label="Google Maps URL"
              placeholder="https://maps.google.com/?q=..."
              control={control}
            />
            <FormInput
              name="deliveryRadiusKm"
              label="Delivery Radius (KM)"
              type="number"
              placeholder="8"
              control={control}
            />
          </div>
        </div>

        <FormInput
          name="displayOrder"
          label="Display Priority"
          type="number"
          placeholder="1"
          control={control}
        />

        <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Update Branch' : 'Add Branch'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}