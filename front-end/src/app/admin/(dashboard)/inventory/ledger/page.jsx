// front-end/src/app/admin/(dashboard)/inventory/ledger/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Tag, Select, Card, Statistic, Row, Col, Space } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  WarningOutlined,
  HistoryOutlined,
  ShoppingOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useGetStockLedgerQuery, useGetInventoryItemsQuery } from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { exportToCSV } from '@/utils/exportCsv';
import { exportLedgerPDF } from '@/utils/exportLedgerPdf';
import { useToast } from '@/utils/toast';

const TRANSACTION_TYPES = [
  { label: 'All Transaction Types', value: '' },
  { label: 'Sale Depletion (Kitchen Consumption)', value: 'SALE_OUTWARD' },
  { label: 'Order Rollback / Cancellation', value: 'SALE_RETURN' },
  { label: 'Stock Inward (Purchase / Receiving)', value: 'PURCHASE_INWARD' },
  { label: 'Kitchen Spoilage & Wastage', value: 'SPOILAGE_WASTE' },
  { label: 'Physical Audit Adjustment', value: 'PHYSICAL_AUDIT_ADJUSTMENT' },
  { label: 'Transfer Out (Inter-Branch)', value: 'TRANSFER_OUT' },
  { label: 'Transfer In (Inter-Branch)', value: 'TRANSFER_IN' },
];

