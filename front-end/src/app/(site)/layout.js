
import { SiteHeader } from "./_components/layout/SiteHeader";
import { SiteFooter } from "./_components/layout/SiteFooter";
import { CartDrawer } from "./_components/cart/CartDrawer";
import { CartToast } from "./_components/cart/CartToast";
import { LocationDialog } from "@/components/location/LocationDialog";

export default function SiteLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />

      {/* Customer-only interactive elements */}
      <CartDrawer />
      <CartToast />
      <LocationDialog />
    </>
  );
}