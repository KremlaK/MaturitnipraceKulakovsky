const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Všechny routy pro auta vyžadují přihlášení
router.use(authMiddleware);

// GET /api/cars - seznam všech aut přihlášeného uživatele
router.get('/', async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: { ownerId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/cars/:id - detail jednoho auta
router.get('/:id', async (req, res) => {
  try {
    const car = await prisma.car.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
    });

    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars - přidání nového auta
router.post('/', async (req, res) => {
  try {
    const { vin, licensePlate, make, model, year, mileage, notes, photoUrl } = req.body;

    if (!make || !model) {
      return res.status(400).json({ error: 'Značka a model jsou povinné.' });
    }

    const car = await prisma.car.create({
      data: {
        vin: vin || null,
        licensePlate: licensePlate || null,
        make,
        model,
        year: year || null,
        mileage: mileage || 0,
        notes: notes || null,
        photoUrl: photoUrl || null,
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

// PUT /api/cars/:id - úprava auta
router.put('/:id', async (req, res) => {
  try {
    const existingCar = await prisma.car.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
    });

    if (!existingCar) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { vin, licensePlate, make, model, year, mileage, notes, photoUrl } = req.body;

    const car = await prisma.car.update({
      where: { id: req.params.id },
      data: { vin, licensePlate, make, model, year, mileage, notes, photoUrl },
    });

    res.json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/cars/:id - smazání auta
router.delete('/:id', async (req, res) => {
  try {
    const existingCar = await prisma.car.findFirst({
      where: { id: req.params.id, ownerId: req.userId },
    });

    if (!existingCar) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    await prisma.car.delete({ where: { id: req.params.id } });

    res.json({ message: 'Auto bylo smazáno.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;