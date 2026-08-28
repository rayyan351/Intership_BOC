// src/app/admin/(dashboard)/settings/delivery-areas/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Space, Row, Col } from 'antd';
import {
  PercentageOutlined,
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
import CustomSwitch from '@/app/admin/_components/formElements/switch/CustomSwitch';
import TableActions from '@/app/admin/_components/table/TableActions';
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
      width: '28%',
      render: (name, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">{name}</span>
          <span className="text-[11px] text-neutral-400 font-normal">{r.city}</span>
        </div>
      ),
    },
    {
      title: 'Fulfilling Kitchen Outlet',
      dataIndex: 'assignedBranch',
      key: 'branch',
      width: '32%',
      render: (b) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 text-amber-900 border border-amber-200/60 rounded-xl text-xs font-semibold">
          <ThunderboltOutlined className="text-amber-500" />
          {b?.name ? `${b.name} (${b.city})` : 'Auto-Resolved at Checkout'}
        </span>
      ),
    },
    {
      title: 'Delivery Fee',
      dataIndex: 'deliveryFee',
      key: 'fee',
      width: '18%',
      render: (fee) => (
        <span className="text-xs font-mono font-bold">
          {fee === 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              FREE
            </span>
          ) : (
            <span className="text-neutral-900">{formatPrice(fee)}</span>
          )}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: '12%',
      render: (active) => (
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            active !== false ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {active !== false ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      align: 'right',
      width: '10%',
      render: (_, r) => (
        <TableActions
          onEdit={() => handleOpenEditModal(r)}
          onDelete={() => handleDeleteArea(r._id)}
          deleteTitle="Delete Delivery Zone?"
          deleteDescription={`Are you sure you want to delete "${r.name}"? Deliveries to this address zone will be blocked.`}
        />
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
        <div className="font-['Plus_Jakarta_Sans',sans-serif]">
          <Row gutter={[20, 20]}>
            {/* Government Tax (SST) Card */}
            <Col xs={24} lg={8}>
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4 sticky top-6">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2">
                    <PercentageOutlined className="text-amber-500 text-sm" />
                    <span className="text-xs font-bold text-neutral-900 tracking-tight">
                      Government Tax (SST)
                    </span>
                  </div>
                  <CustomSwitch
                    checked={taxForm.isTaxEnabled}
                    onChange={(val) => setTaxForm({ ...taxForm, isTaxEnabled: val })}
                  />
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed m-0 font-normal">
                  Sindh Sales Tax (SST) applied automatically at checkout. Digital card payments calculate against the subsidized card rate.
                </p>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Cash on Delivery (COD) Tax %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxForm.codTaxPercentage}
                      onChange={(e) => setTaxForm({ ...taxForm, codTaxPercentage: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold font-mono text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Card / Digital Payment Tax %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxForm.cardTaxPercentage}
                      onChange={(e) => setTaxForm({ ...taxForm, cardTaxPercentage: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-bold font-mono text-neutral-900 focus:outline-none focus:border-[#F4C61A] transition"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <CustomButton
                    variant="primary"
                    disabled={isSavingTax}
                    loading={isSavingTax}
                    onClick={handleSaveTaxSettings}
                    className="w-full justify-center"
                  >
                    Save Tax Configuration
                  </CustomButton>
                </div>
              </div>
            </Col>

            {/* Delivery Zones Table */}
            <Col xs={24} lg={16}>
              <div className="overflow-hidden">
                <Table
                  columns={columns}
                  dataSource={filteredAreas}
                  rowKey="_id"
                  loading={loadingAreas}
                  pagination={{
                    pageSize: 7,
                    showTotal: (total, range) => (
                      <span className="text-xs text-neutral-400 font-normal">
                        Showing {range[0]}-{range[1]} of {total} zones
                      </span>
                    ),
                  }}
                  size="middle"
                />
              </div>
            </Col>
          </Row>

          {/* Add / Edit Delivery Zone Modal */}
          <CustomModal
            title={editingArea ? 'Edit Delivery Zone' : 'Add Serviceable Delivery Zone'}
            open={isAreaModalOpen}
            onCancel={() => setIsAreaModalOpen(false)}
            width={580}
          >
            <form onSubmit={handleSubmit(handleSaveArea)} className="mt-4 space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
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
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Pinpoint Zone Center on Map <span className="text-red-500">*</span>
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

              <div className="flex items-center justify-between bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-xs font-bold text-neutral-900 block tracking-tight">
                    Zone Active Status
                  </span>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    Deliveries can be placed to addresses located within this zone.
                  </span>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <CustomSwitch checked={value} onChange={onChange} />
                  )}
                />
              </div>

              <div className="flex justify-end pt-3 mt-5 border-t border-neutral-100">
                <Space size="middle">
                  <CustomButton variant="secondary" onClick={() => setIsAreaModalOpen(false)} type="button">
                    Cancel
                  </CustomButton>
                  <CustomButton variant="primary" htmlType="submit" loading={isCreating || isUpdating}>
                    {editingArea ? 'Save Changes' : 'Save Delivery Zone'}
                  </CustomButton>
                </Space>
              </div>
            </form>
          </CustomModal>
        </div>
      </PageLayout>
    </>
  );
}