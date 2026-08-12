"use client";

import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";

export function AppProviders({ children }) {
  return (
    <LocationProvider>
      <CartProvider>{children}</CartProvider>
    </LocationProvider>
  );
}
