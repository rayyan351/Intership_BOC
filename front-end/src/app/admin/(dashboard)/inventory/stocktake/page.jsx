// front-end/src/app/admin/(dashboard)/inventory/stocktake/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, Tag, Select, Button, Modal } from 'antd';
import {
  AuditOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import PerformStocktakeModal from './_components/PerformStocktakeModal';
import { useToast } from '@/utils/toast';
import {
  useGetStocktakesQuery,
  useSubmitStocktakeMutation,
  useGetInventoryItemsQuery,
} from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';

export default function StocktakePage() {
  const { contextHolder, showSuccess, showError } = useToast();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isPerformModalOpen, setIsPerformModalOpen] = useState(false);
  const [viewStocktakeDetails, setViewStocktakeDetails] = useState(null);

  const { data: stocktakes = [], isLoading } = useGetStocktakesQuery({
    branchId: selectedBranch || undefined,
  });
  const { data: branches = [] } = useGetBranchesQuery();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();

  const [submitStocktake, { isLoading: isSubmitting }] = useSubmitStocktakeMutation();

  const handleStocktakeSubmit = async (payload) => {
    try {
      await submitStocktake(payload).unwrap();
      showSuccess('Physical stocktake reconciled & ledger adjustments applied!');
      setIsPerformModalOpen(false);
    } catch (err) {
      showError(err?.data?.message || 'Failed to reconcile stocktake');
    }
  };

  // Metrics
  const totalShrinkageVal = stocktakes.reduce((sum, st) => sum + (st.totalShrinkageLoss || 0), 0);
  const totalAuditsCount = stocktakes.length;

  const columns = [
    {
      title: 'Session & Timestamp',
      key: 'session',
      width: '20%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">{r.stocktakeNumber}</span>
          <span className="text-[11px] text-neutral-400">
            {new Date(r.reconciledAt || r.createdAt).toLocaleDateString()} by {r.conductedBy?.name || 'Auditor'}
          </span>
        </div>
      ),
    },
    {
      title: 'Audited Outlet',
      key: 'branch',
      width: '18%',
      render: (_, r) => (
        <span className="font-semibold text-neutral-800 text-xs">
          {r.branch?.name} ({r.branch?.city})
        </span>
      ),
    },
    {
      title: 'Items Checked',
      key: 'itemsCount',
      width: '14%',
      render: (_, r) => (
        <span className="font-mono text-xs text-neutral-600">
          {r.items?.length || 0} ingredients
        </span>
      ),
    },
    {
      title: 'Shrinkage Loss (PKR)',
      key: 'shrinkage',
      width: '16%',
      render: (_, r) => (
        <span className="font-mono font-bold text-xs text-rose-600">
          Rs. {Number(r.totalShrinkageLoss || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Net Variance Value',
      key: 'net',
      width: '16%',
      render: (_, r) => {
        const net = Number(r.totalNetVarianceValue || 0);
        return (
          <span
            className={`font-mono font-bold text-xs ${
              net < 0 ? 'text-rose-600' : net > 0 ? 'text-emerald-600' : 'text-neutral-500'
            }`}
          >
            {net > 0 ? `+Rs. ${net.toLocaleString()}` : `Rs. ${net.toLocaleString()}`}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: '10%',
      render: () => (
        <Tag color="green" className="font-bold text-[10px] border-none">
          RECONCILED
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'right',
      width: '6%',
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setViewStocktakeDetails(r)}
        />
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Physical Stocktake & Reconciliation"
        subTitle="Conduct kitchen scale physical audits, calculate theoretical vs. actual variances, and record audit adjustments"
        onAdd={() => setIsPerformModalOpen(true)}
        addText="Perform New Stocktake"
      >
        {/* KPI Metrics */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Reconciliations</span>}
                value={totalAuditsCount}
                styles={{ content: { color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<AuditOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">sessions</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Cumulative Shrinkage Loss</span>}
                value={totalShrinkageVal}
                precision={2}
                styles={{ content: { color: '#e11d48', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<WarningOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">PKR</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Audit Integrity</span>}
                value="100"
                styles={{ content: { color: '#059669', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<CheckCircleOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">% Ledger Synced</span>}
              />
            </Card>
          </Col>
        </Row>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4">
          <div className="w-full sm:w-72">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Filter by Kitchen Outlet
            </label>
            <Select
              className="w-full"
              placeholder="All Kitchen Outlets"
              allowClear
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>
        </div>

        {/* Stocktake Table */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={stocktakes}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 8 }}
            size="middle"
          />
        </div>

        {/* Perform Stocktake Modal */}
        <PerformStocktakeModal
          open={isPerformModalOpen}
          onClose={() => setIsPerformModalOpen(false)}
          branches={branches}
          inventoryItems={inventoryItems}
          onSubmit={handleStocktakeSubmit}
          loading={isSubmitting}
        />

        {/* Audit Details Modal */}
        <Modal
          open={!!viewStocktakeDetails}
          onCancel={() => setViewStocktakeDetails(null)}
          footer={null}
          title={null}
          centered
          width={720}
          className="font-['Plus_Jakarta_Sans',sans-serif]"
        >
          {viewStocktakeDetails && (
            <div className="pt-2 pb-1">
              <div className="flex justify-between items-start border-b border-neutral-200 pb-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 m-0">
                    Audit Session: {viewStocktakeDetails.stocktakeNumber}
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Outlet: {viewStocktakeDetails.branch?.name} • Auditor: {viewStocktakeDetails.conductedBy?.name}
                  </span>
                </div>
                <Tag color="green" className="font-bold text-xs">
                  RECONCILED
                </Tag>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(viewStocktakeDetails.items || []).map((itm, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-900 block">{itm.item?.name}</span>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Theoretical: {itm.systemStock} → Counted: <strong>{itm.physicalCount} {itm.item?.recipeUnit}</strong>
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold block ${
                          itm.varianceQuantity < 0
                            ? 'text-rose-600'
                            : itm.varianceQuantity > 0
                            ? 'text-emerald-600'
                            : 'text-neutral-500'
                        }`}
                      >
                        {itm.varianceQuantity > 0 ? `+${itm.varianceQuantity}` : itm.varianceQuantity} {itm.item?.recipeUnit}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Rs. {Math.abs(itm.varianceValue).toLocaleString()} ({itm.discrepancyReason})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </PageLayout>
    </>
  );
}