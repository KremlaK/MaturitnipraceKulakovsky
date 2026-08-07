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

// GET /api/map/search?q=... - vyhledání míst přes Nominatim (OpenStreetMap)
router.get('/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toString().trim();

    if (query.length < 2) {
      return res.json([]);
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutoApp/1.0 (osobni projekt, kontakt: kontakt@example.com)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Vyhledávání míst momentálně nefunguje.' });
    }

    const data = await response.json();

    const results = data.map((item) => ({
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    }));

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Vyhledávání selhalo.' });
  }
});

module.exports = router;