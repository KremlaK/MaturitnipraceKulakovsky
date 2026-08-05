const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

async function getOwnedCar(carId, userId) {
  return prisma.car.findFirst({ where: { id: carId, ownerId: userId } });
}

// GET /api/cars/:carId/stats - statistiky pro grafy (měsíční a kategorie)
router.get('/:carId/stats', async (req, res) => {
  try {
    const car = await getOwnedCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const [serviceRecords, fuelRecords, expenses] = await Promise.all([
      prisma.serviceRecord.findMany({ where: { carId: req.params.carId } }),
      prisma.fuelRecord.findMany({ where: { carId: req.params.carId } }),
      prisma.expense.findMany({ where: { carId: req.params.carId } }),
    ]);

    // --- Výdaje podle měsíců (posledních 12 měsíců) ---
    const monthlyMap = {};

    function addToMonth(date, field, amount) {
      const monthKey = new Date(date).toISOString().slice(0, 7); // "2026-08"
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, service: 0, fuel: 0, expenses: 0 };
      }
      monthlyMap[monthKey][field] += amount;
    }

    serviceRecords.forEach((r) => addToMonth(r.date, 'service', r.price || 0));
    fuelRecords.forEach((r) => addToMonth(r.date, 'fuel', r.totalPrice));
    expenses.forEach((r) => addToMonth(r.date, 'expenses', r.price));

    const monthlyStats = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({ ...m, total: m.service + m.fuel + m.expenses }));

    // --- Výdaje podle kategorií ---
    const categoryMap = {};

    function addToCategory(name, amount) {
      categoryMap[name] = (categoryMap[name] || 0) + amount;
    }

    serviceRecords.forEach((r) => addToCategory(r.type, r.price || 0));
    fuelRecords.forEach((r) => addToCategory('Palivo', r.totalPrice));
    expenses.forEach((r) => addToCategory(r.category, r.price));

    const categoryStats = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // --- Vývoj spotřeby v čase (jen plné nádrže) ---
    const fullTankSorted = fuelRecords
      .filter((r) => r.fullTank)
      .sort((a, b) => a.mileage - b.mileage);

    const consumptionTrend = [];
    for (let i = 1; i < fullTankSorted.length; i++) {
      const prev = fullTankSorted[i - 1];
      const curr = fullTankSorted[i];
      const km = curr.mileage - prev.mileage;
      if (km > 0) {
        const consumption = Math.round((curr.liters / km) * 100 * 100) / 100;
        consumptionTrend.push({
          date: new Date(curr.date).toISOString().slice(0, 10),
          consumption,
        });
      }
    }

    res.json({ monthlyStats, categoryStats, consumptionTrend });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;