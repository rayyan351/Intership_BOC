import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';
import { endpoints } from './api';

export const sectionApi = createApi({
  reducerPath: 'sectionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl,
  }),
  tagTypes: ['Sections'],
  endpoints: (builder) => ({
    getSections: builder.query({
      query: () => endpoints.sections.base,
      providesTags: ['Sections'],
    }),
    createSection: builder.mutation({
      query: (body) => ({
        url: endpoints.sections.base,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Sections'],
    }),
    updateSection: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${endpoints.sections.base}/${id}`,
        method: 'PUT',
        body,
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