// back-end/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
// back-end/middleware/uploadMiddleware.js
destination: (req, file, cb) => {
  let folder = 'products';
  if (file.fieldname === 'banner') folder = 'sections';
  if (
    file.fieldname === 'storeLogo' ||
    file.fieldname === 'adminLogo' ||
    file.fieldname === 'favicon'
  ) {
    folder = 'settings';
  }

  const uploadPath = path.join(__dirname, `../assets/uploads/${folder}`);
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  cb(null, uploadPath);
},
  filename: (req, file, cb) => {
    const rawName = req.body.storeName || req.body.title || req.body.name || file.fieldname || 'asset';
    const slugName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const ext = path.extname(file.originalname);
    cb(null, `${slugName}-${file.fieldname}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

module.exports = upload;