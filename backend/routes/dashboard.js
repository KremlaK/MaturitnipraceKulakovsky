const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/dashboard - souhrn přes všechna auta uživatele
router.get('/', async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: { ownerId: req.userId },
      include: {
        serviceRecords: true,
        fuelRecords: true,
        expenses: true,
      },
    });

    let totalServiceCost = 0;
    let totalFuelCost = 0;
    let totalExpensesCost = 0;
    const monthlyMap = {};

    function addToMonth(date, field, amount) {
      const monthKey = new Date(date).toISOString().slice(0, 7);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, service: 0, fuel: 0, expenses: 0 };
      }
      monthlyMap[monthKey][field] += amount;
    }

    const carSummaries = cars.map((car) => {
      const carServiceCost = car.serviceRecords.reduce((sum, r) => sum + (r.price || 0), 0);
      const carFuelCost = car.fuelRecords.reduce((sum, r) => sum + r.totalPrice, 0);
      const carExpensesCost = car.expenses.reduce((sum, e) => sum + e.price, 0);

      totalServiceCost += carServiceCost;
      totalFuelCost += carFuelCost;
      totalExpensesCost += carExpensesCost;

      car.serviceRecords.forEach((r) => addToMonth(r.date, 'service', r.price || 0));
      car.fuelRecords.forEach((r) => addToMonth(r.date, 'fuel', r.totalPrice));
      car.expenses.forEach((r) => addToMonth(r.date, 'expenses', r.price));

      return {
        id: car.id,
        make: car.make,
        model: car.model,
        mileage: car.mileage,
        licensePlate: car.licensePlate,
        totalCost: carServiceCost + carFuelCost + carExpensesCost,
      };
    });

    const monthlyStats = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, total: m.service + m.fuel + m.expenses }));

    res.json({
      carCount: cars.length,
      totalCost: totalServiceCost + totalFuelCost + totalExpensesCost,
      totalServiceCost,
      totalFuelCost,
      totalExpensesCost,
      monthlyStats,
      cars: carSummaries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;