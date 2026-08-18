// src/app/(site)/layout.js
import { Plus_Jakarta_Sans } from "next/font/google";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Setting";
import Setting from "@/models/Setting";

import { SiteHeader } from "./_components/layout/SiteHeader";
import { SiteFooter } from "./_components/layout/SiteFooter";
import { CartDrawer } from "./_components/cart/CartDrawer";
import { CartToast } from "./_components/cart/CartToast";
import { LocationDialog } from "@/app/(site)/_components/location/LocationDialog";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const revalidate = 3600;

async function getSiteSettings() {
  try {
    await dbConnect();
    const settings = await Setting.findOne().lean();
    if (!settings) return null;
    return JSON.parse(JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to load settings in storefront layout:", error);
    return null;
  }
}

export default async function SiteLayout({ children }) {
  const settings = await getSiteSettings();

  return (
    <div
      className={`${jakarta.variable} ${jakarta.className} min-h-screen flex flex-col bg-[#FBFBFB] text-neutral-900 selection:bg-[#F4C61A] selection:text-black`}
    >
      <SiteHeader
        storeLogo={settings?.storeLogo}
        storeName={settings?.storeName || "Burger O'Clock"}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        storeLogo={settings?.storeLogo}
        storeName={settings?.storeName || "Burger O'Clock"}
      />

      <CartDrawer />
      <CartToast />
      <LocationDialog />
    </div>
  );
}