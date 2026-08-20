// front-end/src/services/branchApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const branchApi = createApi({
  reducerPath: 'branchApi',
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
  tagTypes: ['Branches'],
  endpoints: (builder) => ({
    getBranches: builder.query({
      query: (params) => ({
        url: '/branches',
        params: params || { all: 'true' },
      }),
      providesTags: ['Branches'],
    }),
    createBranch: builder.mutation({
      query: (body) => ({
        url: '/branches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Branches'],
    }),
    updateBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/branches/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Branches'],
    }),
    deleteBranch: builder.mutation({
      query: (id) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branches'],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi;