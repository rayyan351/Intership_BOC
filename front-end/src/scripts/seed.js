// src/scripts/seed.js
import mongoose from "mongoose";

// Connection string
const MONGODB_URI = "mongodb://Rayyan0:Rayyan123@buyclonedb-shard-00-02.kft0q.mongodb.net:27017,buyclonedb-shard-00-00.kft0q.mongodb.net:27017,buyclonedb-shard-00-01.kft0q.mongodb.net:27017/burger_oclock?ssl=true&authSource=admin&retryWrites=true&w=majority";

// Schemas
const Category = mongoose.models.Category || mongoose.model("Category", new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  isShown: { type: Boolean, default: true },
}, { timestamps: true }));

const Product = mongoose.models.Product || mongoose.model("Product", new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  categories: [{ type: String }],
  price: { type: Number, required: true },
  compareAtPrice: { type: Number, default: null },
  discountLabel: { type: String, default: null },
  image: { type: String, default: "" },
  isShown: { type: Boolean, default: true },
  popular: { type: Boolean, default: false },
  isDealOnly: { type: Boolean, default: false },
}, { timestamps: true }));

const Deal = mongoose.models.Deal || mongoose.model("Deal", new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  dealType: { type: String, required: true },
  originalPrice: { type: Number, required: true },
  dealPrice: { type: Number, required: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  isShown: { type: Boolean, default: true },
  fixedItems: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 }
  }],
  choiceGroups: [{
    title: { type: String, required: true },
    selectCount: { type: Number, default: 1 },
    required: { type: Boolean, default: true },
    options: [{
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
      name: { type: String, required: true },
      image: { type: String, default: null },
      extraPrice: { type: Number, default: 0 }
    }]
  }]
}, { timestamps: true }));

const Section = mongoose.models.Section || mongoose.model("Section", new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  subtitle: { type: String, default: "" },
  displayOrder: { type: Number, default: 0 },
  isShown: { type: Boolean, default: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  deals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Deal" }],
}, { timestamps: true }));

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    // Clear existing empty or test documents
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      Deal.deleteMany({}),
      Section.deleteMany({})
    ]);
    console.log("Cleared old data.");

    // 1. Insert Categories
    const categories = await Category.insertMany([
      { id: "popular-items", label: "Popular Items", isShown: true },
      { id: "super-savor-deals", label: "Super Savor Deals", isShown: true },
      { id: "the-classics", label: "The Classics", isShown: true },
      { id: "grab-the-wraps", label: "Grab The Wraps", isShown: true },
      { id: "value-meal-box", label: "Value Meal Box Delivery Exclusive", isShown: true },
      { id: "share-the-goodness", label: "Share The Goodness", isShown: true },
    ]);
    console.log(`Inserted ${categories.length} categories.`);

    // 2. Insert Products
    const products = await Product.insertMany([
      {
        id: "crunchos-burger",
        name: "Crunchos Burger",
        description: "Crispy fried chicken fillet topped with spicy mayo, cheese, and crunchy nachos.",
        categories: ["the-classics", "popular-items"],
        price: 690,
        compareAtPrice: 790,
        discountLabel: "13% OFF",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        popular: true,
        isShown: true,
        isDealOnly: false,
      },
      {
        id: "classic-beef-smash",
        name: "Classic Beef Smash",
        description: "100% smashed prime beef patty with melted cheddar, pickles, and signature house sauce.",
        categories: ["the-classics", "popular-items"],
        price: 850,
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
        popular: true,
        isShown: true,
        isDealOnly: false,
      },
      {
        id: "smokey-tang-wrap",
        name: "Smokey Tang Wrap",
        description: "Crispy chicken strips wrapped in a grilled tortilla with smoky BBQ sauce and crisp lettuce.",
        categories: ["grab-the-wraps"],
        price: 520,
        image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=600&q=80",
        popular: false,
        isShown: true,
        isDealOnly: false,
      },
      {
        id: "gourmet-fries",
        name: "Gourmet Mayo Garlic Fries",
        description: "Golden thick-cut potato fries loaded with creamy signature garlic mayo.",
        categories: ["popular-items"],
        price: 340,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80",
        popular: true,
        isShown: true,
        isDealOnly: false,
      },
      {
        id: "coke-can",
        name: "Coca-Cola 330ml Can",
        description: "Chilled refreshing soft drink.",
        categories: [],
        price: 140,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
        popular: false,
        isShown: true,
        isDealOnly: true, // Deal only side item
      }
    ]);
    console.log(`Inserted ${products.length} products.`);

    const crunchos = products.find(p => p.id === "crunchos-burger");
    const fries = products.find(p => p.id === "gourmet-fries");

    // 3. Insert Deals
    const deals = await Deal.insertMany([
      {
        id: "super-savor-duo",
        title: "Super Savor Duo Deal",
        dealType: "super-savor-deals",
        originalPrice: 1450,
        dealPrice: 1199,
        description: "1 Crunchos Burger, 1 Gourmet Mayo Garlic Fries, and 1 Chilled Drink.",
        image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
        isShown: true,
        fixedItems: [
          { product: crunchos._id, quantity: 1 },
          { product: fries._id, quantity: 1 }
        ],
        choiceGroups: [
          {
            title: "Choose Your Drink",
            selectCount: 1,
            required: true,
            options: [
              { name: "Coca Cola 330ml", extraPrice: 0 },
              { name: "Sprite 330ml", extraPrice: 0 },
              { name: "Fanta 330ml", extraPrice: 0 },
            ]
          }
        ]
      },
      {
        id: "family-feast-box",
        title: "Value Feast Box",
        dealType: "value-meal-box",
        originalPrice: 2800,
        dealPrice: 2250,
        description: "2 Classic Beef Smashes, 2 Crunchos, 1 Large Fries, and 1.5L Drink.",
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
        isShown: true,
        fixedItems: [
          { product: crunchos._id, quantity: 2 }
        ],
        choiceGroups: [
          {
            title: "Select Free Dip",
            selectCount: 1,
            required: true,
            options: [
              { name: "Garlic Mayo Dip", extraPrice: 0 },
              { name: "Chipotle Fire Dip", extraPrice: 50 },
            ]
          }
        ]
      }
    ]);
    console.log(`Inserted ${deals.length} deals.`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();