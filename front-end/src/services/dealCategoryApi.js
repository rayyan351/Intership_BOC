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
<<<<<<< HEAD
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
=======
  }),
});

export const { useGetDealCategoriesQuery } = dealCategoryApi;
>>>>>>> baf2848896e6108aa861d756300fb09f633993ac
