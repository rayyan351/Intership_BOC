// front-end/src/app/admin/(dashboard)/suppliers/analytics/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, Tag, Progress, Space } from 'antd';
import {
  ShopOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  PercentageOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import { useGetSupplierPerformanceAnalyticsQuery } from '@/services/inventoryApi';

export default function SupplierPerformancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading } = useGetSupplierPerformanceAnalyticsQuery();

  const summary = data?.summary || {
    totalVendors: 0,
    avgOnTime: 0,
    avgFillRate: 0,
    atRiskVendorsCount: 0,
    totalProcurementSpend: 0,
  };
  const scorecards = data?.scorecards || [];

  const filteredScorecards = scorecards.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.paymentTerms.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: 'Supplier & Contact',
      key: 'supplier',
      width: '24%',
      render: (_, r) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{r.name}</span>
          <span className="text-[11px] text-neutral-400">
            Terms: <strong className="text-neutral-600">{r.paymentTerms}</strong> • Orders: {r.completedOrders}/{r.totalOrders}
          </span>
        </div>
      ),
    },
    {
      title: 'Avg Lead Time',
      dataIndex: 'averageLeadTimeDays',
      key: 'leadTime',
      width: '14%',
      render: (days) => (
        <span className="font-mono font-bold text-xs text-neutral-800">
          {days} day{days === 1 ? '' : 's'}
        </span>
      ),
    },
    {
      title: 'On-Time Rate %',
      key: 'onTime',
      width: '18%',
      render: (_, r) => (
        <div className="w-full max-w-[120px]">
          <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
            <span>{r.onTimeRate}%</span>
          </div>
          <Progress
            percent={r.onTimeRate}
            size="small"
            showInfo={false}
            strokeColor={r.onTimeRate >= 90 ? '#10b981' : r.onTimeRate >= 75 ? '#f59e0b' : '#f43f5e'}
          />
        </div>
      ),
    },
    {
      title: 'Fill Rate (Accuracy %)',
      key: 'fillRate',
      width: '18%',
      render: (_, r) => (
        <div className="w-full max-w-[120px]">
          <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
            <span>{r.fillRate}%</span>
          </div>
          <Progress
            percent={r.fillRate}
            size="small"
            showInfo={false}
            strokeColor={r.fillRate >= 92 ? '#10b981' : '#f59e0b'}
          />
        </div>
      ),
    },
    {
      title: 'Price Variance (PPV)',
      dataIndex: 'priceVariancePercentage',
      key: 'ppv',
      width: '14%',
      render: (ppv) => {
        const isInflated = ppv > 0;
        return (
          <span
            className={`font-mono font-bold text-xs ${
              isInflated ? 'text-rose-600' : ppv < 0 ? 'text-emerald-600' : 'text-neutral-500'
            }`}
          >
            {isInflated ? `+${ppv}% (Inflation)` : `${ppv}%`}
          </span>
        );
      },
    },
    {
      title: 'Reliability Tier',
      dataIndex: 'reliabilityTier',
      key: 'tier',
      width: '12%',
      render: (tier) => {
        const badges = {
          EXCELLENT: { color: 'green', label: 'TIER 1 (EXCELLENT)' },
          MODERATE: { color: 'gold', label: 'TIER 2 (MODERATE)' },
          AT_RISK: { color: 'red', label: 'AT RISK' },
        };
        const badge = badges[tier] || { color: 'default', label: tier };
        return (
          <Tag color={badge.color} className="font-bold text-[9px] border-none">
            {badge.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <PageLayout
      title="Supplier Performance & Lead-Time Analytics"
      subTitle="Track vendor delivery speed, fill accuracy, and price inflation variance across procurement cycles"
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      searchPlaceholder="Search vendor by name, payment terms, or contact..."
    >
      {/* Metric Cards Summary */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Average On-Time Rate</span>}
              value={summary.avgOnTime}
              precision={1}
              styles={{ content: { color: '#059669', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">%</span>}
              prefix={<ClockCircleOutlined className="mr-1 text-emerald-600" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Average Order Fill Rate</span>}
              value={summary.avgFillRate}
              precision={1}
              styles={{ content: { color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">%</span>}
              prefix={<PercentageOutlined className="mr-1 text-blue-600" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">At-Risk Suppliers</span>}
              value={summary.atRiskVendorsCount}
              styles={{ content: { color: '#e11d48', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">vendors</span>}
              prefix={<WarningOutlined className="mr-1 text-rose-600" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-neutral-900 text-white">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Total Procurement Spend
            </span>
            <span className="font-mono font-bold text-xl text-[#ffc400]">
              Rs. {Number(summary.totalProcurementSpend || 0).toLocaleString()}
            </span>
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
        <Table
          columns={columns}
          dataSource={filteredScorecards}
          rowKey="supplierId"
          loading={isLoading}
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      </div>
    </PageLayout>
  );
}