// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/dbConnect";
import Category from "@/models/Category";

export async function POST(request) {
  try {
    await dbConnect();
    const formData = await request.formData();

    const name = formData.get("name");
    const label = formData.get("label");
    const displayOrder = Number(formData.get("displayOrder")) || 0;
    const bannerFile = formData.get("banner");

    let bannerUrl = "";

    if (bannerFile && typeof bannerFile === "object" && bannerFile.name) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileName = `category_banner_${Date.now()}_${bannerFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      bannerUrl = `/uploads/${fileName}`;
    }

    const newCategory = await Category.create({
      name,
      label,
      displayOrder,
      banner: bannerUrl,
      slug: label.toLowerCase().replace(/[\s_-]+/g, ""),
    });

    // Invalidate ISR cache for instant storefront updates
    revalidatePath("/");

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
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
    const name = formData.get("name");
    const label = formData.get("label");
    const displayOrder = Number(formData.get("displayOrder")) || 0;
    const bannerFile = formData.get("banner");

    const updatePayload = {
      name,
      label,
      displayOrder,
      slug: label.toLowerCase().replace(/[\s_-]+/g, ""),
    };

    if (bannerFile && typeof bannerFile === "object" && bannerFile.name) {
      const bytes = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const fileName = `category_banner_${Date.now()}_${bannerFile.name.replace(/\s+/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      updatePayload.banner = `/uploads/${fileName}`;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updatePayload, { new: true });

    // Invalidate ISR cache
    revalidatePath("/");

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}