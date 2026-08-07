const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/photos - všechny fotky k danému autu
router.get('/:carId/photos', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const photos = await prisma.photo.findMany({
      where: { carId: req.params.carId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(photos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/photos - přidání fotky do galerie
router.post('/:carId/photos', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { url, category, caption } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL fotky je povinná.' });
    }

    const photo = await prisma.photo.create({
      data: {
        url,
        category: category || 'AUTO',
        caption: caption || null,
        carId: req.params.carId,
      },
    });

    res.status(201).json(photo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/photos/:id - smazání fotky
router.delete('/:id', async (req, res) => {
  try {
    const photo = await prisma.photo.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Fotka nenalezena.' });
    }

    const hasAccess = photo.car.ownerId === req.userId || photo.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Fotka nenalezena.' });
    }

    await prisma.photo.delete({ where: { id: req.params.id } });

    res.json({ message: 'Fotka byla smazána.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;
