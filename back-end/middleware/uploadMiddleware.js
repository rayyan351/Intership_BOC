// back-end/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Target the front-end public directory
    const uploadPath = path.join(__dirname, '../assets/uploads/images/products');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Slugify the item name (e.g., "Classic Beef Burger" -> "classic-beef-burger")
    const itemName = req.body.name || 'product';
    const slugName = itemName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const ext = path.extname(file.originalname);
    cb(null, `${slugName}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;