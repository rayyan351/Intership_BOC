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
  tagTypes: ['Inventory', 'Ledger', 'Suppliers', 'StockTransactions', 'PurchaseOrders', 'Recipes', 'Stocktakes', 'Batches'],
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
    getLowStockAlerts: builder.query({
      query: (params) => ({
        url: '/inventory/alerts/low-stock',
        params,
      }),
      providesTags: ['Inventory', 'StockTransactions', 'PurchaseOrders'],
    }),
    transferStock: builder.mutation({
      query: (body) => ({
        url: '/inventory/transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Inventory', 'Ledger', 'StockTransactions'],
    }),
    getRecipeMargins: builder.query({
      query: () => '/inventory/analytics/recipe-margins',
      providesTags: ['Recipes', 'Inventory', 'PurchaseOrders'],
    }),
    getStocktakes: builder.query({
      query: (params) => ({
        url: '/inventory/stocktakes',
        params,
      }),
      providesTags: ['Stocktakes'],
    }),
    submitStocktake: builder.mutation({
      query: (body) => ({
        url: '/inventory/stocktakes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Stocktakes', 'Inventory', 'Ledger', 'StockTransactions'],
    }),
    getAutoReorderSuggestions: builder.query({
      query: (params) => ({
        url: '/inventory/auto-reorder/suggestions',
        params,
      }),
      providesTags: ['Inventory', 'PurchaseOrders', 'StockTransactions'],
    }),
    generateAutoReorderPO: builder.mutation({
      query: (body) => ({
        url: '/inventory/auto-reorder/generate-po',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrders', 'Inventory'],
    }),
    getStockValuationReport: builder.query({
      query: (params) => ({
        url: '/inventory/analytics/valuation',
        params,
      }),
      providesTags: ['Inventory', 'StockTransactions', 'PurchaseOrders', 'Ledger'],
    }),
    getSupplierPerformanceAnalytics: builder.query({
      query: () => '/suppliers/analytics/performance',
      providesTags: ['Suppliers', 'PurchaseOrders', 'StockTransactions'],
    }),
    getStockBatches: builder.query({
      query: (params) => ({
        url: '/inventory/batches',
        params,
      }),
      providesTags: ['Batches', 'Inventory', 'StockTransactions'],
    }),
    discardBatch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/inventory/batches/${id}/discard`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Batches', 'Inventory', 'Ledger', 'StockTransactions'],
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
  useGetLowStockAlertsQuery,
  useTransferStockMutation,
  useGetRecipeMarginsQuery,
  useGetStocktakesQuery,
  useSubmitStocktakeMutation,
  useGetAutoReorderSuggestionsQuery,
  useGenerateAutoReorderPOMutation,
  useGetStockValuationReportQuery,
  useGetSupplierPerformanceAnalyticsQuery,
  useGetStockBatchesQuery,
  useDiscardBatchMutation,
} = inventoryApi;