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
  }),
});

export const { useGetDealCategoriesQuery } = dealCategoryApi;