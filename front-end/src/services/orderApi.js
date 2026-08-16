// src/services/orderApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { siteConfig } from "@/config/site";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: siteConfig?.baseUrl || "/api",
  }),
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    placeOrder: builder.mutation({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const { usePlaceOrderMutation } = orderApi;