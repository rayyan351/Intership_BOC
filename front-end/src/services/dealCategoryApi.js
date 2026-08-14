import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const dealCategoryApi = createApi({
  reducerPath: 'dealCategoryApi',
  baseQuery: fetchBaseQuery({ baseUrl: siteConfig?.baseUrl }),
  tagTypes: ['DealCategories'],
  endpoints: (builder) => ({
    getDealCategories: builder.query({
      query: () => '/deal-categories',
      providesTags: ['DealCategories'],
    }),
    createDealCategory: builder.mutation({
      query: (body) => ({
        url: '/deal-categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DealCategories'],
    }),
    updateDealCategory: builder.mutation({
      query: ({ id, body }) => ({
        url: `/deal-categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DealCategories'],
    }),
    deleteDealCategory: builder.mutation({
      query: (id) => ({
        url: `/deal-categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['DealCategories'],
    }),
  }),
});

export const {
  useGetDealCategoriesQuery,
  useCreateDealCategoryMutation,
  useUpdateDealCategoryMutation,
  useDeleteDealCategoryMutation,
} = dealCategoryApi;
