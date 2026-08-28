// src/app/admin/_components/notifications/AdminNotificationToastListener.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { ShoppingCartOutlined, WarningOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/notification/notificationSlice';
import { useGetOrdersQuery } from '@/services/orderApi';
import { useGetLowStockAlertsQuery } from '@/services/inventoryApi';

export default function AdminNotificationToastListener() {
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  const isInitialOrdersLoad = useRef(true);
  const isInitialStockLoad = useRef(true);
  const knownOrderIds = useRef(new Set());
  const knownLowStockIds = useRef(new Set());

  // Polling intervals for live changes
  const { data: ordersData } = useGetOrdersQuery({}, { pollingInterval: 7000 });
  const { data: lowStockAlerts = [] } = useGetLowStockAlertsQuery({}, { pollingInterval: 12000 });

  const orders = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];

  // 1. Live Orders Toast Listener
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    if (isInitialOrdersLoad.current) {
      orders.forEach((o) => knownOrderIds.current.add(o._id || o.orderNumber));
      isInitialOrdersLoad.current = false;
      return;
    }

    const newOrders = orders.filter((o) => !knownOrderIds.current.has(o._id || o.orderNumber));

    if (newOrders.length > 0) {
      newOrders.forEach((latestOrder) => {
        knownOrderIds.current.add(latestOrder._id || latestOrder.orderNumber);

        const payload = {
          id: latestOrder._id || Date.now().toString(),
          title: 'New Order Received!',
          message: `Order #${latestOrder.orderNumber || ''} assigned to ${latestOrder.branch?.name || 'Main Kitchen'}.`,
          type: 'ORDER',
          timestamp: new Date().toISOString(),
        };

        dispatch(addNotification(payload));

        api.open({
          title: <span className="font-bold text-xs uppercase tracking-wide">New Order Received!</span>,
          description: (
            <div className="text-xs text-neutral-600 font-['Plus_Jakarta_Sans',sans-serif]">
              <strong className="text-neutral-900 block font-mono">{latestOrder.orderNumber}</strong>
              <span>{payload.message}</span>
            </div>
          ),
          icon: <ShoppingCartOutlined className="text-[#F4C61A]" />,
          placement: 'bottomRight',
          duration: 5,
          className: 'rounded-2xl border border-neutral-100 shadow-xl',
        });
      });
    }
  }, [orders, api, dispatch]);

  // 2. Low Stock Alerts Toast Listener
  useEffect(() => {
    if (!lowStockAlerts || lowStockAlerts.length === 0) return;

    if (isInitialStockLoad.current) {
      lowStockAlerts.forEach((item) => knownLowStockIds.current.add(item._id || item.item?._id));
      isInitialStockLoad.current = false;
      return;
    }

    const newStockAlerts = lowStockAlerts.filter(
      (item) => !knownLowStockIds.current.has(item._id || item.item?._id)
    );

    if (newStockAlerts.length > 0) {
      newStockAlerts.forEach((latestAlert) => {
        knownLowStockIds.current.add(latestAlert._id || latestAlert.item?._id);

        const payload = {
          id: latestAlert._id || Date.now().toString(),
          title: 'Low Stock Alert',
          message: `${latestAlert.item?.name || 'Raw material'} is running low at ${latestAlert.branch?.name || 'Outlet'}.`,
          type: 'STOCK',
          timestamp: new Date().toISOString(),
        };

        dispatch(addNotification(payload));

        api.warning({
          title: <span className="font-bold text-xs uppercase tracking-wide">Critical Stock Warning</span>,
          description: <span className="text-xs text-neutral-600 font-['Plus_Jakarta_Sans',sans-serif]">{payload.message}</span>,
          icon: <WarningOutlined className="text-rose-500" />,
          placement: 'bottomRight',
          duration: 6,
          className: 'rounded-2xl border border-rose-100 shadow-xl',
        });
      });
    }
  }, [lowStockAlerts, api, dispatch]);

  return <>{contextHolder}</>;
}