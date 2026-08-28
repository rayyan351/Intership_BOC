// src/app/admin/_components/notifications/NotificationDropdown.jsx
'use client';

import React from 'react';
import { Dropdown, Badge } from 'antd';
import {
  BellFilled,
  ShoppingCartOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { markAllAsRead, clearNotifications } from '@/redux/notification/notificationSlice';

const EMPTY_NOTIFICATIONS = [];

export default function NotificationDropdown() {
  const dispatch = useDispatch();

  const notifications = useSelector((state) => state.notifications?.notifications ?? EMPTY_NOTIFICATIONS);
  const unreadCount = useSelector((state) => state.notifications?.unreadCount ?? 0);

  const getIcon = (type) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingCartOutlined className="text-[#F4C61A] text-sm" />;
      case 'STOCK':
        return <WarningOutlined className="text-rose-500 text-sm" />;
      default:
        return <InfoCircleOutlined className="text-blue-500 text-sm" />;
    }
  };

  const notificationMenu = () => (
    <div className="w-[350px] bg-white rounded-2xl shadow-2xl border border-neutral-100 p-3.5 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-100 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase text-neutral-900 tracking-wider">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4C61A] text-neutral-950 font-mono">
              {unreadCount} new
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(markAllAsRead())}
              className="text-[11px] text-neutral-500 hover:text-neutral-950 font-semibold cursor-pointer transition"
            >
              Mark read
            </button>
            <button
              type="button"
              onClick={() => dispatch(clearNotifications())}
              className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer transition"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50 pr-1">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-xs text-neutral-400 font-medium">
            No active alerts or notifications
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id || n._id || Math.random()}
              className={`py-3 px-2.5 rounded-xl flex items-start gap-3 transition ${
                !n.read ? 'bg-amber-50/50' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-neutral-200/70 shadow-2xs mt-0.5 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-neutral-900 block truncate">
                  {n.title}
                </span>
                <p className="text-[11.5px] text-neutral-500 m-0 leading-snug mt-0.5">
                  {n.message}
                </p>
                <span className="text-[9.5px] text-neutral-400 font-mono mt-1.5 block">
                  {n.timestamp
                    ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Just now'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <Dropdown popupRender={notificationMenu} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        aria-label="View notifications"
        className="relative w-10 h-10 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800/80 flex items-center justify-center transition cursor-pointer shadow-2xs group"
      >
        <Badge
          count={unreadCount}
          size="small"
          offset={[2, -2]}
          styles={{ indicator: { backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 700 } }}
        >
          <BellFilled 
            style={{ color: '#F4C61A', fontSize: '17px' }}
            className="group-hover:scale-110 transition-transform" 
          />
        </Badge>
      </button>
    </Dropdown>
  );
}