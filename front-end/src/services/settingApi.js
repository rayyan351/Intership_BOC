import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const settingApi = createApi({
  reducerPath: 'settingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl || 'http://localhost:5000/api',
    prepareHeaders: (headers) => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('adminToken') || localStorage.getItem('token')
          : null;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Settings'],
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),
    updateSettings: builder.mutation({
      query: (formData) => ({
        url: '/settings',
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingApi;