const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/map/locations - všechny záznamy s polohou přes všechna dostupná auta uživatele
router.get('/locations', async (req, res) => {
  try {
    const carFilter = {
      OR: [
        { ownerId: req.userId },
        { shares: { some: { userId: req.userId } } },
      ],
    };

    const [fuelRecords, serviceRecords] = await Promise.all([
      prisma.fuelRecord.findMany({
        where: {
          car: carFilter,
          latitude: { not: null },
          longitude: { not: null },
        },
        include: { car: { select: { id: true, make: true, model: true } } },
      }),
      prisma.serviceRecord.findMany({
        where: {
          car: carFilter,
          latitude: { not: null },
          longitude: { not: null },
        },
        include: { car: { select: { id: true, make: true, model: true } } },
      }),
    ]);

    const fuelPoints = fuelRecords.map((r) => ({
      id: r.id,
      type: 'fuel',
      latitude: r.latitude,
      longitude: r.longitude,
      placeName: r.placeName,
      date: r.date,
      label: `${r.fuelType} - ${r.totalPrice} Kč`,
      car: r.car,
    }));

    const servicePoints = serviceRecords.map((r) => ({
      id: r.id,
      type: 'service',
      latitude: r.latitude,
      longitude: r.longitude,
      placeName: r.placeName,
      date: r.date,
      label: r.type,
      car: r.car,
    }));

    res.json([...fuelPoints, ...servicePoints]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;