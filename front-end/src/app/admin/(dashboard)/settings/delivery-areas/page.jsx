// src/app/admin/(dashboard)/settings/delivery-areas/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Space, Switch, Row, Col, Popconfirm } from 'antd';
import {
  EnvironmentOutlined,
  PercentageOutlined,
  DeleteOutlined,
  EditOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomModal from '@/app/admin/_components/modal/CustomModal';
import FormInput from '@/app/admin/_components/formElements/inputfield/Forminput';
import FormSelect from '@/app/admin/_components/formElements/select/FormSelect';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import LocationPickerModal from '@/app/admin/_components/formElements/map/LocationPickerModal';

import {
  useGetDeliveryAreasQuery,
  useCreateDeliveryAreaMutation,
  useUpdateDeliveryAreaMutation,
  useDeleteDeliveryAreaMutation,
  useGetSystemSettingsQuery,
  useUpdateTaxSettingsMutation,
} from '@/services/deliveryAreaApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

const areaSchema = yup.object().shape({
  name: yup.string().required('Area / Neighborhood name is required'),
  city: yup.string().required('City selection is required'),
  deliveryFee: yup
    .number()
    .typeError('Delivery fee must be a number')
    .min(0, 'Delivery fee cannot be negative')
    .default(0),
  latitude: yup.number().nullable().optional(),
  longitude: yup.number().nullable().optional(),
  isActive: yup.boolean().default(true),
});

export default function DeliveryAreasAndTaxPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const { data: areas = [], isLoading: loadingAreas } = useGetDeliveryAreasQuery();
  const { data: settings } = useGetSystemSettingsQuery();

  const [createArea, { isLoading: isCreating }] = useCreateDeliveryAreaMutation();
  const [updateArea, { isLoading: isUpdating }] = useUpdateDeliveryAreaMutation();
  const [deleteArea] = useDeleteDeliveryAreaMutation();
  const [updateTax, { isLoading: isSavingTax }] = useUpdateTaxSettingsMutation();

  const { control, handleSubmit, reset, setValue, watch } = useForm({
    resolver: yupResolver(areaSchema),
    defaultValues: {
      name: '',
      city: 'Karachi',
      deliveryFee: 0,
      latitude: 24.8607,
      longitude: 67.0011,
      isActive: true,
    },
  });

  const watchedCity = watch('city');
  const watchedLat = watch('latitude') || 24.8607;
  const watchedLng = watch('longitude') || 67.0011;

  const [taxForm, setTaxForm] = useState({
    codTaxPercentage: 15,
    cardTaxPercentage: 13,
    isTaxEnabled: true,
  });

  React.useEffect(() => {
    if (settings?.taxSettings) {
      setTaxForm({
        codTaxPercentage: settings.taxSettings.codTaxPercentage || 15,
        cardTaxPercentage: settings.taxSettings.cardTaxPercentage || 13,
        isTaxEnabled: settings.taxSettings.isTaxEnabled !== false,
      });
    }
  }, [settings]);

  const handleOpenCreateModal = () => {
    setEditingArea(null);
    reset({
      name: '',
      city: 'Karachi',
      deliveryFee: 0,
      latitude: 24.8607,
      longitude: 67.0011,
      isActive: true,
    });
    setIsAreaModalOpen(true);
  };

  const handleOpenEditModal = (area) => {
    setEditingArea(area);
    reset({
      name: area.name,
      city: area.city || 'Karachi',
      deliveryFee: area.deliveryFee || 0,
      latitude: area.latitude || 24.8607,
      longitude: area.longitude || 67.0011,
      isActive: area.isActive !== false,
    });
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (formData) => {
    try {
      if (editingArea) {
        await updateArea({ id: editingArea._id, ...formData }).unwrap();
        showSuccess('Delivery area updated successfully.');
      } else {
        await createArea(formData).unwrap();
        showSuccess('New delivery zone mapped successfully.');
      }
      setIsAreaModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to save delivery area');
    }
  };

  const handleDeleteArea = async (id) => {
    try {
      await deleteArea(id).unwrap();
      showSuccess('Delivery area removed.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to delete area.');
    }
  };

  const handleSaveTaxSettings = async () => {
    try {
      await updateTax({
        taxSettings: {
          codTaxPercentage: Number(taxForm.codTaxPercentage),
          cardTaxPercentage: Number(taxForm.cardTaxPercentage),
          isTaxEnabled: taxForm.isTaxEnabled,
        },
      }).unwrap();
      showSuccess('SST / Tax configuration updated.');
    } catch (err) {
      showError(err?.data?.message || 'Failed to update tax settings.');
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.assignedBranch?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: 'Customer Delivery Zone',
      dataIndex: 'name',
      key: 'name',
      render: (name, r) => (
        <div>
          <strong className="text-xs text-neutral-900 block">{name}</strong>
          <span className="text-[10px] text-neutral-400 font-mono">{r.city}</span>
        </div>
      ),
    },
    {
      title: 'Fulfilling Kitchen Outlet',
      dataIndex: 'assignedBranch',
      key: 'branch',
      render: (b) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold">
          <ThunderboltOutlined className="text-amber-500" />
          {b?.name ? `${b.name} (${b.city})` : 'Auto-Resolved at Order Placement'}
        </span>
      ),
    },
    {
      title: 'Delivery Fee',
      dataIndex: 'deliveryFee',
      key: 'fee',
      render: (fee) => (
        <span className="text-xs font-mono font-bold">
          {fee === 0 ? <Tag color="green">FREE</Tag> : formatPrice(fee)}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (active) => (
        <Tag color={active !== false ? 'blue' : 'default'} className="border-none font-bold text-[10px]">
          {active !== false ? 'ACTIVE' : 'DISABLED'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      render: (_, r) => (
        <Space size="small">
          <button
            onClick={() => handleOpenEditModal(r)}
            className="p-1.5 text-neutral-600 hover:text-black transition cursor-pointer"
          >
            <EditOutlined />
          </button>
          <Popconfirm
            title="Delete this delivery zone?"
            onConfirm={() => handleDeleteArea(r._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <button className="p-1.5 text-rose-500 hover:text-rose-700 transition cursor-pointer">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Delivery Areas & SST Tax"
        subTitle="Manage serviceable delivery zones with automated kitchen assignment and configure SST rates"
        onAdd={handleOpenCreateModal}
        addText="Add Delivery Zone"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search zones, cities, or fulfilling branches..."
      >
        <Row gutter={[24, 24]}>
          {/* Tax Engine */}
          <Col xs={24} lg={8}>
            <div className="bg-neutral-50/70 p-5 rounded-2xl border border-neutral-200 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 m-0">
                  <PercentageOutlined className="text-amber-500" /> Government Tax (SST)
                </h3>
                <Switch
                  checked={taxForm.isTaxEnabled}
                  onChange={(val) => setTaxForm({ ...taxForm, isTaxEnabled: val })}
                />
              </div>

              <p className="text-[11px] text-neutral-500 m-0">
                Sindh Sales Tax (SST) applied at checkout. Card payments calculate against the digital rate.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Cash on Delivery (COD) Tax %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxForm.codTaxPercentage}
                    onChange={(e) => setTaxForm({ ...taxForm, codTaxPercentage: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Card / Digital Payment Tax %
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxForm.cardTaxPercentage}
                    onChange={(e) => setTaxForm({ ...taxForm, cardTaxPercentage: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-900 outline-none"
                  />
                </div>
              </div>

              <button
                disabled={isSavingTax}
                onClick={handleSaveTaxSettings}
                className="w-full bg-[#0f172a] hover:bg-neutral-800 text-white font-bold uppercase tracking-wider text-xs border-none rounded-xl h-10 mt-1 transition cursor-pointer"
              >
                {isSavingTax ? 'Saving...' : 'Save Tax Configuration'}
              </button>
            </div>
          </Col>

          {/* Delivery Zones Table */}
          <Col xs={24} lg={16}>
            <Table
              columns={columns}
              dataSource={filteredAreas}
              rowKey="_id"
              loading={loadingAreas}
              pagination={{ pageSize: 7 }}
              size="middle"
            />
          </Col>
        </Row>

        {/* Add / Edit Delivery Zone Modal */}
        <CustomModal
          title={editingArea ? 'Edit Delivery Zone' : 'Add Serviceable Delivery Zone'}
          open={isAreaModalOpen}
          onCancel={() => setIsAreaModalOpen(false)}
          width={580}
        >
          <form onSubmit={handleSubmit(handleSaveArea)} className="mt-4 space-y-4">
            <FormInput
              name="name"
              label="Area / Neighborhood Name"
              placeholder="e.g. Shah Faisal No 3, Ittehad Commercial, F-7/2"
              control={control}
            />

            <FormSelect
              name="city"
              label="City"
              control={control}
              options={[
                { value: 'Karachi', label: 'Karachi' },
                { value: 'Lahore', label: 'Lahore' },
                { value: 'Islamabad', label: 'Islamabad' },
              ]}
            />

            {/* Precision Pinpoint Map */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                Pinpoint Zone Center on Map *
              </label>
              <LocationPickerModal
                city={watchedCity}
                initialLat={watchedLat}
                initialLng={watchedLng}
                onLocationSelect={({ latitude, longitude }) => {
                  setValue('latitude', latitude);
                  setValue('longitude', longitude);
                }}
              />
            </div>

            <FormInput
              name="deliveryFee"
              label="Delivery Fee (PKR)"
              type="number"
              placeholder="0"
              control={control}
            />

            <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
              <span className="text-xs font-bold text-neutral-800">Zone Active Status</span>
              <Controller
                name="isActive"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Switch checked={value} onChange={onChange} />
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
              <CustomButton variant="secondary" onClick={() => setIsAreaModalOpen(false)} type="button">
                Cancel
              </CustomButton>
              <CustomButton variant="primary" htmlType="submit" loading={isCreating || isUpdating}>
                {editingArea ? 'Update Zone' : 'Save Delivery Zone'}
              </CustomButton>
            </div>
          </form>
        </CustomModal>
      </PageLayout>
    </>
  );
}