const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const MAX_STATIONS = 30;

function parseCoord(value, min, max) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

// GET /api/stations – oblíbené pumpy přihlášeného uživatele
// + "nedávné": místa z posledních tankování, která ještě nejsou v oblíbených
router.get('/', async (req, res) => {
  try {
    const favorites = await prisma.favoriteStation.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });

    const recentFuel = await prisma.fuelRecord.findMany({
      where: {
        placeName: { not: null },
        car: { OR: [{ ownerId: req.userId }, { shares: { some: { userId: req.userId } } }] },
      },
      orderBy: { date: 'desc' },
      take: 50,
      select: { placeName: true, latitude: true, longitude: true },
    });
    const favoriteNames = new Set(favorites.map((f) => f.name.toLowerCase()));
    const seen = new Set();
    const recent = [];
    for (const r of recentFuel) {
      const key = r.placeName.toLowerCase();
      if (favoriteNames.has(key) || seen.has(key)) continue;
      seen.add(key);
      recent.push({ name: r.placeName, latitude: r.latitude, longitude: r.longitude });
      if (recent.length === 5) break;
    }

    res.json({ favorites, recent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/stations – přidat pumpu do oblíbených
router.post('/', async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 160) {
      return res.status(400).json({ error: 'Název pumpy musí mít 2 až 160 znaků.' });
    }
    const latitude = parseCoord(req.body.latitude, -90, 90);
    const longitude = parseCoord(req.body.longitude, -180, 180);
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Neplatné souřadnice.' });
    }

    const count = await prisma.favoriteStation.count({ where: { userId: req.userId } });
    if (count >= MAX_STATIONS) {
      return res.status(400).json({ error: `Oblíbených pump může být nejvýš ${MAX_STATIONS}.` });
    }

    const station = await prisma.favoriteStation.create({
      data: { name, latitude, longitude, userId: req.userId },
    });
    res.status(201).json(station);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Tuhle pumpu už v oblíbených máš.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/stations/:id – odebrat z oblíbených (jen vlastní)
router.delete('/:id', async (req, res) => {
  try {
    const result = await prisma.favoriteStation.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Pumpa nenalezena.' });
    }
    res.json({ message: 'Pumpa odebrána z oblíbených.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;
