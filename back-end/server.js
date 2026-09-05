// Cleaned back-end/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

dotenv.config();
connectDB();

const app = express();

// Allowed origins come from FRONTEND_URL (comma-separated for more than one).
// localhost:3000 is always permitted so local development works without config.
const allowedOrigins = [
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
];

// Vercel builds a fresh subdomain for every preview deploy, so those are
// matched by pattern rather than listed one by one.
const isVercelPreview = (origin) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header: same-origin requests, curl, health checks.
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalized) || isVercelPreview(normalized)) {
        return callback(null, true);
      }

      console.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'assets/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/deals', require('./routes/dealRoutes'));
app.use('/api/sections', require('./routes/sectionRoutes'));
app.use('/api/deal-categories', require('./routes/dealCategoryRoutes'));
app.use('/api/settings', require('./routes/settingRoutes'));
app.use('/api/branches', require('./routes/branchRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/recipes', require('./routes/recipeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/purchase-orders', require('./routes/purchaseOrderRoutes'));
app.use('/api/inventory/stocktakes', require('./routes/stocktakeRoutes'));
app.use('/api/inventory/auto-reorder', require('./routes/autoReorderRoutes'));
app.use('/api/inventory/batches', require('./routes/batchRoutes'));
app.use('/api/delivery-areas', require('./routes/deliveryAreaRoutes'));

app.get('/', (req, res) => {
  res.send('Burger O Clock API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in dev mode on port ${PORT}`);
});