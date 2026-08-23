// front-end/src/app/admin/(dashboard)/settings/delivery-areas/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Input, InputNumber, Select, Switch, Row, Col, Popconfirm, Card } from 'antd';
import {
  EnvironmentOutlined,
  PlusOutlined,
  PercentageOutlined,
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import {
  useGetDeliveryAreasQuery,
  useCreateDeliveryAreaMutation,
  useUpdateDeliveryAreaMutation,
  useDeleteDeliveryAreaMutation,
  useGetSystemSettingsQuery,
  useUpdateTaxSettingsMutation,
} from '@/services/deliveryAreaApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { useToast } from '@/utils/toast';
import { formatPrice } from '@/lib/currency';

export default function DeliveryAreasAndTaxPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  // Queries
  const { data: areas = [], isLoading: loadingAreas } = useGetDeliveryAreasQuery();
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: settings } = useGetSystemSettingsQuery();

  // Mutations
  const [createArea, { isLoading: isCreating }] = useCreateDeliveryAreaMutation();
  const [updateArea, { isLoading: isUpdating }] = useUpdateDeliveryAreaMutation();
  const [deleteArea] = useDeleteDeliveryAreaMutation();
  const [updateTax, { isLoading: isSavingTax }] = useUpdateTaxSettingsMutation();

  // Area Form State
  const [areaForm, setAreaForm] = useState({
    name: '',
    city: 'Karachi',
    assignedBranch: '',
    deliveryFee: 0,
    estimatedDeliveryMinutes: 35,
    isActive: true,
  });

  // Tax Settings Form State
  const [taxForm, setTaxForm] = useState({
    codTaxPercentage: 15,
    cardTaxPercentage: 13,
    isTaxEnabled: true,
  });

  // Load tax settings into local form state
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
    setAreaForm({
      name: '',
      city: 'Karachi',
      assignedBranch: branches[0]?._id || '',
      deliveryFee: 0,
      estimatedDeliveryMinutes: 35,
      isActive: true,
    });
    setIsAreaModalOpen(true);
  };

  const handleOpenEditModal = (area) => {
    setEditingArea(area);
    setAreaForm({
      name: area.name,
      city: area.city,
      assignedBranch: area.assignedBranch?._id || area.assignedBranch,
      deliveryFee: area.deliveryFee || 0,
      estimatedDeliveryMinutes: area.estimatedDeliveryMinutes || 35,
      isActive: area.isActive !== false,
    });
    setIsAreaModalOpen(true);
  };

  const handleSaveArea = async (e) => {
    e.preventDefault();
    if (!areaForm.name || !areaForm.assignedBranch) {
      return showError('Area name and assigned kitchen branch are required.');
    }

    try {
      if (editingArea) {
        await updateArea({ id: editingArea._id, ...areaForm }).unwrap();
        showSuccess('Delivery area updated successfully.');
      } else {
        await createArea(areaForm).unwrap();
        showSuccess('New delivery area mapped successfully.');
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
      title: 'Customer Delivery Area',
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
      title: 'Auto-Assigned Kitchen Outlet',
      dataIndex: 'assignedBranch',
      key: 'branch',
      render: (b) => (
        <span className="text-xs font-semibold text-neutral-800">
          📍 {b?.name ? `${b.name} (${b.city})` : 'Unassigned'}
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
      title: 'Est. Delivery Time',
      dataIndex: 'estimatedDeliveryMinutes',
      key: 'time',
      render: (mins) => <span className="text-xs text-neutral-600 font-mono">~{mins} mins</span>,
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
        <div className="flex gap-1 justify-end">
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleOpenEditModal(r)} />
          <Popconfirm
            title="Delete this area?"
            onConfirm={() => handleDeleteArea(r._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, size: 'small' }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Delivery Areas & Government Tax Settings"
        subTitle="Map customer neighborhoods to fulfilling kitchen branches and manage SST / GST tax percentages"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search areas, cities, or assigned kitchen outlets..."
        actionButton={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
            className="!bg-[#0f172a] hover:!bg-neutral-800 font-bold text-xs"
          >
            Add Delivery Area
          </Button>
        }
      >
        <Row gutter={[20, 20]}>
          {/* LEFT: Government Tax & SST Engine Box */}
          <Col xs={24} lg={8}>
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif] space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-wider flex items-center gap-2 m-0">
                  <PercentageOutlined className="text-amber-500" /> Government Tax (SST)
                </h3>
                <Switch
                  checked={taxForm.isTaxEnabled}
                  onChange={(val) => setTaxForm({ ...taxForm, isTaxEnabled: val })}
                />
              </div>

              <p className="text-[11px] text-neutral-500">
                Government imposed Sindh Sales Tax (SST). Card payments receive a lower tax rate to encourage cashless checkout.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Cash on Delivery (COD) Tax %
                  </label>
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={100}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace('%', '')}
                    value={taxForm.codTaxPercentage}
                    onChange={(val) => setTaxForm({ ...taxForm, codTaxPercentage: val })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Card / Digital Payment Tax %
                  </label>
                  <InputNumber
                    className="w-full"
                    min={0}
                    max={100}
                    formatter={(value) => `${value}%`}
                    parser={(value) => value.replace('%', '')}
                    value={taxForm.cardTaxPercentage}
                    onChange={(val) => setTaxForm({ ...taxForm, cardTaxPercentage: val })}
                  />
                </div>
              </div>

              <Button
                type="primary"
                loading={isSavingTax}
                onClick={handleSaveTaxSettings}
                className="w-full !bg-[#F4C61A] hover:!bg-[#E0B210] text-black font-black uppercase tracking-wider text-xs border-none rounded-xl h-10 mt-2"
              >
                Save Tax Configuration
              </Button>
            </div>
          </Col>

          {/* RIGHT: Mapped Delivery Areas Table */}
          <Col xs={24} lg={16}>
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
              <Table
                columns={columns}
                dataSource={filteredAreas}
                rowKey="_id"
                loading={loadingAreas}
                pagination={{ pageSize: 8 }}
                size="middle"
              />
            </div>
          </Col>
        </Row>

        {/* Create / Edit Area Modal */}
        <Modal
          open={isAreaModalOpen}
          onCancel={() => setIsAreaModalOpen(false)}
          footer={null}
          title={null}
          centered
          width={480}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          <div className="pt-2 pb-1">
            <h3 className="text-base font-black text-neutral-900 uppercase tracking-wide mb-1 flex items-center gap-2">
              <EnvironmentOutlined className="text-amber-500" />
              {editingArea ? 'Edit Delivery Area' : 'Map New Delivery Area'}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Map customer neighborhood directly to the closest fulfilling kitchen outlet.
            </p>

            <form onSubmit={handleSaveArea} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Area / Neighborhood Name *
                </label>
                <Input
                  required
                  placeholder="e.g. DHA Phase 6, Ittehad Commercial"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <Select
                    className="w-full h-10"
                    value={areaForm.city}
                    onChange={(val) => setAreaForm({ ...areaForm, city: val })}
                    options={[
                      { value: 'Karachi', label: 'Karachi' },
                      { value: 'Lahore', label: 'Lahore' },
                      { value: 'Islamabad', label: 'Islamabad' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Assigned Kitchen Outlet *
                  </label>
                  <Select
                    className="w-full h-10"
                    value={areaForm.assignedBranch || undefined}
                    onChange={(val) => setAreaForm({ ...areaForm, assignedBranch: val })}
                    placeholder="Select Branch"
                    options={branches.map((b) => ({
                      value: b._id,
                      label: `${b.name} (${b.city})`,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Delivery Fee (PKR)
                  </label>
                  <InputNumber
                    className="w-full h-10 flex items-center"
                    min={0}
                    value={areaForm.deliveryFee}
                    onChange={(val) => setAreaForm({ ...areaForm, deliveryFee: val || 0 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Est. Minutes
                  </label>
                  <InputNumber
                    className="w-full h-10 flex items-center"
                    min={10}
                    value={areaForm.estimatedDeliveryMinutes}
                    onChange={(val) => setAreaForm({ ...areaForm, estimatedDeliveryMinutes: val || 35 })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex gap-2 justify-end">
                <Button onClick={() => setIsAreaModalOpen(false)} className="text-xs font-semibold">
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isCreating || isUpdating}
                  className="!bg-[#0f172a] text-white text-xs font-bold"
                >
                  Save Delivery Area
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </PageLayout>
    </>
  );
}