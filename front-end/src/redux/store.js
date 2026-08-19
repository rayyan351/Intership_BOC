import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cart/cartSlice';
import { authApi } from '@/services/authApi'; // Adjust import path if needed
import { productApi } from '@/services/productApi';
import { categoryApi } from '@/services/categoryApi';
import { dealApi } from '@/services/dealApi';
import { sectionApi } from '@/services/sectionApi';
import { dealCategoryApi } from '@/services/dealCategoryApi';
import { menuApi } from '@/services/menuApi';
import { orderApi } from '@/services/orderApi';
import { bannerApi } from '@/services/bannerApi';
import { settingApi } from '@/services/settingApi';
import { branchApi } from '@/services/branchApi';
import { staffApi } from '@/services/staffApi';
import { roleApi } from '@/services/roleApi';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    // 1. Add the RTK Query API reducer dynamically using its reducerPath
    [authApi.reducerPath]: authApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [dealApi.reducerPath]: dealApi.reducer,
    [sectionApi.reducerPath]: sectionApi.reducer,
    [dealCategoryApi.reducerPath]:dealCategoryApi.reducer,
    [menuApi.reducerPath]:menuApi.reducer,
    [orderApi.reducerPath]:orderApi.reducer,
    [bannerApi.reducerPath]:bannerApi.reducer,
    [settingApi.reducerPath]:settingApi.reducer,
    [branchApi.reducerPath]:branchApi.reducer,
    [staffApi.reducerPath]:staffApi.reducer,
    [roleApi.reducerPath]:roleApi.reducer,
  },
  // 2. Add the RTK Query middleware for caching, invalidation, and polling support
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
     .concat(authApi.middleware)
     .concat(productApi.middleware)
     .concat(categoryApi.middleware)
     .concat(dealApi.middleware)
     .concat(sectionApi.middleware)
     .concat(dealCategoryApi.middleware)
     .concat(menuApi.middleware)
     .concat(orderApi.middleware)
     .concat(bannerApi.middleware)
     .concat(settingApi.middleware)
     .concat(branchApi.middleware)
     .concat(staffApi.middleware)
     .concat(roleApi.middleware),
});