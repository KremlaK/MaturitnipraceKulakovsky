const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { loginLimiter, accountLimiter } = require('../middleware/rateLimits');

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const VERIFY_TTL = 24 * 60 * 60 * 1000; // 24 h
const RESET_TTL = 60 * 60 * 1000; // 1 h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Hash pro porovnání, když účet neexistuje – přihlášení pak trvá stejně dlouho
// a podle doby odezvy nejde zjistit, které e-maily jsou registrované.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// Odkazy z e-mailů ukládáme jen jako SHA-256 otisk – únik databáze je neprozradí.
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('hex');

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Heslo musí mít alespoň 8 znaků.';
  // bcrypt bere jen prvních 72 bajtů – delší heslo by se tiše zkrátilo
  if (Buffer.byteLength(password, 'utf8') > 72) return 'Heslo je příliš dlouhé (max. 72 bajtů).';
  return null;
}

function signToken(user) {
  return jwt.sign({ userId: user.id, tv: user.tokenVersion }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '7d',
  });
}

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, emailVerified: u.emailVerified });

async function issueVerification(user) {
  const token = newToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerifyToken: hashToken(token), emailVerifyExpires: new Date(Date.now() + VERIFY_TTL) },
  });
  try {
    await sendVerificationEmail(user.email, token);
    return true;
  } catch (error) {
    console.error('Ověřovací e-mail se neodeslal:', error.message);
    return false;
  }
}

// POST /api/auth/register – registrace; uživatel je rovnou přihlášený
router.post('/register', accountLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 80) : '';

    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Zadej platný e-mail.' });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Účet s tímto e-mailem už existuje. Zkus se přihlásit nebo obnovit heslo.' });
    }

    const user = await prisma.user.create({
      data: { email, name: name || null, password: await bcrypt.hash(password, BCRYPT_ROUNDS) },
    });
    const emailSent = await issueVerification(user);

    res.status(201).json({ token: signToken(user), user: publicUser(user), emailSent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/auth/verify-email – potvrzení e-mailu odkazem
router.post('/verify-email', accountLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (typeof token !== 'string' || token.length < 32) {
      return res.status(400).json({ error: 'Chybí ověřovací token.' });
    }
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: hashToken(token), emailVerifyExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Odkaz je neplatný nebo vypršel. Pošli si nový v aplikaci.' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });
    res.json({ message: 'E-mail je ověřený. Díky!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/auth/resend-verification – nový ověřovací odkaz pro přihlášeného uživatele
router.post('/resend-verification', authMiddleware, accountLimiter, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Uživatel nenalezen.' });
    if (user.emailVerified) return res.status(400).json({ error: 'E-mail už je ověřený.' });
    const sent = await issueVerification(user);
    if (!sent) return res.status(502).json({ error: 'E-mail se teď nepodařilo odeslat. Zkus to za chvíli.' });
    res.json({ message: `Poslali jsme nový odkaz na ${user.email}.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail a heslo jsou povinné.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, emailVerified: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'Uživatel nenalezen.' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/auth/profile – změna jména
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name: name || null },
      select: { id: true, email: true, name: true, emailVerified: true },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/auth/change-password – odhlásí ostatní zařízení, aktuální dostane nový token
router.put('/change-password', authMiddleware, accountLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'Zadej aktuální heslo.' });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: 'Aktuální heslo není správné.' });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS), tokenVersion: { increment: 1 } },
    });
    res.json({ message: 'Heslo bylo změněno. Ostatní zařízení jsme odhlásili.', token: signToken(updated) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/auth/forgot-password – vždy stejná odpověď, ať účet existuje nebo ne
router.post('/forgot-password', accountLimiter, async (req, res) => {
  const reply = { message: 'Pokud účet existuje, poslali jsme na e-mail odkaz na obnovení hesla.' };
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Zadej platný e-mail.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(reply);

    const token = newToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashToken(token), resetPasswordExpires: new Date(Date.now() + RESET_TTL) },
    });
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (error) {
      console.error('E-mail pro obnovu hesla se neodeslal:', error.message);
    }
    res.json(reply);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// POST /api/auth/reset-password – nové heslo z odkazu; odhlásí všechna zařízení
router.post('/reset-password', accountLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (typeof token !== 'string' || token.length < 32) {
      return res.status(400).json({ error: 'Chybí token pro obnovu hesla.' });
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const user = await prisma.user.findFirst({
      where: { resetPasswordToken: hashToken(token), resetPasswordExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Odkaz je neplatný nebo vypršel. Požádej o nový.' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // kdo si nechal poslat odkaz, vlastní e-mail – můžeme ho rovnou považovat za ověřený
        emailVerified: true,
        tokenVersion: { increment: 1 },
      },
    });
    res.json({ message: 'Heslo je změněné. Teď se můžeš přihlásit.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;
