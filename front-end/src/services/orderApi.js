// front-end/src/services/orderApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const orderApi = createApi({
  reducerPath: 'orderApi',
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
  tagTypes: ['Orders', 'Inventory', 'Ledger', 'StockTransactions', 'Batches'],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Orders'],
    }),
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Orders', 'Inventory', 'Ledger', 'StockTransactions', 'Batches'],
    }),
    createPaymentIntent: builder.mutation({
      query: (body) => ({
        url: '/orders/create-payment-intent',
        method: 'POST',
        body,
      }),
    }),
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/status`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Orders', 'Inventory', 'Ledger', 'StockTransactions', 'Batches'],
    }),
    trackOrder: builder.query({
      query: (orderNumber) => `/orders/${orderNumber}`,
      providesTags: (result, error, orderNumber) => [{ type: 'Orders', id: orderNumber }],
    }),
    // front-end/src/services/orderApi.js
    cancelCustomerOrder: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/orders/${id}/cancel-customer`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Orders', 'Inventory', 'Ledger'],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders', 'Inventory', 'Ledger', 'StockTransactions'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCreatePaymentIntentMutation,
  useUpdateOrderStatusMutation,
  useTrackOrderQuery,
  useCancelCustomerOrderMutation,
  useDeleteOrderMutation,
} = orderApi;