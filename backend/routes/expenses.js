const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/expenses - všechny výdaje k danému autu
router.get('/:carId/expenses', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const expenses = await prisma.expense.findMany({
      where: { carId: req.params.carId },
      orderBy: { date: 'desc' },
    });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/expenses - přidání výdaje
router.post('/:carId/expenses', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { category, description, price, date } = req.body;

    if (!category || !price || !date) {
      return res.status(400).json({ error: 'Kategorie, cena a datum jsou povinné.' });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        description: description || null,
        price,
        date: new Date(date),
        carId: req.params.carId,
      },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2009' || error.name === 'PrismaClientValidationError') {
      return res.status(400).json({ error: 'Neplatná kategorie výdaje.' });
    }
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/expenses/:id - smazání výdaje
router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Výdaj nenalezen.' });
    }

    const hasAccess = expense.car.ownerId === req.userId || expense.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Výdaj nenalezen.' });
    }

    await prisma.expense.delete({ where: { id: req.params.id } });

    res.json({ message: 'Výdaj byl smazán.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;