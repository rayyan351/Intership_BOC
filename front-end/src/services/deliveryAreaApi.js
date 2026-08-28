// front-end/src/services/deliveryAreaApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const deliveryAreaApi = createApi({
  reducerPath: 'deliveryAreaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
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
  tagTypes: ['DeliveryAreas', 'SystemSettings'],
  endpoints: (builder) => ({
    getDeliveryAreas: builder.query({
      query: (params) => ({
        url: '/delivery-areas',
        params,
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.deliveryAreas)) return response.deliveryAreas;
        if (Array.isArray(response?.areas)) return response.areas;
        return [];
      },
      providesTags: ['DeliveryAreas'],
    }),
    createDeliveryArea: builder.mutation({
      query: (body) => ({
        url: '/delivery-areas',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryAreas'],
    }),
    updateDeliveryArea: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/delivery-areas/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeliveryAreas'],
    }),
    deleteDeliveryArea: builder.mutation({
      query: (id) => ({
        url: `/delivery-areas/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DeliveryAreas'],
    }),
    getSystemSettings: builder.query({
      query: () => '/delivery-areas/settings',
      providesTags: ['SystemSettings'],
    }),
    updateTaxSettings: builder.mutation({
      query: (body) => ({
        url: '/delivery-areas/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SystemSettings'],
    }),
  }),
});

export const {
  useGetDeliveryAreasQuery,
  useCreateDeliveryAreaMutation,
  useUpdateDeliveryAreaMutation,
  useDeleteDeliveryAreaMutation,
  useGetSystemSettingsQuery,
  useUpdateTaxSettingsMutation,
} = deliveryAreaApi;