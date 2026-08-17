// src/app/api/menu-feed/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Product";
import "@/models/Deal";
import "@/models/Category";
import "@/models/Section";
import Product from "@/models/Product";
import Deal from "@/models/Deal";
import Category from "@/models/Category";
import Section from "@/models/Section";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    const [dbCategories, products, deals, sections] = await Promise.all([
      Category.find({ isShown: { $ne: false } }).lean().catch(() => []),
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
            { path: "choiceGroups.options.product", select: "name price image" }
          ],
        })
        .lean()
        .catch(() => []),
    ]);

    const resolveImg = (d) =>
      d?.image ||
      d?.banner ||
      d?.imageUrl ||
      d?.dealImage ||
      (Array.isArray(d?.images) ? d.images[0] : "") ||
      "";

    // Format top-level deals
    const formattedDeals = deals.map((d) => {
      const dealCatList = [];
      if (d.dealType) dealCatList.push(d.dealType);
      dealCatList.push("deals");

      return {
        ...d,
        _id: d._id?.toString(),
        id: d.id || d._id?.toString(),
        isDeal: true,
        title: d.title || d.name || "Special Deal",
        name: d.title || d.name || "Special Deal",
        price: d.dealPrice || d.price,
        dealPrice: d.dealPrice || d.price,
        image: resolveImg(d),
        categories: dealCatList,
      };
    });

    // Format dynamic sections
    const formattedSections = sections.map((sec) => {
      const sectionProducts = (sec.products || []).map((p) => ({
        ...p,
        _id: p._id?.toString(),
        id: p.id || p._id?.toString(),
        isDeal: false,
      }));

      const sectionDeals = (sec.deals || []).map((d) => ({
        ...d,
        _id: d._id?.toString(),
        id: d.id || d._id?.toString(),
        isDeal: true,
        title: d.title || d.name || "Special Deal",
        name: d.title || d.name || "Special Deal",
        price: d.dealPrice || d.price,
        dealPrice: d.dealPrice || d.price,
        image: resolveImg(d),
      }));

      return {
        _id: sec._id?.toString(),
        id: sec.slug || sec._id?.toString(),
        title: sec.title,
        subtitle: sec.subtitle || "",
        items: [...sectionProducts, ...sectionDeals],
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          categories: dbCategories,
          products,
          deals: formattedDeals,
          sections: formattedSections,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching menu feed:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}