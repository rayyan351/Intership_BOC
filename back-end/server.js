// Cleaned back-end/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const dealRoutes = require('./routes/dealRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const dealCategoryRoutes = require('./routes/dealCategoryRoutes');

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

app.get('/', (req, res) => {
  res.send('Burger O Clock API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in dev mode on port ${PORT}`);
});