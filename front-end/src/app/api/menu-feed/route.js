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

// Cache this API route response on the server for 1 hour (3600 seconds)
export const revalidate = 3600;

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
            { path: "choiceGroups.options.product", select: "name price image" },
          ],
        })
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
      {
        status: 200,
        headers: {
          // Tell browser and CDN edges to cache for 1 hour, stale-while-revalidate for 1 day
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}