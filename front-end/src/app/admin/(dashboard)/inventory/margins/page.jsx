// front-end/src/app/admin/(dashboard)/inventory/margins/page.jsx
'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, Tag, Progress, Modal, Button } from 'antd';
import {
  RiseOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import PageLayout from '@/app/admin/_components/layout/PageLayout';
import { useGetRecipeMarginsQuery } from '@/services/inventoryApi';

export default function RecipeMarginsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductBreakdown, setSelectedProductBreakdown] = useState(null);

  const { data, isLoading } = useGetRecipeMarginsQuery();
  const summary = data?.summary || { totalAnalyzed: 0, avgFoodCostPct: 0, criticalItemsCount: 0, optimalItemsCount: 0 };
  const items = data?.items || [];

  const filteredItems = items.filter((row) => {
    const term = searchTerm.toLowerCase();
    return (
      row.product.name?.toLowerCase().includes(term) ||
      row.product.category?.toLowerCase().includes(term) ||
      row.product.sku?.toLowerCase().includes(term)
    );
  });

  const columns = [
    {
      title: 'Menu Product',
      key: 'product',
      width: '26%',
      render: (_, r) => (
        <div>
          <span className="font-bold text-neutral-900 text-xs block">{r.product.name}</span>
          <span className="text-[11px] text-neutral-400">
            Category: <strong className="text-neutral-600">{r.product.category || 'General'}</strong> • SKU: {r.product.sku || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      title: 'Selling Price',
      key: 'price',
      width: '14%',
      render: (_, r) => (
        <span className="font-mono font-bold text-xs text-neutral-900">
          Rs. {r.product.sellingPrice.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'BOM Cost (COGS)',
      key: 'cogs',
      width: '14%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-rose-700 block">
            Rs. {r.totalCostOfGoods.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-400">{r.ingredients.length} raw ingredients</span>
        </div>
      ),
    },
    {
      title: 'Gross Margin (PKR)',
      key: 'margin',
      width: '16%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-emerald-700 block">
            Rs. {r.grossProfit.toLocaleString()}
          </span>
          <span className="text-[11px] font-semibold text-neutral-500">
            {r.grossMarginPercentage}% margin
          </span>
        </div>
      ),
    },
    {
      title: 'Food Cost %',
      key: 'foodCost',
      width: '18%',
      render: (_, r) => {
        let strokeColor = '#10b981'; // Green
        if (r.foodCostPercentage > 40) strokeColor = '#f43f5e'; // Red
        else if (r.foodCostPercentage > 33) strokeColor = '#f59e0b'; // Amber

        return (
          <div className="w-full max-w-[130px]">
            <div className="flex justify-between text-[11px] font-mono font-bold mb-1">
              <span>{r.foodCostPercentage}%</span>
            </div>
            <Progress
              percent={Math.min(100, r.foodCostPercentage)}
              size="small"
              showInfo={false}
              strokeColor={strokeColor}
            />
          </div>
        );
      },
    },
    {
      title: 'Health',
      dataIndex: 'marginHealth',
      key: 'health',
      width: '12%',
      render: (health) => {
        const badges = {
          OPTIMAL: { color: 'green', label: 'OPTIMAL' },
          HIGH_MARGIN: { color: 'purple', label: 'HIGH PROFIT' },
          WARNING: { color: 'gold', label: 'ELEVATED' },
          CRITICAL: { color: 'red', label: 'HIGH COGS' },
        };
        const badge = badges[health] || { color: 'default', label: health };
        return (
          <Tag color={badge.color} className="font-bold text-[9.5px] border-none">
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
      render: (_, r) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setSelectedProductBreakdown(r)}
          className="text-neutral-600 hover:text-neutral-900"
        />
      ),
    },
  ];

  return (
    <PageLayout
      title="Recipe Costing & Profitability"
      subTitle="Real-time food cost percentage (COGS), gross margins, and ingredient cost weight analysis"
      searchValue={searchTerm}
      onSearch={setSearchTerm}
      searchPlaceholder="Search recipe by product name or SKU..."
    >
      {/* Metric Cards Summary */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Average Food Cost</span>}
              value={summary.avgFoodCostPct}
              precision={1}
              styles={{ content: { color: '#0f172a', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">% COGS</span>}
              prefix={<PieChartOutlined className="mr-1" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Optimal Margin Items</span>}
              value={summary.optimalItemsCount}
              styles={{ content: { color: '#059669', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">/ {summary.totalAnalyzed}</span>}
              prefix={<CheckCircleOutlined className="mr-1 text-emerald-600" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">High COGS Alerts</span>}
              value={summary.criticalItemsCount}
              styles={{ content: { color: '#e11d48', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">items</span>}
              prefix={<WarningOutlined className="mr-1 text-rose-600" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-neutral-200 shadow-sm bg-white">
            <Statistic
              title={<span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Target Food Cost</span>}
              value="28 - 35"
              styles={{ content: { color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' } }}
              suffix={<span className="text-xs font-normal text-neutral-400">% Industry Std</span>}
              prefix={<RiseOutlined className="mr-1" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm font-['Plus_Jakarta_Sans',sans-serif]">
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="recipeId"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
        />
      </div>

      {/* Ingredient Cost Contribution Modal */}
      <Modal
        open={!!selectedProductBreakdown}
        onCancel={() => setSelectedProductBreakdown(null)}
        footer={null}
        title={null}
        centered
        width={680}
        className="font-['Plus_Jakarta_Sans',sans-serif]"
      >
        {selectedProductBreakdown && (
          <div className="pt-2 pb-1">
            <div className="flex justify-between items-start border-b border-neutral-200 pb-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 m-0">
                  {selectedProductBreakdown.product.name}
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  Price: Rs. {selectedProductBreakdown.product.sellingPrice} • Total COGS: Rs.{' '}
                  {selectedProductBreakdown.totalCostOfGoods}
                </span>
              </div>
              <Tag
                color={
                  selectedProductBreakdown.foodCostPercentage > 35 ? 'error' : 'success'
                }
                className="font-bold text-xs"
              >
                {selectedProductBreakdown.foodCostPercentage}% Food Cost
              </Tag>
            </div>

            <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Ingredient Cost Weight Breakdown
            </span>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedProductBreakdown.ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center text-xs"
                >
                  <div className="flex-1">
                    <span className="font-bold text-neutral-900 block">{ing.name}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {ing.quantityRequired} {ing.recipeUnit} × Rs. {ing.unitCost} / {ing.recipeUnit}
                    </span>
                  </div>

                  <div className="text-right flex items-center gap-4">
                    <div>
                      <span className="font-mono font-bold text-xs text-neutral-900 block">
                        Rs. {ing.lineCost}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {ing.costContributionPercentage}% of total COGS
                      </span>
                    </div>
                    <Progress
                      type="circle"
                      percent={ing.costContributionPercentage}
                      size={32}
                      strokeColor="#0f172a"
                      format={(pct) => `${pct}%`}
                      className="text-[9px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}