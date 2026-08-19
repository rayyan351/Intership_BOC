// src/services/roleApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { siteConfig } from '@/config/site';

export const roleApi = createApi({
  reducerPath: 'roleApi',
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl || 'http://localhost:5000/api',
    prepareHeaders: (headers) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      return headers;
    },
  }),
  tagTypes: ['Roles'],
  endpoints: (builder) => ({
    getRolesAndModules: builder.query({
      query: () => '/roles',
      providesTags: ['Roles'],
    }),
    createRole: builder.mutation({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),
    toggleRolePermission: builder.mutation({
      query: ({ roleId, permissionKey, enable }) => ({
        url: `/roles/${roleId}/toggle`,
        method: 'PATCH',
        body: { permissionKey, enable },
      }),
      invalidatesTags: ['Roles'],
    }),
    batchUpdatePermissions: builder.mutation({
      query: ({ roleId, permissionsToAdd, permissionsToRemove }) => ({
        url: `/roles/${roleId}/batch-permissions`,
        method: 'PUT',
        body: { permissionsToAdd, permissionsToRemove },
      }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
  }),
});

export const {
  useGetRolesAndModulesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useToggleRolePermissionMutation,
  useBatchUpdatePermissionsMutation,
  useDeleteRoleMutation,
} = roleApi;