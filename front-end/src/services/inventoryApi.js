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
  tagTypes: [
    'Inventory',
    'Ledger',
    'Suppliers',
    'StockTransactions',
    'PurchaseOrders',
    'Recipes',
    'Stocktakes',
    'Batches',
  ],
  endpoints: (builder) => ({
    // ---------------- INVENTORY ITEMS ----------------
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
    deleteInventoryItem: builder.mutation({
      query: (id) => ({
        url: `/inventory/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inventory', 'Ledger'],
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

    // ---------------- SUPPLIERS ----------------
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

    // ---------------- PURCHASE ORDERS (PILLAR 2) ----------------
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
      invalidatesTags: ['PurchaseOrders', 'Inventory'],
    }),
    receivePurchaseOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/purchase-orders/${id}/receive`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PurchaseOrders', 'Inventory', 'Ledger', 'Batches'],
    }),
    updatePurchaseOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/purchase-orders/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),
    deletePurchaseOrder: builder.mutation({
      query: (id) => ({
        url: `/purchase-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PurchaseOrders'],
    }),

    // ---------------- AUDIT & RECONCILIATION ----------------
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

    // ---------------- RECIPES & BATCH PREP ----------------
    getAllRecipes: builder.query({
      query: (params) => ({
        url: '/recipes',
        params,
      }),
      providesTags: ['Recipes', 'Inventory'],
    }),
    saveRecipe: builder.mutation({
      query: (body) => ({
        url: '/recipes',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Recipes', 'Inventory'],
    }),
    produceSubRecipeBatch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/recipes/${id}/produce-batch`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Recipes', 'Inventory', 'Ledger'],
    }),
    deleteRecipe: builder.mutation({
      query: (id) => ({
        url: `/recipes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Recipes'],
    }),
  }),
});

export const {
  // Inventory
  useGetInventoryItemsQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useAdjustStockMutation,
  useGetStockLedgerQuery,
  useGetLowStockAlertsQuery,
  useTransferStockMutation,

  // Suppliers
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,

  // Purchase Orders
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceivePurchaseOrderMutation,
  useUpdatePurchaseOrderStatusMutation,
  useDeletePurchaseOrderMutation,

  // Stocktake & Batches
  useGetStocktakesQuery,
  useSubmitStocktakeMutation,
  useGetStockBatchesQuery,
  useDiscardBatchMutation,

  // Recipes & Batch Prep
  useGetAllRecipesQuery,
  useSaveRecipeMutation,
  useProduceSubRecipeBatchMutation,
  useDeleteRecipeMutation,
} = inventoryApi;