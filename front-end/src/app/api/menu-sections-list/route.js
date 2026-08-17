// src/app/api/menu-sections-list/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import "@/models/Category";
import "@/models/Section";
import Category from "@/models/Category";
import Section from "@/models/Section";

export async function GET() {
  try {
    await dbConnect();

    const [sections, categories] = await Promise.all([
      Section.find({ isShown: { $ne: false } })
        .sort({ displayOrder: 1 })
        .select("title slug _id")
        .lean(),
      Category.find({ isShown: { $ne: false } })
        .sort({ displayOrder: 1 })
        .select("label name slug _id")
        .lean(),
    ]);

    const options = [
      ...sections.map((sec) => ({
        label: `📌 Display Section: ${sec.title}`,
        value: `#${sec.slug || sec._id}`,
      })),
      ...categories.map((cat) => ({
        label: `🍔 Category: ${cat.label || cat.name}`,
        value: `#${cat.slug || cat.id || cat._id}`,
      })),
    ];

    return NextResponse.json({ success: true, data: options });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}