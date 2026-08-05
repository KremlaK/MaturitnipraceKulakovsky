const multer = require('multer');

// Ukládáme dočasně do paměti (ne na disk), než soubor pošleme na Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nepovolený typ souboru. Povoleno: JPEG, PNG, WEBP, PDF.'));
    }
  },
});

module.exports = upload;