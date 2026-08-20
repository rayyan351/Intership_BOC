// front-end/src/services/authApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { endpoints } from './api';
import { siteConfig } from '@/config/site';

export const authApi = createApi({
  reducerPath: 'authApi',
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
  tagTypes: ['AuthUser'],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: endpoints?.auth?.login || '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['AuthUser'],
    }),
    getProfile: builder.query({
      query: () => ({
        url: '/auth/profile',
        method: 'GET',
      }),
      providesTags: ['AuthUser'],
    }),
    updateProfile: builder.mutation({
      query: (body) => ({
        url: '/auth/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AuthUser'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
} = authApi;