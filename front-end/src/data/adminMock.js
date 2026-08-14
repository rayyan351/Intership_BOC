import { branches } from "@/data/branches";
import { menuCategories } from "@/data/menuCategories";
import { menuProducts } from "@/data/menuProducts";

export const dashboardStats = [
  { label: "Verified products", value: menuProducts.length, change: "Seed catalog" },
  { label: "Menu categories", value: menuCategories.length, change: "All source categories" },
  { label: "Active branches", value: branches.filter((branch) => branch.active).length, change: "Karachi + Lahore" },
  { label: "Pending orders", value: 18, change: "Mock admin data" },
];

export const mockOrders = [
  { id: "BOC-10542", customer: "Ahmed Khan", branch: "DHA Sehar", total: 2498, status: "Preparing", createdAt: "10:42 PM" },
  { id: "BOC-10541", customer: "Sara Ali", branch: "Gulshan-e-Iqbal", total: 1699, status: "Confirmed", createdAt: "10:37 PM" },
  { id: "BOC-10540", customer: "M. Usman", branch: "Johar Town", total: 3399, status: "Out for delivery", createdAt: "10:29 PM" },
  { id: "BOC-10539", customer: "Areeba Raza", branch: "North Nazimabad", total: 1099, status: "Delivered", createdAt: "10:18 PM" },
];

export const mockBanners = [
  { id: "share-box", title: "Share the Goodness", placement: "Homepage hero", status: "Active", priority: 1 },
  { id: "breast-fillet", title: "Breast Fillet Burgers", placement: "Homepage hero", status: "Active", priority: 2 },
  { id: "awards", title: "Three More Awards", placement: "Homepage hero", status: "Draft", priority: 3 },
];
