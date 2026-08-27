// src/redux/notification/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [
    {
      id: 'notif-1',
      title: 'System Initialized',
      message: 'Branch inventory tracking and kitchen feeds are live.',
      type: 'SYSTEM',
      read: true,
      timestamp: new Date().toISOString(),
    },
  ],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotification = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    markAsRead: (state, action) => {
      const target = state.notifications.find((n) => n.id === action.payload);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAllAsRead, markAsRead, clearNotifications } =
  notificationSlice.actions;
export default notificationSlice.reducer;