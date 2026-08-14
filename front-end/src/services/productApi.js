// front-end/src/services/productApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';
import { endpoints } from './api';

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl,
  }),
  tagTypes: ['Products'], // Cache tag for auto-refetching
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: () => endpoints.products.base,
      providesTags: ['Products'],
    }),
    createProduct: builder.mutation({
      query: (formData) => ({
        url: endpoints.products.base,
        method: 'POST',
        body: formData, // Auto-handles FormData boundary headers
      }),
      invalidatesTags: ['Products'], // Automatically refetches table data
    }),
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: endpoints.products.byId(id),
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Products'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: endpoints.products.byId(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),
    toggleAvailability: builder.mutation({
      query: ({ id, isShown }) => ({
        url: endpoints.products.byId(id),
        method: 'PUT',
        body: { isShown },
      }),
      invalidatesTags: ['Products'],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useToggleAvailabilityMutation,
} = productApi;