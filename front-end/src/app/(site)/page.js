// src/app/(site)/page.jsx
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Product";
import "@/models/Deal";
import "@/models/Category";
import "@/models/Section";
import "@/models/Banner";

import Product from "@/models/Product";
import Deal from "@/models/Deal";
import Category from "@/models/Category";
import Section from "@/models/Section";
import Banner from "@/models/Banner";

import { HeroCarousel } from "@/app/(site)/_components/home/HeroCarousel";
import { CategoryRail } from "@/app/(site)/_components/home/CategoryRail";
import { MenuExplorer } from "@/app/(site)/_components/home/MenuExplorer";
import { SeoContent } from "@/app/(site)/_components/home/SeoContent";
import { FloatingActions } from "@/app/(site)/_components/home/FloatingActions";

export const revalidate = 3600; // 1-hour static cache

async function getHomeData() {
  try {
    await dbConnect();

    const [dbCategories, products, deals, sections, banners] = await Promise.all([
      Category.find({ isShown: { $ne: false } }).sort({ displayOrder: 1 }).lean().catch(() => []),
      Product.find({ isShown: { $ne: false }, isDealOnly: { $ne: true } }).lean().catch(() => []),
      Deal.find({ isShown: { $ne: false } })
        .populate({ path: "fixedItems.product", select: "name price image" })
        .populate({ path: "choiceGroups.options.product", select: "name price image" })
        .lean()
        .catch(() => []),
      Section.find({ isShown: { $ne: false } })
        .sort({ displayOrder: 1, createdAt: 1 })
        .populate({
          path: "products",
          match: { isShown: { $ne: false }, isDealOnly: { $ne: true } },
        })
        .populate({
          path: "deals",
          match: { isShown: { $ne: false } },
          populate: [
            { path: "fixedItems.product", select: "name price image" },
            { path: "choiceGroups.options.product", select: "name price image" },
          ],
        })
        .lean()
        .catch(() => []),
      Banner.find({ isActive: true })
        .sort({ displayOrder: 1, createdAt: -1 })
        .lean()
        .catch(() => []),
    ]);

    const resolveImg = (d) =>
      d?.image || d?.banner || d?.imageUrl || d?.dealImage || "";

    const formattedDeals = deals.map((d) => ({
      ...d,
      _id: d._id?.toString(),
      id: d.id || d._id?.toString(),
      isDeal: true,
      title: d.title || d.name || "Special Deal",
      name: d.title || d.name || "Special Deal",
      price: d.dealPrice || d.price,
      dealPrice: d.dealPrice || d.price,
      image: resolveImg(d),
      categories: d.dealType ? [d.dealType, "deals"] : ["deals"],
    }));

    const formattedSections = sections.map((sec) => ({
      _id: sec._id?.toString(),
      id: sec.slug || sec._id?.toString(),
      title: sec.title,
      subtitle: sec.subtitle || "",
      banner: sec.banner || "", // <-- Added banner field
      items: [
        ...(sec.products || []).map((p) => ({
          ...p,
          _id: p._id?.toString(),
          id: p.id || p._id?.toString(),
          isDeal: false,
        })),
        ...(sec.deals || []).map((d) => ({
          ...d,
          _id: d._id?.toString(),
          id: d.id || d._id?.toString(),
          isDeal: true,
          title: d.title || d.name || "Special Deal",
          name: d.title || d.name || "Special Deal",
          price: d.dealPrice || d.price,
          dealPrice: d.dealPrice || d.price,
          image: resolveImg(d),
        })),
      ],
    }));

    return JSON.parse(
      JSON.stringify({
        categories: dbCategories,
        products,
        deals: formattedDeals,
        sections: formattedSections,
        banners,
      })
    );
  } catch (err) {
    console.error("Error loading home data:", err);
    return { categories: [], products: [], deals: [], sections: [], banners: [] };
  }
}

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <HeroCarousel banners={data.banners} />
      <CategoryRail
        categories={data.categories}
        sections={data.sections}
        products={data.products}
        deals={data.deals}
      />
      <MenuExplorer
        categories={data.categories}
        sections={data.sections}
        products={data.products}
        deals={data.deals}
      />
      <SeoContent />
      <FloatingActions />
    </>
  );
}