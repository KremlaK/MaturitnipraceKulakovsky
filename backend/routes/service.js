const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/service - všechny servisní záznamy k danému autu
router.get('/:carId/service', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const records = await prisma.serviceRecord.findMany({
      where: { carId: req.params.carId },
      orderBy: { date: 'desc' },
    });

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/service - přidání servisního záznamu
router.post('/:carId/service', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { type, description, price, date, mileage, invoiceUrl, photoUrl } = req.body;

    if (!type || !date) {
      return res.status(400).json({ error: 'Typ opravy a datum jsou povinné.' });
    }

    const record = await prisma.serviceRecord.create({
      data: {
        type,
        description: description || null,
        price: price || null,
        date: new Date(date),
        mileage: mileage || null,
        invoiceUrl: invoiceUrl || null,
        photoUrl: photoUrl || null,
        carId: req.params.carId,
      },
    });

    if (mileage && car.mileage !== null && mileage > car.mileage) {
      await prisma.car.update({
        where: { id: car.id },
        data: { mileage },
      });
    }

    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/service/:id - úprava servisního záznamu
router.put('/service/:id', async (req, res) => {
  try {
    const record = await prisma.serviceRecord.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!record) {
      return res.status(404).json({ error: 'Záznam nenalezen.' });
    }

    const hasAccess = record.car.ownerId === req.userId || record.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Záznam nenalezen.' });
    }

    const { type, description, price, date, mileage, invoiceUrl, photoUrl } = req.body;

    const updated = await prisma.serviceRecord.update({
      where: { id: req.params.id },
      data: {
        type,
        description,
        price,
        date: date ? new Date(date) : undefined,
        mileage,
        invoiceUrl,
        photoUrl,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/service/:id - smazání servisního záznamu
router.delete('/service/:id', async (req, res) => {
  try {
    const record = await prisma.serviceRecord.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!record) {
      return res.status(404).json({ error: 'Záznam nenalezen.' });
    }

    const hasAccess = record.car.ownerId === req.userId || record.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Záznam nenalezen.' });
    }

    await prisma.serviceRecord.delete({ where: { id: req.params.id } });

    res.json({ message: 'Záznam byl smazán.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;