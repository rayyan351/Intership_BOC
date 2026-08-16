// src/app/api/orders/route.js
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const { customer, branch, items, totalPrice, paymentMethod } = body;

    if (!customer?.fullName || !customer?.phone || !customer?.address) {
      return NextResponse.json(
        { success: false, message: "Missing required customer details." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Cannot place an empty order." },
        { status: 400 }
      );
    }

    const order = await Order.create({
      customer,
      branch,
      items: items.map((item) => ({
        productId: !item.isDeal ? item._id || item.id : undefined,
        dealId: item.isDeal ? item._id || item.id : undefined,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isDeal: Boolean(item.isDeal),
        selectedChoices: item.selectedChoices || {},
        specialInstructions: item.specialInstructions || "",
      })),
      totalPrice,
      paymentMethod: paymentMethod || "cod",
    });

    return NextResponse.json(
      { success: true, message: "Order placed successfully!", data: order },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}