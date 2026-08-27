// src/app/admin/(dashboard)/branchoperations/locations/_components/BranchModal.jsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Space } from 'antd';
import {
  EnvironmentOutlined,
  CompassOutlined,
  LinkOutlined,
  PlusOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import { extractCoordinates } from '@/utils/mapCoordinatesExtracted';

const schema = yup.object().shape({
  name: yup.string().required('Branch / Area name is required'),
  city: yup.string().required('City is required'),
  address: yup.string().optional(),
  phone: yup.string().optional(),
  latitude: yup.number().transform((val) => (isNaN(val) ? null : val)).nullable().optional(),
  longitude: yup.number().transform((val) => (isNaN(val) ? null : val)).nullable().optional(),
  googleMapsUrl: yup.string().optional(),
  deliveryRadiusKm: yup.number().typeError('Must be a number').optional(),
  deliveryFee: yup.number().typeError('Must be a number').optional(),
  displayOrder: yup.number().typeError('Must be a number').optional(),
});

export default function BranchModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialValues,
  existingBranches = [],
}) {
  const [mapInputText, setMapInputText] = useState('');
  const [isAddingNewCity, setIsAddingNewCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [customCities, setCustomCities] = useState([]);

  // Extract all unique cities from existing database records + custom added
  const availableCities = useMemo(() => {
    const fromBranches = existingBranches
      .map((b) => b.city?.trim())
      .filter((c) => Boolean(c));
    const combined = Array.from(
      new Set(['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', ...fromBranches, ...customCities])
    );
    return combined;
  }, [existingBranches, customCities]);

  const { control, handleSubmit, reset, setValue, watch } = useForm({
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

  const currentCity = watch('city');
  const lat = watch('latitude');
  const lng = watch('longitude');

  useEffect(() => {
    if (open) {
      setIsAddingNewCity(false);
      setNewCityName('');
      setMapInputText('');

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
        if (initialValues.googleMapsUrl) {
          setMapInputText(initialValues.googleMapsUrl);
        }
      } else {
        reset({
          name: '',
          city: availableCities[0] || 'Karachi',
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
  }, [open, initialValues, reset, availableCities]);

  // Extract latitude and longitude from pasted Google Maps link or coordinates
  const handleExtractFromMap = () => {
    if (!mapInputText.trim()) return;

    const coords = extractCoordinates(mapInputText);
    if (coords) {
      setValue('latitude', coords.latitude, { shouldValidate: true });
      setValue('longitude', coords.longitude, { shouldValidate: true });
      if (mapInputText.startsWith('http')) {
        setValue('googleMapsUrl', mapInputText);
      } else {
        setValue('googleMapsUrl', `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`);
      }
    } else {
      alert(
        'Could not auto-extract coordinates. Please paste a standard Google Maps URL, or enter "24.8607, 67.0011" directly.'
      );
    }
  };

  const handleAddNewCity = () => {
    if (!newCityName.trim()) return;
    const formatted = newCityName.trim();
    if (!customCities.includes(formatted)) {
      setCustomCities((prev) => [...prev, formatted]);
    }
    setValue('city', formatted, { shouldValidate: true });
    setNewCityName('');
    setIsAddingNewCity(false);
  };

  return (
    <CustomModal
      title={
        initialValues
          ? `Edit Branch Outlet (${initialValues.branchCode || 'Outlet'})`
          : 'Add New Branch Outlet'
      }
      open={open}
      onCancel={onClose}
      width={600}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Name & City Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormInput
            name="name"
            label="Branch / Outlet Name"
            placeholder="e.g. SMCHS, Clifton Block 2"
            control={control}
          />

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              City
            </label>
            {!isAddingNewCity ? (
              <div className="flex gap-1.5">
                <select
                  value={currentCity}
                  onChange={(e) => setValue('city', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-slate-50/60 hover:bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#F4C61A] cursor-pointer transition"
                >
                  {availableCities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCity(true)}
                  className="h-10 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1 cursor-pointer"
                  title="Add Custom City"
                >
                  <PlusOutlined className="text-xs" /> Add
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Enter city..."
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#F4C61A] bg-white text-xs font-semibold focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewCity}
                  className="h-10 px-3 bg-[#F4C61A] hover:bg-[#e5b713] text-black font-bold rounded-xl text-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <CheckOutlined /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCity(false)}
                  className="h-10 px-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <FormInput
          name="address"
          label="Street Address & Landmark"
          placeholder="e.g. Plot 14-C, Main Commercial Street, Phase 2"
          control={control}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <FormInput
            name="phone"
            label="Contact Phone"
            placeholder="e.g. 0300-1234567"
            control={control}
          />
          <FormInput
            name="deliveryFee"
            label="Base Delivery Fee (Rs.)"
            type="number"
            placeholder="0"
            control={control}
          />
        </div>

        {/* Location & GPS Mapping Surface */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
              <EnvironmentOutlined className="text-[#F4C61A]" />
              GPS & Kitchen Geofencing
            </span>

            {lat && lng && (
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <LinkOutlined /> Verify on Map
              </a>
            )}
          </div>

          {/* Quick URL / Coordinates Auto-Extract */}
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-neutral-500">
              Paste Google Maps link or coordinates to auto-extract:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mapInputText}
                onChange={(e) => setMapInputText(e.target.value)}
                placeholder="Paste Maps URL or '24.8607, 67.0011'"
                className="w-full h-9 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-mono focus:outline-none focus:border-[#F4C61A]"
              />
              <button
                type="button"
                onClick={handleExtractFromMap}
                className="h-9 px-3.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <CompassOutlined /> Extract
              </button>
            </div>
          </div>

          {/* Manual Numeric Coordinates */}
          <div className="grid grid-cols-2 gap-3 pt-1">
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
              label="Google Maps URL (Optional)"
              placeholder="https://maps.google.com/?q=..."
              control={control}
            />
            <FormInput
              name="deliveryRadiusKm"
              label="Dispatch Radius (KM)"
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

        {/* Modal Action Buttons */}
        <div className="flex justify-end pt-3 mt-4 border-t border-neutral-100">
          <Space size="middle">
            <CustomButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </CustomButton>
            <CustomButton variant="primary" htmlType="submit" loading={loading}>
              {initialValues ? 'Save Changes' : 'Create Branch'}
            </CustomButton>
          </Space>
        </div>
      </form>
    </CustomModal>
  );
}