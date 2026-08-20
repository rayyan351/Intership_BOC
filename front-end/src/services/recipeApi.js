// front-end/src/services/recipeApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const recipeApi = createApi({
  reducerPath: 'recipeApi',
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
  tagTypes: ['Recipe', 'Product'],
  endpoints: (builder) => ({
    getRecipeByProduct: builder.query({
      query: (productId) => `/recipes/product/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Recipe', id: productId }],
    }),
    upsertRecipe: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/recipes/product/${productId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Recipe', id: productId },
        'Product',
      ],
    }),
  }),
});

export const { useGetRecipeByProductQuery, useUpsertRecipeMutation } = recipeApi;