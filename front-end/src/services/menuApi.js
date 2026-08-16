// src/services/menuApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const menuApi = createApi({
  reducerPath: 'menuApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api', // Relative path targets Next.js route handlers on port 3000
  }),
  tagTypes: ['MenuFeed'],
  endpoints: (builder) => ({
    getMenuFeed: builder.query({
      query: () => '/menu-feed',
      providesTags: ['MenuFeed'],
    }),
  }),
});

export const { useGetMenuFeedQuery } = menuApi;