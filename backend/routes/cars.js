const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar, getOwnedCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars - seznam všech aut, ke kterým má uživatel přístup (vlastní i sdílená)
router.get('/', async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: {
        OR: [
          { ownerId: req.userId },
          { shares: { some: { userId: req.userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        shares: { where: { userId: req.userId }, select: { role: true } },
      },
    });

    const result = cars.map((car) => ({
      ...car,
      isOwner: car.ownerId === req.userId,
      myRole: car.ownerId === req.userId ? 'MAJITEL' : car.shares[0]?.role || null,
      shares: undefined,
    }));

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/cars/:id - detail jednoho auta
router.get('/:id', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.id, req.userId);

    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const isOwner = car.ownerId === req.userId;
    const share = isOwner ? null : await prisma.carShare.findUnique({
      where: { carId_userId: { carId: car.id, userId: req.userId } },
      select: { role: true },
    });
    res.json({ ...car, isOwner, myRole: isOwner ? 'MAJITEL' : share?.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

const { parseFileUrl } = require('../utils/fileUrl');

const BODY_TYPES = ['HATCHBACK', 'SEDAN', 'KOMBI', 'SUV'];
const PHOTO_VIEWS = ['FRONT', 'SIDE'];

function parsePhotoView(value) {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (PHOTO_VIEWS.includes(value)) return { value };
  return { error: 'Fotka musí být zepředu (FRONT) nebo z boku (SIDE).' };
}

// undefined = beze změny, '' / null = smazat, jinak musí jít o známý typ karoserie
function parseBodyType(value) {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (BODY_TYPES.includes(value)) return { value };
  return { error: `Neznámý typ karoserie. Povolené: ${BODY_TYPES.join(', ')}.` };
}

// POST /api/cars - přidání nového auta
router.post('/', async (req, res) => {
  try {
    const { vin, licensePlate, make, model, year, mileage, notes, photoUrl } = req.body;

    if (!make || !model) {
      return res.status(400).json({ error: 'Značka a model jsou povinné.' });
    }

    const bodyType = parseBodyType(req.body.bodyType);
    const photo = parseFileUrl(photoUrl);
    const photoView = parsePhotoView(req.body.photoView);
    const invalid = bodyType.error || photo.error || photoView.error;
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const car = await prisma.car.create({
      data: {
        vin: vin || null,
        licensePlate: licensePlate || null,
        make,
        model,
        year: year || null,
        mileage: mileage || 0,
        bodyType: bodyType.value ?? null,
        notes: notes || null,
        photoUrl: photo.value ?? null,
        photoView: photo.value ? (photoView.value ?? 'FRONT') : null,
        ownerId: req.userId,
      },
    });

    res.status(201).json(car);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Auto s tímto VIN už existuje.' });
    }
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/cars/:id - úprava auta (jen majitel)
router.put('/:id', async (req, res) => {
  try {
    const existingCar = await getOwnedCar(req.params.id, req.userId);

    if (!existingCar) {
      return res.status(404).json({ error: 'Auto nenalezeno nebo nemáš oprávnění ho upravit.' });
    }

    const { vin, licensePlate, make, model, year, mileage, notes, photoUrl } = req.body;

    const bodyType = parseBodyType(req.body.bodyType);
    const photo = parseFileUrl(photoUrl);
    const photoView = parsePhotoView(req.body.photoView);
    const invalid = bodyType.error || photo.error || photoView.error;
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: {
        vin, licensePlate, make, model, year, mileage, notes,
        photoUrl: photo.value,
        // bez fotky nemá smysl uchovávat, odkud byla vyfocená
        photoView: photo.value === null ? null : photoView.value,
        bodyType: bodyType.value,
      },
    });

    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/cars/:id - smazání auta (jen majitel)
router.delete('/:id', async (req, res) => {
  try {
    const existingCar = await getOwnedCar(req.params.id, req.userId);

    if (!existingCar) {
      return res.status(404).json({ error: 'Auto nenalezeno nebo nemáš oprávnění ho smazat.' });
    }

    await prisma.car.delete({ where: { id: req.params.id } });

    res.json({ message: 'Auto bylo smazáno.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;