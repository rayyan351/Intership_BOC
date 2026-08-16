// src/app/(site)/_components/layout/SiteFooter.js
import Image from "next/image";
import Link from "next/link";
import { DISPLAY_PHONE, FEEDBACK_EMAIL, ORDER_PHONE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-black text-white" id="locations">
      {/* Main Grid Container */}
      <div className="w-[min(1120px,calc(100%-40px))] min-h-[390px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_0.75fr_0.9fr_1fr] items-center gap-[34px] lg:gap-16 py-12 lg:py-[62px]">
        
        {/* Brand Column */}
        <div className="flex flex-col items-start gap-3">
          <Image
            alt="Burger O'Clock"
            height={90}
            src="/images/brand/BurgerO'clock logo.webp"
            width={230}
            className="w-[200px] sm:w-[250px] h-auto object-contain"
          />
          <p className="max-w-[360px] text-[#b9b9b9] text-sm sm:text-base leading-[1.6] m-0">
            Premium burgers, bold flavours and direct online ordering across Karachi and Lahore.
          </p>
        </div>

        {/* Information Links */}
        <div className="grid content-center gap-[13px]">
          <h2 className="m-0 mb-2 text-[1.05rem] font-bold text-white tracking-tight">
            Information
          </h2>
          <a href="#menu" className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors">
            Menu
          </a>
          <a href="#super-savor-deals" className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors">
            Deals
          </a>
          <Link href="/admin" className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors">
            Admin UI
          </Link>
          <a href="#seo-heading" className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors">
            About
          </a>
        </div>

        {/* Contact Us */}
        <div className="grid content-center gap-[13px]">
          <h2 className="m-0 mb-2 text-[1.05rem] font-bold text-white tracking-tight">
            Contact us
          </h2>
          <a
            href={`tel:${ORDER_PHONE}`}
            className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors"
          >
            {DISPLAY_PHONE}
          </a>
          <a
            href={`mailto:${FEEDBACK_EMAIL}`}
            className="text-[#ececec] text-sm hover:text-[#F4C61A] transition-colors"
          >
            {FEEDBACK_EMAIL}
          </a>
          <span className="text-[#ececec] text-sm">
            Karachi · Lahore
          </span>
        </div>

        {/* Promo App Visual */}
        <div className="hidden min-[621px]:block relative min-h-[250px] lg:min-h-[330px] w-full">
          <Image
            alt="Burger O'Clock ordering app placeholder"
            fill
            sizes="(max-width: 900px) 200px, 260px"
            src="/images/footer/promo.webp"
            className="object-contain -rotate-7"
          />
        </div>
      </div>

      {/* Bottom Yellow Strip */}
      <div className="min-h-[58px] flex flex-col min-[621px]:flex-row items-center justify-center gap-[7px] min-[621px]:gap-[50px] px-5 py-2.5 bg-[#F4C61A] text-black text-[0.78rem] font-bold text-center">
        <span>© 2026 Burger O'Clock. Frontend internship redevelopment.</span>
        <div className="flex items-center gap-[18px]">
          <a href="#" className="hover:underline">
            FAQs
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}