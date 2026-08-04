const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

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

module.exports = router;