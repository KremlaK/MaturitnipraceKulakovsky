const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/fuel - všechny záznamy tankování k danému autu
router.get('/:carId/fuel', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const records = await prisma.fuelRecord.findMany({
      where: { carId: req.params.carId },
      orderBy: { date: 'desc' },
    });

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/fuel - přidání záznamu tankování
router.post('/:carId/fuel', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { date, liters, pricePerLiter, mileage, fuelType, fullTank, latitude, longitude, placeName } = req.body;

    if (!date || !liters || !pricePerLiter || !mileage || !fuelType) {
      return res.status(400).json({ error: 'Vyplň všechna povinná pole.' });
    }

    const totalPrice = Math.round(liters * pricePerLiter * 100) / 100;

    const record = await prisma.fuelRecord.create({
      data: {
        date: new Date(date),
        liters,
        pricePerLiter,
        totalPrice,
        mileage,
        fuelType,
        fullTank: fullTank !== undefined ? fullTank : true,
        latitude: latitude || null,
        longitude: longitude || null,
        placeName: placeName || null,
        carId: req.params.carId,
      },
    });

    if (car.mileage === null || mileage > car.mileage) {
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

// DELETE /api/fuel/:id - smazání záznamu tankování
router.delete('/fuel/:id', async (req, res) => {
  try {
    const record = await prisma.fuelRecord.findUnique({
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

    await prisma.fuelRecord.delete({ where: { id: req.params.id } });

    res.json({ message: 'Záznam byl smazán.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/cars/:carId/fuel-stats - statistiky spotřeby
router.get('/:carId/fuel-stats', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const records = await prisma.fuelRecord.findMany({
      where: { carId: req.params.carId },
      orderBy: { mileage: 'asc' },
    });

    if (records.length < 2) {
      return res.json({
        averageConsumption: null,
        averagePricePerLiter: null,
        totalSpent: records.reduce((sum, r) => sum + r.totalPrice, 0),
        totalLiters: records.reduce((sum, r) => sum + r.liters, 0),
        message: 'Pro výpočet spotřeby jsou potřeba alespoň 2 tankování.',
      });
    }

    const fullTankRecords = records.filter((r) => r.fullTank);

    let totalConsumptionLiters = 0;
    let totalConsumptionKm = 0;

    for (let i = 1; i < fullTankRecords.length; i++) {
      const prev = fullTankRecords[i - 1];
      const curr = fullTankRecords[i];
      const km = curr.mileage - prev.mileage;

      if (km > 0) {
        totalConsumptionLiters += curr.liters;
        totalConsumptionKm += km;
      }
    }

    const averageConsumption = totalConsumptionKm > 0
      ? Math.round((totalConsumptionLiters / totalConsumptionKm) * 100 * 100) / 100
      : null;

    const totalSpent = records.reduce((sum, r) => sum + r.totalPrice, 0);
    const totalLiters = records.reduce((sum, r) => sum + r.liters, 0);
    const averagePricePerLiter = Math.round((totalSpent / totalLiters) * 100) / 100;

    const firstMileage = records[0].mileage;
    const lastMileage = records[records.length - 1].mileage;
    const totalKm = lastMileage - firstMileage;
    const pricePerKm = totalKm > 0 ? Math.round((totalSpent / totalKm) * 100) / 100 : null;

    res.json({
      averageConsumption,
      averagePricePerLiter,
      pricePerKm,
      totalSpent,
      totalLiters,
      totalKm,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;