import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';
import { endpoints } from './api';

export const dealApi = createApi({
  reducerPath: 'dealApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl,
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
  tagTypes: ['Deals'],
  endpoints: (builder) => ({
    getDeals: builder.query({
      query: () => endpoints.deals.base,
      providesTags: ['Deals'],
    }),
    createDeal: builder.mutation({
      query: (body) => ({
        url: endpoints.deals.base,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Deals'],
    }),
    updateDeal: builder.mutation({
      query: ({ id, body }) => ({
        url: `${endpoints.deals.base}/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Deals'],
    }),
    deleteDeal: builder.mutation({
      query: (id) => ({
        url: `${endpoints.deals.base}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Deals'],
    }),
  }),
});

export const {
  useGetDealsQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
} = dealApi;