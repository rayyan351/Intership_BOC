// back-end/seeder.js

const dotenv = require('dotenv');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Section = require('./models/Section');
const Deal = require('./models/Deal');
const DealCategory = require('./models/DealCategory');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

// 1. Clean Base Categories (Base Food Taxonomies)
const baseCategories = [
  { id: 'burgers', label: 'Burgers', isShown: true },
  { id: 'fries-sides', label: 'Fries & Sides', isShown: true },
  { id: 'wraps', label: 'Wraps', isShown: true },
  { id: 'appetizers', label: 'Appetizers', isShown: true },
  { id: 'drinks', label: 'Drinks', isShown: true },
];

// 2. Separate Deal Categories / Types
const dealCategories = [
  { id: 'combo-deals', label: 'Combo Deals', isShown: true },
  { id: 'party-in-a-box', label: 'Party In A Box', isShown: true },
  { id: 'midnight-deals', label: 'Midnight Deals', isShown: true },
  { id: 'family-bundles', label: 'Family Bundles', isShown: true },
];

// 3. Component Products (isShown: false keeps them hidden from standalone menu)
const componentProducts = [
  {
    id: 'single-beef-slider',
    name: 'Single Beef Slider (Component)',
    categories: ['Burgers'],
    price: 450,
    description: 'Juicy mini beef slider patty with cheese.',
    image: '/images/products/SlidersPartyInABox/BeefSliders.webp',
    isShown: false,
  },
  {
    id: 'single-chicken-slider',
    name: 'Single Chicken Slider (Component)',
    categories: ['Burgers'],
    price: 400,
    description: 'Crispy mini chicken slider patty with mayo.',
    image: '/images/products/SlidersPartyInABox/ChickenSliders.webp',
    isShown: false,
  },
];

