import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { endpoints } from './api';
import { siteConfig } from '@/config/site';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl,
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: endpoints?.auth?.login,
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useLoginMutation } = authApi;