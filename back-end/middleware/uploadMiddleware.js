// back-end/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Save section banners in assets/uploads/sections
    const folder = file.fieldname === 'banner' ? 'sections' : 'products';
    const uploadPath = path.join(__dirname, `../assets/uploads/${folder}`);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const rawName = req.body.title || req.body.name || 'banner';
    const slugName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const ext = path.extname(file.originalname);
    // Append timestamp to prevent caching & overwriting
    cb(null, `${slugName}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;