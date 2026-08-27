// src/app/admin/_components/notifications/AdminNotificationToastListener.jsx
'use client';

import React, { useEffect, useRef } from 'react';
import { notification } from 'antd';
import { ShoppingCartOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { addNotification } from '@/redux/notification/notificationSlice';
import { useGetOrdersQuery } from '@/services/orderApi';
import { useGetLowStockAlertsQuery } from '@/services/inventoryApi';

export default function AdminNotificationToastListener() {
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  const prevOrdersCountRef = useRef(null);
  const prevLowStockCountRef = useRef(null);

  // Poll for incoming live orders & stock warnings
  const { data: orders = [] } = useGetOrdersQuery({}, { pollingInterval: 7000 });
  const { data: lowStockAlerts = [] } = useGetLowStockAlertsQuery({}, { pollingInterval: 12000 });

  // 1. Trigger when a new customer order lands
  useEffect(() => {
    if (prevOrdersCountRef.current === null) {
      prevOrdersCountRef.current = orders.length;
      return;
    }

    if (orders.length > prevOrdersCountRef.current) {
      const latestOrder = orders[0];
      const payload = {
        title: 'New Customer Order Placed!',
        message: `Order #${latestOrder?.orderNumber || ''} assigned to ${latestOrder?.branch?.name || 'Main Kitchen'}.`,
        type: 'ORDER',
      };

      dispatch(addNotification(payload));

      api.open({
        message: <span className="font-bold text-xs uppercase tracking-wide">New Order Received!</span>,
        description: (
          <div className="text-xs text-neutral-600 font-['Plus_Jakarta_Sans']">
            <strong className="text-neutral-900 block font-mono">{latestOrder?.orderNumber}</strong>
            <span>{payload.message}</span>
          </div>
        ),
        icon: <ShoppingCartOutlined className="text-amber-500" />,
        placement: 'bottomRight',
        duration: 5,
        className: 'rounded-2xl border border-neutral-100 shadow-xl',
      });
    }

    prevOrdersCountRef.current = orders.length;
  }, [orders, api, dispatch]);

  // 2. Trigger on low ingredient inventory alerts
  useEffect(() => {
    if (prevLowStockCountRef.current === null) {
      prevLowStockCountRef.current = lowStockAlerts.length;
      return;
    }

    if (lowStockAlerts.length > prevLowStockCountRef.current) {
      const latestAlert = lowStockAlerts[0];
      const payload = {
        title: 'Low Ingredient Stock Alert',
        message: `${latestAlert?.item?.name || 'Raw stock'} is running low at ${latestAlert?.branch?.name || 'Outlet'}.`,
        type: 'STOCK',
      };

      dispatch(addNotification(payload));

      api.warning({
        message: <span className="font-bold text-xs uppercase tracking-wide">Critical Stock Warning</span>,
        description: <span className="text-xs text-neutral-600">{payload.message}</span>,
        icon: <WarningOutlined className="text-rose-500" />,
        placement: 'bottomRight',
        duration: 6,
        className: 'rounded-2xl border border-rose-100 shadow-xl',
      });
    }

    prevLowStockCountRef.current = lowStockAlerts.length;
  }, [lowStockAlerts, api, dispatch]);

  return <>{contextHolder}</>;
}