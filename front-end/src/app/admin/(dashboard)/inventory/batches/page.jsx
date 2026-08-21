// front-end/src/app/admin/(dashboard)/inventory/batches/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, Tag, Select, Button, Modal, Space } from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useToast } from '@/utils/toast';
import { useGetStockBatchesQuery, useDiscardBatchMutation } from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function BatchExpiryTrackingPage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBatchToDiscard, setSelectedBatchToDiscard] = useState(null);
  const [discardReason, setDiscardReason] = useState('Expired beyond safe holding time');

  const { data: batches = [], isLoading } = useGetStockBatchesQuery({
    branchId: selectedBranch || undefined,
    status: statusFilter || undefined,
  });
  const { data: branches = [] } = useGetBranchesQuery();
  const [discardBatch, { isLoading: isDiscarding }] = useDiscardBatchMutation();

  const handleConfirmDiscard = async () => {
    if (!selectedBatchToDiscard) return;

    try {
      await discardBatch({
        id: selectedBatchToDiscard._id,
        reason: discardReason,
      }).unwrap();

      showSuccess(`Batch ${selectedBatchToDiscard.batchNumber} written off to waste ledger.`);
      setSelectedBatchToDiscard(null);
    } catch (err) {
      showError(err?.data?.message || 'Failed to discard batch');
    }
  };

  const filteredBatches = batches.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.batchNumber?.toLowerCase().includes(term) ||
      b.item?.name?.toLowerCase().includes(term) ||
      b.item?.sku?.toLowerCase().includes(term)
    );
  });

  // Metrics
  const criticalCount = batches.filter((b) => b.freshnessAlert === 'CRITICAL').length;
  const expiredCount = batches.filter((b) => b.freshnessAlert === 'EXPIRED').length;
  const totalHoldingValue = batches
    .filter((b) => b.status === 'ACTIVE')
    .reduce((sum, b) => sum + (b.holdingMonetaryValue || 0), 0);

  const columns = [
    {
      title: 'Batch Lot Number',
      key: 'batch',
      width: '20%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">{r.batchNumber}</span>
          <span className="text-[10px] text-neutral-400 font-mono">
            PO Ref: {r.purchaseOrder?.poNumber || 'Initial Stock'}
          </span>
        </div>
      ),
    },
    {
      title: 'Material & SKU',
      key: 'item',
      width: '22%',
      render: (_, r) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{r.item?.name}</span>
          <span className="text-[11px] font-mono text-neutral-400">
            SKU: {r.item?.sku} ({r.branch?.name})
          </span>
        </div>
      ),
    },
    {
      title: 'Remaining Balance',
      key: 'balance',
      width: '18%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-900 block">
            {r.remainingQuantity} / {r.initialQuantity} {r.item?.recipeUnit}
          </span>
          <span className="text-[10px] text-neutral-400">
            Holding: Rs. {r.holdingMonetaryValue.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: 'Expiry Date (FEFO)',
      key: 'expiry',
      width: '18%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-800 block">
            {new Date(r.expiryDate).toLocaleDateString()}
          </span>
          <span
            className={`text-[10px] font-bold ${
              r.daysUntilExpiry < 0
                ? 'text-rose-600'
                : r.daysUntilExpiry <= 3
                ? 'text-rose-500'
                : r.daysUntilExpiry <= 7
                ? 'text-amber-500'
                : 'text-emerald-600'
            }`}
          >
            {r.daysUntilExpiry < 0
              ? `Expired ${Math.abs(r.daysUntilExpiry)} days ago`
              : r.daysUntilExpiry === 0
              ? 'Expires Today'
              : `Expires in ${r.daysUntilExpiry} days`}
          </span>
        </div>
      ),
    },
    {
      title: 'Freshness Status',
      key: 'status',
      width: '14%',
      render: (_, r) => {
        const badges = {
          GOOD: { color: 'green', label: 'OPTIMAL (FEFO)' },
          WARNING: { color: 'gold', label: 'EXPIRING SOON' },
          CRITICAL: { color: 'red', label: 'URGENT USE' },
          EXPIRED: { color: 'error', label: 'EXPIRED' },
          DEPLETED: { color: 'default', label: 'DEPLETED' },
        };
        const badge = badges[r.freshnessAlert] || { color: 'default', label: r.status };
        return (
          <Tag color={badge.color} className="font-bold text-[9px] border-none">
            {badge.label}
          </Tag>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '8%',
      render: (_, r) => {
        if (r.status === 'ACTIVE' && (r.freshnessAlert === 'EXPIRED' || r.freshnessAlert === 'CRITICAL')) {
          return (
            <Button
              size="small"
              danger
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => setSelectedBatchToDiscard(r)}
              title="Discard & Write-Off Expired Batch"
            />
          );
        }
        return null;
      },
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Batch Lot & Expiry Tracking (FEFO)"
        subTitle="Monitor perishable ingredient shelf-life, enforce First-Expired, First-Out depletion, and log waste write-offs"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search batch lot number, material, or SKU..."
      >
        {/* KPI Metrics */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Batches Holding Capital</span>}
                value={totalHoldingValue}
                precision={2}
                styles={{ content: { color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<SafetyCertificateOutlined className="mr-1 text-emerald-600" />}
                suffix={<span className="text-xs font-normal text-neutral-400">PKR</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Urgent (Expires ≤ 3 Days)</span>}
                value={criticalCount}
                styles={{ content: { color: '#f59e0b', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<ClockCircleOutlined className="mr-1 text-amber-500" />}
                suffix={<span className="text-xs font-normal text-neutral-400">batches</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Expired Batches to Discard</span>}
                value={expiredCount}
                styles={{ content: { color: '#e11d48', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<CloseCircleOutlined className="mr-1 text-rose-600" />}
                suffix={<span className="text-xs font-normal text-neutral-400">write-offs</span>}
              />
            </Card>
          </Col>
        </Row>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            className="w-full"
            placeholder="Filter by Kitchen Outlet"
            allowClear
            value={selectedBranch || undefined}
            onChange={(val) => setSelectedBranch(val || '')}
            options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
          />
          <Select
            className="w-full"
            placeholder="Filter by Batch Status"
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || '')}
            options={[
              { value: 'ACTIVE', label: 'Active & In-Stock' },
              { value: 'EXPIRED', label: 'Expired Batches' },
              { value: 'DEPLETED', label: 'Fully Consumed (Depleted)' },
              { value: 'DISCARDED', label: 'Discarded (Waste Written-Off)' },
            ]}
          />
        </div>

        {/* Batch Table */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={filteredBatches}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            size="middle"
          />
        </div>

        {/* Discard & Waste Write-off Modal */}
        <Modal
          open={!!selectedBatchToDiscard}
          onCancel={() => setSelectedBatchToDiscard(null)}
          footer={null}
          title={null}
          centered
          width={540}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {selectedBatchToDiscard && (
            <div className="pt-2 pb-1">
              <h3 className="text-base font-bold text-neutral-900 m-0">
                Discard Expired Batch: {selectedBatchToDiscard.batchNumber}
              </h3>
              <p className="text-xs text-neutral-500 mt-1 mb-3">
                Material: <strong>{selectedBatchToDiscard.item?.name}</strong> • Remaining Loss:{' '}
                <strong className="text-rose-600">
                  {selectedBatchToDiscard.remainingQuantity} {selectedBatchToDiscard.item?.recipeUnit} (Rs.{' '}
                  {selectedBatchToDiscard.holdingMonetaryValue})
                </strong>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Reason for Write-Off
                  </label>
                  <input
                    type="text"
                    value={discardReason}
                    onChange={(e) => setDiscardReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-neutral-300 text-xs font-medium focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                  This will deduct the remaining {selectedBatchToDiscard.remainingQuantity}{' '}
                  {selectedBatchToDiscard.item?.recipeUnit} from the branch balance and log a{' '}
                  <code className="font-mono font-bold">WASTE_OUTWARD</code> entry in the audit ledger.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200">
                  <CustomButton variant="secondary" onClick={() => setSelectedBatchToDiscard(null)}>
                    Cancel
                  </CustomButton>
                  <CustomButton
                    variant="primary"
                    onClick={handleConfirmDiscard}
                    loading={isDiscarding}
                    className="!bg-rose-600 hover:!bg-rose-700 text-white border-none"
                  >
                    Confirm Waste Write-Off
                  </CustomButton>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}