export default function StockLedgerPage() {
  const { contextHolder, showWarning } = useToast();

  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: branches = [] } = useGetBranchesQuery();
  const { data: inventoryItems = [] } = useGetInventoryItemsQuery();
  const { data: ledger = [], isLoading } = useGetStockLedgerQuery({
    branchId: selectedBranch || undefined,
    itemId: selectedItem || undefined,
    type: selectedType || undefined,
  });

  const filteredLedger = ledger.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.item?.name?.toLowerCase().includes(term) ||
      entry.item?.sku?.toLowerCase().includes(term) ||
      entry.notes?.toLowerCase().includes(term) ||
      entry.performedBy?.name?.toLowerCase().includes(term)
    );
  });

  // KPI Computations
  const totalDepletedQty = ledger
    .filter((l) => l.type === 'SALE_OUTWARD')
    .reduce((sum, l) => sum + Math.abs(l.quantityChanged || 0), 0);

  const totalWasteLoss = ledger
    .filter((l) => l.type === 'SPOILAGE_WASTE')
    .reduce((sum, l) => sum + (l.totalMonetaryValue || 0), 0);

  const totalInwardVal = ledger
    .filter((l) => l.type === 'PURCHASE_INWARD')
    .reduce((sum, l) => sum + (l.totalMonetaryValue || 0), 0);

  // Export Handlers
  const handleExportCSV = () => {
    if (!filteredLedger.length) {
      return showWarning('No ledger records available to export.');
    }

    const headers = [
      {
        label: 'Date & Time',
        key: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'),
      },
      {
        label: 'Staff / Performed By',
        key: (r) => r.performedBy?.name || 'Storefront Engine',
      },
      {
        label: 'Raw Material',
        key: (r) => r.item?.name || 'N/A',
      },
      {
        label: 'SKU',
        key: (r) => r.item?.sku || 'N/A',
      },
      {
        label: 'Branch Location',
        key: (r) => r.branch?.name || 'General Branch',
      },
      {
        label: 'Event Type',
        key: (r) => r.type || 'N/A',
      },
      {
        label: 'Delta (Quantity Changed)',
        key: (r) => r.quantityChanged,
      },
      {
        label: 'Unit',
        key: (r) => r.item?.recipeUnit || '',
      },
      {
        label: 'Previous Stock Balance',
        key: (r) => r.previousStock,
      },
      {
        label: 'New Stock Balance',
        key: (r) => r.newStock,
      },
      {
        label: 'Unit Cost at Time (PKR)',
        key: (r) => r.unitCostAtTime || 0,
      },
      {
        label: 'Total Value Impact (PKR)',
        key: (r) => r.totalMonetaryValue || 0,
      },
      {
        label: 'Audit Notes',
        key: (r) => r.notes || '',
      },
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCSV(filteredLedger, headers, `Stock_Audit_Ledger_${timestamp}.csv`);
  };

  const handleExportPDF = () => {
    if (!filteredLedger.length) {
      return showWarning('No ledger records available to export.');
    }

    const activeBranchName =
      branches.find((b) => b._id === selectedBranch)?.name || 'All Outlets (Consolidated)';
    const activeItemName =
      inventoryItems.find((i) => i._id === selectedItem)?.name || 'All Raw Materials';
    const activeTypeName =
      TRANSACTION_TYPES.find((t) => t.value === selectedType)?.label || 'All Transactions';

    exportLedgerPDF({
      ledgerData: filteredLedger,
      branchName: activeBranchName,
      materialFilter: activeItemName,
      eventTypeFilter: activeTypeName,
      metrics: {
        totalDepletedQty,
        totalWasteLoss,
        totalInwardVal,
      },
    });
  };

  const columns = [
    {
      title: 'Timestamp & User',
      key: 'date',
      width: '18%',
      render: (_, record) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">
            {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'}{' '}
            {record.createdAt
              ? new Date(record.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
          <span className="text-[11px] text-neutral-400">
            By: <strong className="text-neutral-600">{record.performedBy?.name || 'Storefront Engine'}</strong>
          </span>
        </div>
      ),
    },
    {
      title: 'Raw Material',
      key: 'item',
      width: '20%',
      render: (_, record) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">
            {record.item?.name || 'Raw Ingredient'}
          </span>
          <span className="font-mono text-[10px] text-neutral-400">
            SKU: {record.item?.sku || 'N/A'} • {record.branch?.name || 'General Branch'}
          </span>
        </div>
      ),
    },
    {
      title: 'Event Type',
      dataIndex: 'type',
      key: 'type',
      width: '16%',
      render: (type) => {
        const badges = {
          SALE_OUTWARD: { color: 'blue', label: 'Sale Consumption' },
          SALE_RETURN: { color: 'cyan', label: 'Order Return' },
          PURCHASE_INWARD: { color: 'green', label: 'Stock Inward' },
          SPOILAGE_WASTE: { color: 'red', label: 'Kitchen Spoilage' },
          PHYSICAL_AUDIT_ADJUSTMENT: { color: 'purple', label: 'Audit Adjustment' },
          TRANSFER_OUT: { color: 'orange', label: 'Transfer Out' },
          TRANSFER_IN: { color: 'gold', label: 'Transfer In' },
        };
        const badge = badges[type] || { color: 'default', label: type };
        return (
          <Tag color={badge.color} className="font-bold text-[10px] border-none">
            {badge.label}
          </Tag>
        );
      },
    },
    {
      title: 'Delta (Change)',
      key: 'change',
      width: '14%',
      render: (_, record) => {
        const isNegative = Number(record.quantityChanged) < 0;
        return (
          <span
            className={`font-mono font-bold text-xs flex items-center gap-1 ${
              isNegative ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {isNegative ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            {isNegative ? '' : '+'}
            {record.quantityChanged} {record.item?.recipeUnit || ''}
          </span>
        );
      },
    },
    {
      title: 'Stock Balance',
      key: 'stock',
      width: '16%',
      render: (_, record) => (
        <div className="font-mono text-xs">
          <span className="text-neutral-400">{record.previousStock}</span>
          <span className="mx-1 text-neutral-300">→</span>
          <strong className="text-neutral-900">
            {record.newStock} {record.item?.recipeUnit || ''}
          </strong>
        </div>
      ),
    },
    {
      title: 'Monetary Value & Audit Notes',
      key: 'notes',
      width: '16%',
      render: (_, record) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-800 block">
            Rs. {Number(record.totalMonetaryValue || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 line-clamp-1" title={record.notes}>
            {record.notes || '—'}
          </span>
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Stock Audit Ledger"
        subTitle="Real-time transaction history of inventory depletions, order rollbacks, supplier intake, and waste adjustments"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search by raw material, SKU, notes, or staff..."
      >
        {/* Metric Cards Summary */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Sale Consumption
                  </span>
                }
                value={totalDepletedQty}
                precision={0}
                styles={{
                  content: { color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' },
                }}
                prefix={<ShoppingOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">units</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Kitchen Spoilage Loss
                  </span>
                }
                value={totalWasteLoss}
                precision={2}
                styles={{
                  content: { color: '#e11d48', fontWeight: 800, fontFamily: 'monospace' },
                }}
                prefix={<WarningOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">PKR</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Total Inward Value
                  </span>
                }
                value={totalInwardVal}
                precision={2}
                styles={{
                  content: { color: '#059669', fontWeight: 800, fontFamily: 'monospace' },
                }}
                prefix={<HistoryOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">PKR</span>}
              />
            </Card>
          </Col>
        </Row>

        {/* Filter Control Bar with CSV & PDF Export Buttons */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Filter by Branch
              </label>
              <Select
                className="w-full"
                placeholder="All Branch Outlets"
                allowClear
                value={selectedBranch || undefined}
                onChange={(val) => setSelectedBranch(val || '')}
                options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Filter by Raw Material
              </label>
              <Select
                className="w-full"
                placeholder="All Raw Materials"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                value={selectedItem || undefined}
                onChange={(val) => setSelectedItem(val || '')}
                options={inventoryItems.map((i) => ({
                  value: i._id,
                  label: `${i.name} (${i.sku})`,
                }))}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Transaction Event Type
              </label>
              <Select
                className="w-full"
                value={selectedType}
                onChange={setSelectedType}
                options={TRANSACTION_TYPES}
              />
            </div>

            <div className="sm:col-span-3 flex gap-2">
              <CustomButton
                variant="secondary"
                onClick={handleExportCSV}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 font-semibold text-xs border-neutral-300 hover:border-neutral-400"
              >
                <DownloadOutlined /> CSV
              </CustomButton>

              <CustomButton
                variant="primary"
                onClick={handleExportPDF}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 font-semibold text-xs bg-[#0f172a] hover:bg-[#1e293b] text-white border-none"
              >
                <PrinterOutlined /> Print / PDF
              </CustomButton>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={filteredLedger}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 12 }}
            size="middle"
          />
        </div>
      </PageLayout>
    </>
  );
}