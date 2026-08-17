import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const bannerApi = createApi({
  reducerPath: 'bannerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Banners'],
  endpoints: (builder) => ({
    getBanners: builder.query({
      query: () => '/banners',
      transformResponse: (res) => res?.data || [],
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation({
      query: (formData) => ({
        url: '/banners',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/banners?id=${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['Banners'],
    }),
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/banners?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
    toggleBannerStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/banners?id=${id}`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
});

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useToggleBannerStatusMutation,
} = bannerApi;