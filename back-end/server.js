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

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
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

app.get('/', (req, res) => {
  res.send('Burger O Clock API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in dev mode on port ${PORT}`);
});