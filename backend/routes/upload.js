const express = require('express');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// POST /api/upload - nahrání jednoho souboru, vrátí URL
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Žádný soubor nebyl nahrán.' });
    }

    const result = await uploadToCloudinary(req.file.buffer, `autoapp/${req.userId}`);

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Nahrání souboru selhalo.' });
  }
});

module.exports = router;