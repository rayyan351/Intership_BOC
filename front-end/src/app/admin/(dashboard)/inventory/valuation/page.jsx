// front-end/src/app/admin/(dashboard)/inventory/valuation/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Progress, Tag, Space } from 'antd';
import {
  DollarOutlined,
  AppstoreOutlined,
  ShopOutlined,
  DownloadOutlined,
  PrinterOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import CustomButton from '@/app/admin/_components/formElements/button/Custombutton';
import { useGetStockValuationReportQuery } from '@/services/inventoryApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { exportToCSV } from '@/utils/exportCsv';
import { exportValuationBalanceSheetPDF } from '@/utils/exportValuationPdf';
import { useToast } from '@/utils/toast';

export default function StockValuationPage() {
  const { contextHolder, showWarning } = useToast();
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useGetStockValuationReportQuery({
    branchId: selectedBranch || undefined,
  });
  const { data: branches = [] } = useGetBranchesQuery();

  const summary = data?.summary || { totalAssetValuation: 0, totalStockUnits: 0, totalSkus: 0, activeBranchesCount: 0 };
  const categoryDistribution = data?.categoryDistribution || [];
  const branchDistribution = data?.branchDistribution || [];
  const items = data?.items || [];

  const filteredItems = items.filter((i) => {
    const term = searchTerm.toLowerCase();
    return (
      i.name.toLowerCase().includes(term) ||
      i.sku.toLowerCase().includes(term) ||
      i.category.toLowerCase().includes(term) ||
      i.primarySupplier.toLowerCase().includes(term)
    );
  });

  const activeBranchName =
    branches.find((b) => b._id === selectedBranch)?.name || 'Consolidated (All Outlets)';

  const handleExportCSV = () => {
    if (!filteredItems.length) {
      return showWarning('No valuation records available to export.');
    }

    const headers = [
      { label: 'Material Name', key: 'name' },
      { label: 'SKU', key: 'sku' },
      { label: 'Category', key: 'category' },
      { label: 'Primary Supplier', key: 'primarySupplier' },
      { label: 'Recipe Unit', key: 'recipeUnit' },
      { label: 'Current Total Stock', key: 'totalStock' },
      { label: 'WAC Unit Cost (PKR)', key: 'costPerRecipeUnit' },
      { label: 'Holding Asset Valuation (PKR)', key: 'totalValuation' },
    ];

    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCSV(filteredItems, headers, `Stock_Asset_Valuation_${timestamp}.csv`);
  };

  const handleExportPDF = () => {
    if (!filteredItems.length) {
      return showWarning('No valuation records available to export.');
    }

    exportValuationBalanceSheetPDF({
      summary,
      categoryDistribution,
      branchDistribution,
      items: filteredItems,
      activeBranchName,
    });
  };

  const columns = [
    {
      title: 'Material & SKU',
      key: 'material',
      width: '26%',
      render: (_, r) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{r.name}</span>
          <span className="text-[11px] font-mono text-neutral-400">
            SKU: {r.sku} • Category: <strong className="text-neutral-600 font-sans">{r.category}</strong>
          </span>
        </div>
      ),
    },
    {
      title: 'Primary Supplier',
      dataIndex: 'primarySupplier',
      key: 'supplier',
      width: '18%',
      render: (supplier) => (
        <span className="text-xs font-semibold text-neutral-700">{supplier}</span>
      ),
    },
    {
      title: 'Stock Balance',
      key: 'stock',
      width: '18%',
      render: (_, r) => (
        <span className="font-mono font-bold text-xs text-neutral-900">
          {r.totalStock.toLocaleString()} <span className="text-[11px] font-normal text-neutral-500">{r.recipeUnit}</span>
        </span>
      ),
    },
    {
      title: 'WAC Unit Cost',
      dataIndex: 'costPerRecipeUnit',
      key: 'unitCost',
      width: '18%',
      render: (cost, r) => (
        <span className="font-mono text-xs text-neutral-700">
          Rs. {Number(cost).toFixed(2)} / {r.recipeUnit}
        </span>
      ),
    },
    {
      title: 'Asset Valuation (PKR)',
      dataIndex: 'totalValuation',
      key: 'valuation',
      align: 'right',
      width: '20%',
      render: (val) => (
        <span className="font-mono font-bold text-xs text-emerald-700">
          Rs. {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <PageLayout
        title="Stock Valuation & Asset Balance Sheet"
        subTitle="Executive financial accounting of capital assets held in warehouse and kitchen inventory by outlet and category"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Search material by name, SKU, category, or supplier..."
      >
        {/* KPI Financial Cards */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-neutral-900 text-white">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Total Inventory Capital Asset
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-2xl text-[#ffc400]">
                  Rs. {Number(summary.totalAssetValuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <DollarOutlined className="text-2xl text-neutral-500" />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Inventory SKUs</span>}
                value={summary.totalSkus}
                styles={{ content: { color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<AppstoreOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">materials</span>}
              />
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
              <Statistic
                title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Active Outlets Capitalized</span>}
                value={summary.activeBranchesCount}
                styles={{ content: { color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' } }}
                prefix={<ShopOutlined className="mr-1" />}
                suffix={<span className="text-xs font-normal text-neutral-400">kitchens</span>}
              />
            </Card>
          </Col>
        </Row>

        {/* Category & Outlet Distribution Split */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12}>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm h-full font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-3">
                Capital Allocation by Category
              </span>
              <div className="space-y-3">
                {categoryDistribution.map((cat) => (
                  <div key={cat.category} className="text-xs">
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-neutral-900">{cat.category} ({cat.itemCount} SKUs)</span>
                      <span className="font-mono text-neutral-700">
                        Rs. {cat.totalValuation.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <Progress percent={cat.percentage} size="small" strokeColor="#0f172a" showInfo={false} />
                  </div>
                ))}
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm h-full font-['Plus_Jakarta_Sans',sans-serif]">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block mb-3">
                Asset Allocation by Kitchen Outlet
              </span>
              <div className="space-y-3">
                {branchDistribution.map((b) => (
                  <div key={b.branchId} className="text-xs">
                    <div className="flex justify-between font-semibold mb-1">
                      <span className="text-neutral-900">{b.branchName} ({b.city})</span>
                      <span className="font-mono text-neutral-700">
                        Rs. {b.totalValuation.toLocaleString()} ({b.percentage}%)
                      </span>
                    </div>
                    <Progress percent={b.percentage} size="small" strokeColor="#2563eb" showInfo={false} />
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>

        {/* Filter & Export Bar */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm mb-4 flex flex-wrap justify-between items-end gap-3">
          <div className="w-72">
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Filter by Kitchen Outlet Scope
            </label>
            <Select
              className="w-full"
              placeholder="All Kitchen Outlets (Consolidated)"
              allowClear
              value={selectedBranch || undefined}
              onChange={(val) => setSelectedBranch(val || '')}
              options={branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` }))}
            />
          </div>

          <div className="flex gap-2">
            <CustomButton
              variant="secondary"
              onClick={handleExportCSV}
              className="h-8 flex items-center justify-center gap-1.5 font-semibold text-xs border-neutral-300 hover:border-neutral-400"
            >
              <DownloadOutlined /> Export CSV
            </CustomButton>

            <CustomButton
              variant="primary"
              onClick={handleExportPDF}
              className="h-8 flex items-center justify-center gap-1.5 font-semibold text-xs bg-[#0f172a] hover:bg-[#1e293b] text-white border-none"
            >
              <PrinterOutlined /> Print Balance Sheet
            </CustomButton>
          </div>
        </div>

        {/* Material Asset Valuation Table */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            size="middle"
          />
        </div>
      </PageLayout>
    </>
  );
}