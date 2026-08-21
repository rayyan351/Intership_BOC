// front-end/src/services/purchaseOrderApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const purchaseOrderApi = createApi({
  reducerPath: 'purchaseOrderApi',
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
  tagTypes: ['PurchaseOrders', 'Inventory', 'Ledger', 'StockTransactions', 'Batches'],
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query({
      query: (params) => ({
        url: '/purchase-orders',
        params,
      }),
      providesTags: ['PurchaseOrders'],
    }),
    createPurchaseOrder: builder.mutation({
      query: (body) => ({
        url: '/purchase-orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    updatePOStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchase-orders/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    receivePurchaseOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/purchase-orders/${id}/receive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrders', 'Inventory', 'Ledger', 'StockTransactions', 'Batches'],
    }),
  }),
});

export const {
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePOStatusMutation,
  useReceivePurchaseOrderMutation,
} = purchaseOrderApi;