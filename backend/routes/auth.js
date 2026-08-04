const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Základní validace
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 8 znaků.' });
    }

    // Zkontroluj, jestli uživatel s tímto e-mailem už existuje
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Uživatel s tímto e-mailem už existuje.' });
    }

    // Zahashuj heslo
    const hashedPassword = await bcrypt.hash(password, 10);

    // Vytvoř uživatele v databázi
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    // Nikdy neposílej hash hesla zpátky klientovi!
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Uživatel nenalezen.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;