// 4. Clean Pure Individual Products
const pureProducts = [
  // --- BEEF & PREMIUM BURGERS ---
  {
    id: "beef-mushroom-madness",
    name: "Beef Mushroom Madness",
    description: "Juicy beef patty topped with rich mushroom sauce and melted cheese.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BeefBurgers/BeefMushroomMadness.webp",
    isShown: true,
  },
  {
    id: "beef-cheese",
    name: "Beef Cheese",
    description: "Classic smashed beef patty with melted cheddar slice and signature sauce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BeefBurgers/BeefCheese.webp",
    isShown: true,
  },
  {
    id: "beef-old-school",
    name: "Beef Old School",
    description: "Traditional beef burger with pickles, onions, mustard, and BO'C secret sauce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BeefBurgers/BeefOldSchool.webp",
    isShown: true,
  },
  {
    id: "beef-smoky-tang",
    name: "Beef Smoky Tang",
    description: "Smoky BBQ infused beef patty with crispy onion rings.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BeefBurgers/BeefSmokyTang.webp",
    isShown: true,
  },
  {
    id: "beef-belt-buster",
    name: "Belt Buster Four Patty",
    description: "4 oz. x 4 giant smash beef patties loaded with cheese and BO'C sauce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BeefBurgers/BeltBusterFourPatty.webp",
    isShown: true,
  },
  {
    id: "messy-meat-burger",
    name: "Messy Meat Burger",
    description: "A meat lover's dream packed with beef patty, pulled meat, and cheese melt.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/PremiumBurgers/MessyMeatBurger.webp",
    isShown: true,
  },
  {
    id: "beef-crunchos",
    name: "Beef Crunchos",
    description: "Crispy crunchy nachos layered over a juicy beef patty with jalapeño cheese.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/PremiumBurgers/BeefCrunchos.webp",
    isShown: true,
  },
  {
    id: "chicken-crunchos",
    name: "Grilled Chicken Crunchos",
    description: "Flame-grilled chicken fillet with spicy crunchy nachos and salsa.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/PremiumBurgers/GrilledChickenCrunchos.webp",
    isShown: true,
  },

  // --- BREAST FILLET & CRISPY CHICKEN BURGERS ---
  {
    id: "blazin-bird",
    name: "Blazin Bird",
    description: "Spicy crispy breast fillet with fiery sauce and crunchy lettuce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BreastFilletBurger/BlazinBird.webp",
    isShown: true,
  },
  {
    id: "jalapeno-blast",
    name: "Jalapeno Blast",
    description: "Crispy chicken breast fillet with pickled jalapeños and spicy mayo.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BreastFilletBurger/JalapenoBlast.webp",
    isShown: true,
  },
  {
    id: "Smoky-Bliss",
    name: "Smoky Bliss",
    description: "Crispy fillet topped with smoky barbecue glaze and cheese.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BreastFilletBurger/SmokyBliss.webp",
    isShown: true,
  },
  {
    id: "OG-burger",
    name: "The OG Burger",
    description: "The original BO'C crispy chicken fillet burger.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/BreastFilletBurger/TheOGBurger.webp",
    isShown: true,
  },
  {
    id: "chickn-crisp",
    name: "Chick n Crisp",
    description: "Classic golden fried chicken burger.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/ChicknCrisp.webp",
    isShown: true,
  },
  {
    id: "chickncrisp-jalapeno-spark",
    name: "Chick n Crisp Jalapeno Spark",
    description: "Golden crispy chicken with spicy jalapeño kick.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/ChicknCrispJalapenoSpark.webp",
    isShown: true,
  },
  {
    id: "chick-n-crisp-smoky-tang",
    name: "Chick n Crisp Smoky Tang",
    description: "Crispy chicken patty with tang BBQ dip and mayo.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/ChicknCrispSmokyTang.webp",
    isShown: true,
  },
  {
    id: "fiery-gigantic",
    name: "Fiery Gigantic",
    description: "Double sized giant crispy chicken patty with extra spice.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/FieryGigantic.webp",
    isShown: true,
  },
  {
    id: "fire-bird",
    name: "Fire Bird",
    description: "Extremely spicy crispy chicken breast fillet.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/FireBird.webp",
    isShown: true,
  },
  {
    id: "gigantic-burger",
    name: "Gigantic Burger",
    description: "Over-sized chicken patty loaded with cheese slice.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/CrispyChickenBurgers/GiganticBurger.webp",
    isShown: true,
  },

  // --- GRILLED & VALUE BURGERS ---
  {
    id: "grilled-chicken-classic",
    name: "Grilled Chicken Classic",
    description: "Healthy seasoned flame-grilled chicken breast.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/GrilledChickenBurger/GrilledChickenClassic.webp",
    isShown: true,
  },
  {
    id: "Grilled Chicken Jalapeno Spark",
    name: "Grilled Chicken Jalapeno Spark",
    description: "Flame grilled fillet with jalapeño peppers.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/GrilledChickenBurger/GrilledChickenJalapenoSpark.webp",
    isShown: true,
  },
  {
    id: "Grilled Chicken Smoky Tang",
    name: "Grilled Chicken Smoky Tang",
    description: "Flame grilled fillet brushed with smoky barbecue sauce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/GrilledChickenBurger/GrilledChickenSmokyTang.webp",
    isShown: true,
  },
  {
    id: "Crispy Chicken Burger",
    name: "Crispy Chicken Burger",
    description: "Value crispy chicken patty burger.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/ValueBurgers/CrispyChickenBurger.webp",
    isShown: true,
  },
  {
    id: "Fiery Chicken Burger",
    name: "Fiery Chicken Burger",
    description: "Spicy value chicken patty burger.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/ValueBurgers/FieryChickenBurger.webp",
    isShown: true,
  },
  {
    id: "Jalapeno Crispy Burger",
    name: "Jalapeno Crispy Burger",
    description: "Crispy chicken value burger with jalapeño Mayo.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/ValueBurgers/JalapenoCrispyBurger.webp",
    isShown: true,
  },
  {
    id: "Smoky BBQ Burger",
    name: "Smoky BBQ Burger",
    description: "Value chicken burger loaded with BBQ sauce.",
    categories: ["Burgers"],
    price: 1099,
    image: "/images/products/ValueBurgers/SmokyBBQBurger.webp",
    isShown: true,
  },

  // --- CLASSIC SMASH BURGERS ---
  {
    id: "Oklahoma Beef",
    name: "Oklahoma Beef",
    description: "4 oz. x 2 juicy smash beef patties, 2 cheese slices, lots of onions, mayo sauce and Burger sauce.",
    categories: ["Burgers"],
    price: 1149,
    image: "/images/products/TheClassics/OklahamaBeef.webp",
    isShown: true,
  },
  {
    id: "The OG Beef",
    name: "The OG Beef",
    description: "4 oz. x 2 juicy smash beef patties, 2 cheese slices, pickles, onions, mayo sauce, mustard sauce, ketchup and BO'C secret sauce.",
    categories: ["Burgers"],
    price: 1149,
    image: "/images/products/TheClassics/TheOGBeef.webp",
    isShown: true,
  },

  // --- WRAPS ---
  {
    id: "Dynamite Wrap",
    name: "Dynamite Wrap",
    description: "Crispy chicken tenders wrapped in a soft tortilla with signature dynamite sauce and iceberg lettuce.",
    categories: ["Wraps"],
    price: 1149,
    image: "/images/products/GrabTheWraps/DynamiteWrap.webp",
    isShown: true,
  },
  {
    id: "Creamy Wrap",
    name: "Creamy Wrap",
    description: "Crispy chicken tenders wrapped in a warm tortilla with rich creamy garlic dip.",
    categories: ["Wraps"],
    price: 1149,
    image: "/images/products/GrabTheWraps/CreamyWrap.webp",
    isShown: true,
  },
  {
    id: "Fiery Wrap",
    name: "Fiery Wrap",
    description: "Crispy chicken tenders wrapped in spicy chili sauce and crunchies.",
    categories: ["Wraps"],
    price: 1149,
    image: "/images/products/GrabTheWraps/FieryWrap.webp",
    isShown: true,
  },
  {
    id: "Peri Peri Wrap",
    name: "Peri Peri Wrap",
    description: "Crispy chicken tenders coated in zesty peri-peri seasoning.",
    categories: ["Wraps"],
    price: 1149,
    image: "/images/products/GrabTheWraps/PeriPeriWrap.webp",
    isShown: true,
  },
  {
    id: "Smoky Wrap",
    name: "Smoky Wrap",
    description: "Crispy chicken tenders wrapped with smoky BBQ glazes.",
    categories: ["Wraps"],
    price: 1149,
    image: "/images/products/GrabTheWraps/SmokyWrap.webp",
    isShown: true,
  },

  // --- FRIES & SIDES ---
  {
    id: "Cheese Burger Fries",
    name: "Cheese Burger Fries",
    description: "Golden fries topped with chopped beef patty, liquid cheese, and sauce.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/LoadedFries/CheeseBurgerFries.webp",
    isShown: true,
  },
  {
    id: "Messy Fries",
    name: "Messy Fries",
    description: "Fries smothered in spicy cheese, minced chicken, and jalapeños.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/LoadedFries/MessyFries.webp",
    isShown: true,
  },
  {
    id: "Siracha Loaded Fries",
    name: "Siracha Loaded Fries",
    description: "Crispy fries drizzled with spicy sriracha sauce and melted cheese.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/LoadedFries/SirachaLoadedFries.webp",
    isShown: true,
  },
  {
    id: "Mayo Garlic Fries",
    name: "Mayo Garlic Fries",
    description: "Gourmet fries loaded with creamy garlic mayonnaise.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/GourmetFries/MayoGarlicFries.webp",
    isShown: true,
  },
  {
    id: "Wild Fries",
    name: "Wild Fries",
    description: "Gourmet fries tossed in secret wild seasoning blend.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/GourmetFries/WildFries.webp",
    isShown: true,
  },
  {
    id: "Zesty BBQ Fries",
    name: "Zesty BBQ Fries",
    description: "Fries drizzled with tangy barbecue sauce.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/GourmetFries/ZestyBBQFries.webp",
    isShown: true,
  },
  {
    id: "plain-fries",
    name: "Plain Fries",
    description: "Classic salted crispy potato fries.",
    categories: ["Fries & Sides"],
    price: 1099,
    image: "/images/products/GourmetFries/PlainFries.webp",
    isShown: true,
  },

  // --- APPETIZERS ---
  {
    id: "Buffalo Wings",
    name: "Buffalo Wings",
    description: "Crispy chicken wings tossed in tangy spicy buffalo sauce.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/BuffaloWings.webp",
    isShown: true,
  },
  {
    id: "Crispy Wings",
    name: "Crispy Wings",
    description: "Golden breaded fried chicken wings.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/CrispyWings.webp",
    isShown: true,
  },
  {
    id: "Honey Mustard Wings",
    name: "Honey Mustard Wings",
    description: "Fried wings glazed in sweet honey mustard sauce.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/HoneyMustardWings.webp",
    isShown: true,
  },
  {
    id: "Smoky BBQ Wings",
    name: "Smoky BBQ Wings",
    description: "Wings glazed with rich smoky barbecue sauce.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/SmokyBBQWings.webp",
    isShown: true,
  },
  {
    id: "Peri Peri Bites",
    name: "Peri Peri Bites",
    description: "Spicy cheese stuffed chicken bites.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/PeriBites.webp",
    isShown: true,
  },
  {
    id: "Tender Chicken",
    name: "Tender Chicken",
    description: "Boneless chicken tenders fried to golden perfection.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/TenderChicken.webp",
    isShown: true,
  },
  {
    id: "Nuggets",
    name: "Nuggets",
    description: "Classic crispy chicken nuggets.",
    categories: ["Appetizers"],
    price: 1099,
    image: "/images/products/Appetisers/Nuggets.webp",
    isShown: true,
  },

  // --- DRINKS ---
  {
    id: "Coke 350 ml",
    name: "Coke 350 ml",
    description: "Chilled Coca-Cola 350ml can.",
    categories: ["Drinks"],
    price: 250,
    image: "/images/products/Beverages/Coke350ML.webp",
    isShown: true,
  },
  {
    id: "Coke Zero 350 ml",
    name: "Coke Zero 350 ml",
    description: "Chilled Coca-Cola Zero Sugar 350ml can.",
    categories: ["Drinks"],
    price: 250,
    image: "/images/products/Beverages/CokeZero350ml.webp",
    isShown: true,
  },
  {
    id: "Fanta 500 ml",
    name: "Fanta 500 ml",
    description: "Fanta Orange 500ml bottle.",
    categories: ["Drinks"],
    price: 250,
    image: "/images/products/Beverages/Fanta500ml.webp",
    isShown: true,
  },
  {
    id: "Sprite 350 ml",
    name: "Sprite 350 ml",
    description: "Chilled Sprite 350ml can.",
    categories: ["Drinks"],
    price: 250,
    image: "/images/products/Beverages/Sprite350ml.webp",
    isShown: true,
  },
  {
    id: "Mineral Water (Dasani)",
    name: "Mineral Water (Dasani)",
    description: "500ml chilled mineral water.",
    categories: ["Drinks"],
    price: 120,
    image: "/images/products/Beverages/MineralWater(Dasani).webp",
    isShown: true,
  },
];

