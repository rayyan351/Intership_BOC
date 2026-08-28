// src/app/admin/(dashboard)/page.jsx
'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Table, Select } from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  AppstoreOutlined,
  AlertOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

import PageLayout from '@/app/admin/_components/layout/PageLayout';
import { useGetOrdersQuery } from '@/services/orderApi';
import { useGetInventoryItemsQuery } from '@/services/inventoryApi';
import { useGetProductsQuery } from '@/services/productApi';
import { useGetBranchesQuery } from '@/services/branchApi';
import { formatPrice } from '@/lib/currency';
import { formatRelativeTime } from '@/utils/formatDate';

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  preparing: { label: 'In Kitchen', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  delivered: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  completed: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  fulfilled: { label: 'Delivered', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export default function DashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [orderFilter, setOrderFilter] = useState('ACTIVE');

  const { data: ordersData = [], isLoading: loadingOrders } = useGetOrdersQuery();
  const { data: inventoryData } = useGetInventoryItemsQuery();
  const { data: productsData = [] } = useGetProductsQuery();
  const { data: branches = [] } = useGetBranchesQuery();

  const ordersList = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];
  const inventoryItems = inventoryData?.items || [];
  const productsList = Array.isArray(productsData) ? productsData : productsData?.products || [];

  const getNormalizedStatus = (record) => {
    const raw =
      record?.status ||
      record?.orderStatus ||
      record?.fulfillmentStatus ||
      record?.deliveryStatus ||
      'pending';

    return String(raw).toLowerCase().trim();
  };

  const branchOrders = useMemo(() => {
    if (selectedBranch === 'ALL') return ordersList;
    return ordersList.filter(
      (o) =>
        o.branch?._id === selectedBranch ||
        o.branch === selectedBranch ||
        o.assignedBranch?._id === selectedBranch
    );
  }, [ordersList, selectedBranch]);

  const metrics = useMemo(() => {
    const totalSales = branchOrders
      .filter((o) => getNormalizedStatus(o) !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.totalPrice) || Number(o.totalAmount) || 0), 0);

    const activeOrdersCount = branchOrders.filter((o) =>
      ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(getNormalizedStatus(o))
    ).length;

    const lowStockAlerts = inventoryItems.filter((item) => {
      const stock = item.totalStock ?? 0;
      const minStock = item.reorderPoint ?? item.minStockLevel ?? 10;
      return stock <= minStock;
    }).length;

    return {
      totalSales,
      activeOrdersCount,
      totalOrders: branchOrders.length,
      lowStockAlerts,
    };
  }, [branchOrders, inventoryItems]);

  const tableOrders = useMemo(() => {
    if (orderFilter === 'ACTIVE') {
      return branchOrders.filter((o) =>
        ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(getNormalizedStatus(o))
      );
    }
    if (orderFilter === 'DELIVERED') {
      return branchOrders.filter((o) =>
        ['delivered', 'completed', 'fulfilled'].includes(getNormalizedStatus(o))
      );
    }
    return branchOrders;
  }, [branchOrders, orderFilter]);

  const columns = [
    {
      title: 'Order Ref',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: '20%',
      render: (num, record) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 text-xs block">
            {num || `#${record._id?.slice(-6).toUpperCase()}`}
          </span>
          <span className="text-[11px] text-neutral-400 font-normal">
            {formatRelativeTime(record.createdAt)}
          </span>
        </div>
      ),
    },
    {
      title: 'Customer Details',
      key: 'customer',
      width: '24%',
      render: (_, r) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs block">
            {r.customer?.name || r.customerName || 'Walk-in Customer'}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {r.customer?.phone || r.phone || 'Direct Order'}
          </span>
        </div>
      ),
    },
    {
      title: 'Outlet',
      key: 'outlet',
      width: '18%',
      render: (_, r) => (
        <span className="text-xs font-semibold text-neutral-700">
          {r.branch?.name || r.assignedBranch?.name || 'Main Kitchen'}
        </span>
      ),
    },
    {
      title: 'Total Amount',
      key: 'total',
      width: '18%',
      render: (_, r) => (
        <div>
          <span className="font-mono font-bold text-xs text-neutral-900 block">
            {formatPrice(r.totalPrice || r.totalAmount || 0)}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase font-semibold">
            {r.paymentMethod || 'COD'}
          </span>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '20%',
      render: (_, record) => {
        const rawKey = getNormalizedStatus(record);
        const conf = STATUS_CONFIG[rawKey] || {
          label: rawKey.replace('_', ' '),
          bg: 'bg-slate-50',
          text: 'text-slate-700',
          border: 'border-slate-200',
        };

        return (
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${conf.bg} ${conf.text} ${conf.border} inline-block uppercase tracking-tight`}
          >
            {conf.label}
          </span>
        );
      },
    },
  ];

  return (
    <PageLayout
      title="Store Operations & Insights"
      subTitle="Real-time sales velocity, live order fulfillment status, and inventory thresholds"
      showSearch={false}
      extra={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-700 whitespace-nowrap">Filter Outlet:</span>
          <Select
            className="w-56 h-10 staff-modern-select"
            value={selectedBranch}
            onChange={setSelectedBranch}
            options={[
              { value: 'ALL', label: 'All Kitchen Outlets' },
              ...branches.map((b) => ({ value: b._id, label: `${b.name} (${b.city})` })),
            ]}
          />
        </div>
      }
    >
      <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-400 block tracking-tight">
                Net Revenue
              </span>
              <span className="text-2xl font-bold font-mono text-neutral-900 block mt-1">
                {formatPrice(metrics.totalSales)}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5 font-normal">
                {metrics.totalOrders} total orders processed
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              <DollarOutlined className="text-amber-600 text-lg" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-400 block tracking-tight">
                Active Live Orders
              </span>
              <span className="text-2xl font-bold font-mono text-neutral-900 block mt-1">
                {metrics.activeOrdersCount}
              </span>
              <span className="text-[11px] text-blue-600 font-semibold block mt-0.5">
                In Kitchen & Transit
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
              <ShoppingOutlined className="text-blue-600 text-lg" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-400 block tracking-tight">
                Menu Catalog Items
              </span>
              <span className="text-2xl font-bold font-mono text-neutral-900 block mt-1">
                {productsList.length}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5 font-normal">
                Active standard products
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0">
              <AppstoreOutlined className="text-indigo-600 text-lg" />
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-neutral-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-400 block tracking-tight">
                Low Stock Alerts
              </span>
              <span
                className={`text-2xl font-bold font-mono block mt-1 ${
                  metrics.lowStockAlerts > 0 ? 'text-rose-600' : 'text-neutral-900'
                }`}
              >
                {metrics.lowStockAlerts}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-0.5 font-normal">
                {metrics.lowStockAlerts > 0 ? 'Requires vendor reorder' : 'All items well-stocked'}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                metrics.lowStockAlerts > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <AlertOutlined className="text-lg" />
            </div>
          </div>
        </div>

        {/* Recent Orders Activity Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-neutral-900 block">
                Recent Order Activity Feed
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">
                Live stream of customer orders dispatched to kitchen outlets
              </span>
            </div>

            <div className="flex gap-1.5 p-1 bg-neutral-100/80 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setOrderFilter('ACTIVE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  orderFilter === 'ACTIVE'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Active ({metrics.activeOrdersCount})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  orderFilter === 'ALL'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                All ({branchOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter('DELIVERED')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  orderFilter === 'DELIVERED'
                    ? 'bg-white text-neutral-900 shadow-xs font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Delivered
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            <Table
              columns={columns}
              dataSource={tableOrders.slice(0, 8)}
              rowKey="_id"
              loading={loadingOrders}
              pagination={false}
              size="middle"
            />
          </div>

          <div className="pt-1 text-right">
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1.5 transition"
            >
              Open Full Order Dispatch <ArrowRightOutlined className="text-[10px]" />
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}