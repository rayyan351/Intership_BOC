// src/app/api/banners/route.js
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { dbConnect } from "@/lib/dbConnect";
import Banner from "@/models/Banner";

// Helper to save uploaded banner images locally to /public/uploads
async function saveUploadedFile(file) {
  if (!file || typeof file === "string" || !(file instanceof Blob)) {
    return typeof file === "string" ? file : "";
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `banner-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

export async function GET() {
  try {
    await dbConnect();
    const banners = await Banner.find({})
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    // Parse incoming multipart/form-data
    const formData = await req.formData();

    const title = formData.get("title") || "";
    const eyebrow = formData.get("eyebrow") || "";
    const description = formData.get("description") || "";
    const link = formData.get("link") || "";
    const ctaText = formData.get("ctaText") || "";
    const imageFile = formData.get("image");

    let desktopImage = "";
    if (imageFile && imageFile instanceof Blob && imageFile.size > 0) {
      desktopImage = await saveUploadedFile(imageFile);
    }

    const banner = await Banner.create({
      title,
      eyebrow,
      description,
      link,
      ctaText,
      desktopImage,
      isActive: true,
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error) {
    console.error("Banner creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const formData = await req.formData();

    const title = formData.get("title");
    const eyebrow = formData.get("eyebrow");
    const description = formData.get("description");
    const link = formData.get("link");
    const ctaText = formData.get("ctaText");
    const imageFile = formData.get("image");

    const updatePayload = {};
    if (title !== null) updatePayload.title = title;
    if (eyebrow !== null) updatePayload.eyebrow = eyebrow;
    if (description !== null) updatePayload.description = description;
    if (link !== null) updatePayload.link = link;
    if (ctaText !== null) updatePayload.ctaText = ctaText;

    if (imageFile && imageFile instanceof Blob && imageFile.size > 0) {
      updatePayload.desktopImage = await saveUploadedFile(imageFile);
    }

    const banner = await Banner.findByIdAndUpdate(id, updatePayload, {
      new: true,
    });

    revalidatePath("/");

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Banner update error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const body = await req.json();

    const banner = await Banner.findByIdAndUpdate(
      id,
      { isActive: body.isActive },
      { new: true }
    );

    revalidatePath("/");

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    await Banner.findByIdAndDelete(id);
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Banner deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}