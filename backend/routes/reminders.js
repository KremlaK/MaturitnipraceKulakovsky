const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getAccessibleCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/reminders - připomínky k danému autu
router.get('/:carId/reminders', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const reminders = await prisma.reminder.findMany({
      where: { carId: req.params.carId },
      orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    });

    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/reminders/upcoming - všechny nadcházející připomínky přes všechna dostupná auta uživatele
router.get('/upcoming', async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        completed: false,
        car: {
          OR: [
            { ownerId: req.userId },
            { shares: { some: { userId: req.userId } } },
          ],
        },
      },
      include: { car: { select: { id: true, make: true, model: true, licensePlate: true } } },
      orderBy: { dueDate: 'asc' },
    });

    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/reminders - přidání připomínky
router.post('/:carId/reminders', async (req, res) => {
  try {
    const car = await getAccessibleCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno.' });
    }

    const { type, title, notes, dueDate, dueMileage, emailAlert } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Typ a název jsou povinné.' });
    }

    if (!dueDate && !dueMileage) {
      return res.status(400).json({ error: 'Zadej alespoň datum nebo nájezd, kdy má připomínka platit.' });
    }

    const reminder = await prisma.reminder.create({
      data: {
        type,
        title,
        notes: notes || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        dueMileage: dueMileage || null,
        emailAlert: emailAlert !== undefined ? emailAlert : true,
        carId: req.params.carId,
      },
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/reminders/:id/complete - označit jako splněné
router.put('/:id/complete', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Připomínka nenalezena.' });
    }

    const hasAccess = reminder.car.ownerId === req.userId || reminder.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Připomínka nenalezena.' });
    }

    const updated = await prisma.reminder.update({
      where: { id: req.params.id },
      data: { completed: !reminder.completed },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/reminders/:id - smazání připomínky
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id: req.params.id },
      include: { car: { include: { shares: true } } },
    });

    if (!reminder) {
      return res.status(404).json({ error: 'Připomínka nenalezena.' });
    }

    const hasAccess = reminder.car.ownerId === req.userId || reminder.car.shares.some((s) => s.userId === req.userId);
    if (!hasAccess) {
      return res.status(404).json({ error: 'Připomínka nenalezena.' });
    }

    await prisma.reminder.delete({ where: { id: req.params.id } });

    res.json({ message: 'Připomínka byla smazána.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;