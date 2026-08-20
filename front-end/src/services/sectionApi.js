// front-end/src/services/sectionApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';
import { endpoints } from './api';

export const sectionApi = createApi({
  reducerPath: 'sectionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl,
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
  tagTypes: ['Sections'],
  endpoints: (builder) => ({
    getSections: builder.query({
      query: () => endpoints.sections.base,
      providesTags: ['Sections'],
    }),
    createSection: builder.mutation({
      query: (formData) => ({
        url: endpoints.sections.base,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Sections'],
    }),
    updateSection: builder.mutation({
      query: ({ id, formData, ...rest }) => ({
        url: `${endpoints.sections.base}/${id}`,
        method: 'PUT',
        body: formData || rest,
      }),
      invalidatesTags: ['Sections'],
    }),
    deleteSection: builder.mutation({
      query: (id) => ({
        url: `${endpoints.sections.base}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sections'],
    }),
  }),
});

export const {
  useGetSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
} = sectionApi;