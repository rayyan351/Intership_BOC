// src/app/(site)/layout.js
import { Plus_Jakarta_Sans } from "next/font/google";
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

export default function SiteLayout({ children }) {
  return (
    <div className={`${jakarta.variable} ${jakarta.className} min-h-screen flex flex-col bg-[#FBFBFB] text-neutral-900 selection:bg-[#F4C61A] selection:text-black`}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />

      {/* Customer-only interactive elements */}
      <CartDrawer />
      <CartToast />
      <LocationDialog />
    </div>
  );
}