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

// Typ souboru podle obsahu (prvních bajtů), ne podle hlavičky od prohlížeče, která jde podvrhnout
function matchesSignature(buffer, mimetype) {
  if (!buffer || buffer.length < 12) return false;
  const hex = buffer.subarray(0, 12).toString('hex');
  switch (mimetype) {
    case 'image/jpeg': return hex.startsWith('ffd8ff');
    case 'image/png': return hex.startsWith('89504e470d0a1a0a');
    case 'image/webp': return hex.startsWith('52494646') && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    case 'application/pdf': return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    default: return false;
  }
}

module.exports = upload;
module.exports.matchesSignature = matchesSignature;