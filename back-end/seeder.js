// back-end/seed-components.js

const dotenv = require('dotenv');
const Product = require('./models/Product');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const componentProducts = [
  {
    id: 'single-beef-slider',
    name: 'Single Beef Slider (Component)',
    categories: ['Burgers'],
    price: 0,
    description: 'Juicy mini beef slider patty with cheese.',
    image: '/images/products/SlidersPartyInABox/BeefSliders.webp',
    isShown: false, // Hidden from standalone user menu
  },
  {
    id: 'single-chicken-slider',
    name: 'Single Chicken Slider (Component)',
    categories: ['Burgers'],
    price: 0,
    description: 'Crispy mini chicken slider patty with mayo.',
    image: '/images/products/SlidersPartyInABox/ChickenSliders.webp',
    isShown: false, // Hidden from standalone user menu
  },
];

const seedComponentsOnly = async () => {
  try {
    for (const item of componentProducts) {
      // Upsert: Updates if exists, creates if missing
      await Product.findOneAndUpdate(
        { id: item.id },
        item,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('✅ Component sliders added/updated successfully without touching sections!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding component products:', error.message);
    process.exit(1);
  }
};

seedComponentsOnly();