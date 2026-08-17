// src/app/api/sections/route.js
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/dbConnect";
import Section from "@/models/Section";

export async function GET() {
  try {
    await dbConnect();
    const sections = await Section.find({ isShown: { $ne: false } })
      .sort({ displayOrder: 1, createdAt: 1 })
      .populate("products")
      .populate("deals")
      .lean();

    return NextResponse.json({ success: true, data: sections });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const title = formData.get("title");
    const subtitle = formData.get("subtitle") || "";
    const displayOrder = Number(formData.get("displayOrder")) || 0;
    const products = JSON.parse(formData.get("products") || "[]");
    const deals = JSON.parse(formData.get("deals") || "[]");
    const bannerFile = formData.get("banner");

    let bannerUrl = "";

    if (bannerFile && typeof bannerFile === "object" && bannerFile.name) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileName = `section_banner_${Date.now()}_${bannerFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      bannerUrl = `/uploads/${fileName}`;
    }

    const newSection = await Section.create({
      title,
      subtitle,
      displayOrder,
      banner: bannerUrl,
      products,
      deals,
      slug: title.toLowerCase().replace(/[\s_-]+/g, ""),
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, data: newSection }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const formData = await request.formData();
    const title = formData.get("title");
    const subtitle = formData.get("subtitle") || "";
    const displayOrder = Number(formData.get("displayOrder")) || 0;
    const products = JSON.parse(formData.get("products") || "[]");
    const deals = JSON.parse(formData.get("deals") || "[]");
    const bannerFile = formData.get("banner");
    const removeBanner = formData.get("removeBanner") === "true";

    const updatePayload = {
      title,
      subtitle,
      displayOrder,
      products,
      deals,
      slug: title.toLowerCase().replace(/[\s_-]+/g, ""),
    };

    if (removeBanner) {
      updatePayload.banner = "";
    } else if (bannerFile && typeof bannerFile === "object" && bannerFile.name) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileName = `section_banner_${Date.now()}_${bannerFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      updatePayload.banner = `/uploads/${fileName}`;
    }

    const updatedSection = await Section.findByIdAndUpdate(id, updatePayload, { new: true });

    revalidatePath("/");

    return NextResponse.json({ success: true, data: updatedSection });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}