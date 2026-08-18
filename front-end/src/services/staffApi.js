// src/services/staffApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000/api',
    prepareHeaders: (headers, { getState }) => {
      // Check both redux state and common localStorage keys
      const token =
        getState()?.auth?.token ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('adminToken')
          : null);

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Staff'],
  endpoints: (builder) => ({
    getStaff: builder.query({
      query: () => '/staff',
      providesTags: ['Staff'],
    }),
    createStaff: builder.mutation({
      query: (body) => ({
        url: '/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    updateStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/staff/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),
    deleteStaff: builder.mutation({
      query: (id) => ({
        url: `/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} = staffApi;