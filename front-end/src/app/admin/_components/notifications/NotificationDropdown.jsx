// src/app/admin/_components/notifications/NotificationDropdown.jsx
'use client';

import React from 'react';
import { Dropdown, Badge, Button } from 'antd';
import {
  BellOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { markAllAsRead, clearNotifications } from '@/redux/notification/notificationSlice';

export default function NotificationDropdown() {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications || { notifications: [], unreadCount: 0 });

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCartOutlined className="text-amber-500 text-sm" />;
      case 'STOCK':
        return <WarningOutlined className="text-rose-500 text-sm" />;
      default:
        return <InfoCircleOutlined className="text-blue-500 text-sm" />;
    }
  };

  const notificationMenu = (
    <div className="w-[340px] bg-white rounded-2xl shadow-2xl border border-neutral-100 p-3 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-neutral-100 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-mono">
              {unreadCount} new
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(markAllAsRead())}
              className="text-[11px] text-neutral-500 hover:text-black font-semibold cursor-pointer"
            >
              Mark read
            </button>
            <button
              onClick={() => dispatch(clearNotifications())}
              className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-50 pr-1">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 font-medium">
            No active alerts or notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`py-2.5 px-2 rounded-xl flex items-start gap-2.5 transition ${
                !n.read ? 'bg-amber-50/40' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-white border border-neutral-200/60 shadow-2xs mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-neutral-900 block truncate">
                  {n.title}
                </span>
                <p className="text-[11px] text-neutral-500 m-0 leading-tight">
                  {n.message}
                </p>
                <span className="text-[9px] text-neutral-400 font-mono mt-1 block">
                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dropdown overlay={notificationMenu} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        className="relative w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition cursor-pointer"
      >
        <Badge count={unreadCount} size="small" offset={[2, -2]}>
          <BellOutlined className="text-sm text-neutral-700" />
        </Badge>
      </button>
    </Dropdown>
  );
}