const importData = async () => {
  try {
    // 1. Clear database
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Section.deleteMany();
    await Deal.deleteMany();
    await DealCategory.deleteMany();

    // 2. Create Admin User
    const adminUser = {
      name: 'Admin User',
      email: 'admin@burgeroclock.com',
      password: 'password123',
      role: 'admin',
    };
    await User.create(adminUser);

    // 3. Seed Base Taxonomies & Deal Categories
    await Category.insertMany(baseCategories);
    await DealCategory.insertMany(dealCategories);

    // 4. Seed Pure Products + Hidden Component Products
    const createdProducts = await Product.insertMany([...pureProducts, ...componentProducts]);

    // Build ID lookup map for Display Sections
    const productMap = {};
    createdProducts.forEach((p) => {
      productMap[p.id] = p._id;
    });

    const getProductIds = (idList) => idList.map((id) => productMap[id]).filter(Boolean);

    // 5. Seed Display Sections
    const initialSections = [
      {
        title: 'Grab The Wraps',
        slug: 'grab-the-wraps',
        subtitle: 'Crispy and flame-grilled tender wraps',
        displayOrder: 1,
        isShown: true,
        products: getProductIds([
          'Dynamite Wrap',
          'Creamy Wrap',
          'Fiery Wrap',
          'Peri Peri Wrap',
          'Smoky Wrap',
        ]),
        deals: [],
      },
      {
        title: 'Loaded Fries Zone',
        slug: 'loaded-fries-zone',
        subtitle: 'Cheese oozing loaded fries and benders',
        displayOrder: 2,
        isShown: true,
        products: getProductIds([
          'Cheese Burger Fries',
          'Messy Fries',
          'Siracha Loaded Fries',
        ]),
        deals: [],
      },
      {
        title: 'Gourmet & Smash Burgers',
        slug: 'gourmet-smash-burgers',
        subtitle: 'Our signature smashed beef and crispy chicken burgers',
        displayOrder: 3,
        isShown: true,
        products: getProductIds([
          'Oklahoma Beef',
          'The OG Beef',
          'beef-mushroom-madness',
          'blazin-bird',
          'beef-crunchos',
        ]),
        deals: [],
      },
      {
        title: 'Beverages & Drinks',
        slug: 'beverages-drinks',
        subtitle: 'Ice cold sodas and mineral water',
        displayOrder: 4,
        isShown: true,
        products: getProductIds([
          'Coke 350 ml',
          'Coke Zero 350 ml',
          'Sprite 350 ml',
          'Fanta 500 ml',
          'Mineral Water (Dasani)',
        ]),
        deals: [],
      },
    ];

    await Section.insertMany(initialSections);

    console.log('✅ Data Seeded Successfully!');
    console.log(`Pushed ${createdProducts.length} total products (including component sliders), 5 base categories, 4 deal categories, and 4 display sections.`);

    process.exit();
  } catch (error) {
    console.error(`❌ Error with data import: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await Section.deleteMany();
    await Deal.deleteMany();
    await DealCategory.deleteMany();

    console.log('🔥 Data Destroyed Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error with data destruction: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}