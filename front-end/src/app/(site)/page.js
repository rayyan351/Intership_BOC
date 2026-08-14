import { HeroCarousel } from "@/app/(site)/_components/home/HeroCarousel";
import { CategoryRail } from "@/app/(site)/_components/home/CategoryRail";
import { MenuExplorer } from "@/app/(site)/_components/home/MenuExplorer";
import { SeoContent } from "@/app/(site)/_components/home/SeoContent";
import { FloatingActions } from "@/app/(site)/_components/home/FloatingActions";

export default function HomePage() {
  return (
    <>
      <HeroCarousel />
      <CategoryRail />
      <MenuExplorer />
      <SeoContent />
      <FloatingActions />
    </>
  );
}