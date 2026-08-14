// back-end/seed-deal-categories.js
const dotenv = require('dotenv');
const DealCategory = require('./models/DealCategory');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const dealCategoriesList = [
  { id: 'super-savor-deal', label: 'Super Savor Deal', isShown: true },
  { id: 'value-meal-box', label: 'Value Meal Box', isShown: true },
  { id: 'share-box', label: 'Share Box', isShown: true },
  { id: 'party-in-a-box', label: 'Party In A Box', isShown: true },
  { id: 'combo-meal', label: 'Combo Meal', isShown: true },
  { id: 'family-combo', label: 'Family Combo', isShown: true },
  { id: 'mid-night-deal', label: 'Mid Night Deal', isShown: true },
];

const seedDealCategories = async () => {
  try {
    for (const item of dealCategoriesList) {
      await DealCategory.findOneAndUpdate(
        { id: item.id },
        item,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    console.log('✅ Deal Categories seeded/updated successfully without touching other collections!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deal categories:', error.message);
    process.exit(1);
  }
};

seedDealCategories();