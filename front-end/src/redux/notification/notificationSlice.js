// src/redux/notification/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const loadSavedNotifications = () => {
  if (typeof window === 'undefined') return { notifications: [], unreadCount: 0 };
  try {
    const data = localStorage.getItem('admin_notifications');
    if (data) {
      const parsed = JSON.parse(data);
      const unreadCount = parsed.filter((n) => !n.read).length;
      return { notifications: parsed, unreadCount };
    }
  } catch (e) {
    console.error('Failed to load notifications from storage', e);
  }
  return { notifications: [], unreadCount: 0 };
};

const initialState = loadSavedNotifications();

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const newNotif = {
        id: action.payload.id || Date.now().toString(),
        title: action.payload.title,
        message: action.payload.message,
        type: action.payload.type || 'INFO',
        timestamp: action.payload.timestamp || new Date().toISOString(),
        read: false,
      };

      // Keep maximum 30 notifications in memory
      state.notifications = [newNotif, ...state.notifications].slice(0, 30);
      state.unreadCount = state.notifications.filter((n) => !n.read).length;

      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_notifications', JSON.stringify(state.notifications));
      }
    },
    markAllAsRead: (state) => {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_notifications', JSON.stringify(state.notifications));
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_notifications');
      }
    },
  },
});

export const { addNotification, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;