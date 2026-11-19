const express = require('express');
const { uploadBuffer } = require('../utils/cloudinary');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);


// POST /api/upload - nahrání jednoho souboru, vrátí URL
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Žádný soubor nebyl nahrán.' });
    }
    if (!upload.matchesSignature(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: 'Soubor neodpovídá svému typu. Povoleno: JPEG, PNG, WEBP, PDF.' });
    }

    const result = await uploadBuffer(req.file.buffer, `autoapp/${req.userId}`);

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Nahrání souboru selhalo.' });
  }
});

module.exports = router;