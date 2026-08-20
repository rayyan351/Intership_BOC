// front-end/src/services/inventoryApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const inventoryApi = createApi({
  reducerPath: 'inventoryApi',
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
  tagTypes: ['Inventory', 'Ledger', 'Suppliers'],
  endpoints: (builder) => ({
    getInventoryItems: builder.query({
      query: (params) => ({
        url: '/inventory',
        params,
      }),
      providesTags: ['Inventory'],
    }),
    createInventoryItem: builder.mutation({
      query: (body) => ({
        url: '/inventory',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'Ledger'],
    }),
    updateInventoryItem: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/inventory/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Inventory'],
    }),
    adjustStock: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/inventory/${id}/adjust`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'Ledger'],
    }),
    getStockLedger: builder.query({
      query: (params) => ({
        url: '/inventory/ledger',
        params,
      }),
      providesTags: ['Ledger'],
    }),
    // Suppliers endpoints
    getSuppliers: builder.query({
      query: () => '/suppliers',
      providesTags: ['Suppliers'],
    }),
    createSupplier: builder.mutation({
      query: (body) => ({
        url: '/suppliers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/suppliers/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplier: builder.mutation({
      query: (id) => ({
        url: `/suppliers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
});

export const {
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useAdjustStockMutation,
  useGetStockLedgerQuery,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = inventoryApi;