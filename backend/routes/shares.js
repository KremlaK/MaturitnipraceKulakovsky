const express = require('express');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { getOwnedCar } = require('../utils/carAccess');

const router = express.Router();

router.use(authMiddleware);

// GET /api/cars/:carId/shares - seznam lidí, se kterými je auto sdílené (jen majitel)
router.get('/:carId/shares', async (req, res) => {
  try {
    const car = await getOwnedCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno nebo nemáš oprávnění.' });
    }

    const shares = await prisma.carShare.findMany({
      where: { carId: req.params.carId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json(shares);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/cars/:carId/shares - sdílet auto s uživatelem podle e-mailu (jen majitel)
router.post('/:carId/shares', async (req, res) => {
  try {
    const car = await getOwnedCar(req.params.carId, req.userId);
    if (!car) {
      return res.status(404).json({ error: 'Auto nenalezeno nebo nemáš oprávnění.' });
    }

    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'E-mail a role jsou povinné.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });

    if (!targetUser) {
      return res.status(404).json({ error: 'Uživatel s tímto e-mailem není v AutoApp zaregistrovaný.' });
    }

    if (targetUser.id === req.userId) {
      return res.status(400).json({ error: 'Auto nemůžeš sdílet sám se sebou.' });
    }

    const share = await prisma.carShare.create({
      data: {
        carId: req.params.carId,
        userId: targetUser.id,
        role,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(share);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'S tímto uživatelem je auto už sdílené.' });
    }
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/shares/:id - zrušení sdílení (jen majitel auta)
router.delete('/:id', async (req, res) => {
  try {
    const share = await prisma.carShare.findUnique({
      where: { id: req.params.id },
      include: { car: true },
    });

    if (!share || share.car.ownerId !== req.userId) {
      return res.status(404).json({ error: 'Sdílení nenalezeno nebo nemáš oprávnění.' });
    }

    await prisma.carShare.delete({ where: { id: req.params.id } });

    res.json({ message: 'Sdílení bylo zrušeno.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;