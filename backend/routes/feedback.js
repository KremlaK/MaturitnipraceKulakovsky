const express = require('express');
const rateLimit = require('express-rate-limit');
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');
const { sendBugReportEmail } = require('../utils/email');

const router = express.Router();
router.use(authMiddleware);

// Ochrana proti zahlcení: hlášení chyb a recenze nejsou častá akce
const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.userId,
  message: { error: 'Příliš mnoho požadavků. Zkus to prosím později.' },
});

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

// POST /api/feedback/bugs – nahlášení chyby
router.post('/bugs', writeLimiter, async (req, res) => {
  try {
    const title = cleanText(req.body.title, 160);
    const description = cleanText(req.body.description, 5000);
    if (title.length < 3) return res.status(400).json({ error: 'Napiš krátký název chyby (aspoň 3 znaky).' });
    if (description.length < 10) return res.status(400).json({ error: 'Popiš prosím, co se stalo (aspoň 10 znaků).' });

    const report = await prisma.bugReport.create({
      data: {
        title,
        description,
        pageUrl: cleanText(req.body.pageUrl, 500) || null,
        userAgent: cleanText(req.headers['user-agent'], 500) || null,
        userId: req.userId,
      },
    });

    // Upozornění správci, pokud je nastavený e-mail (ADMIN_EMAIL). Selhání e-mailu hlášení neruší.
    if (process.env.ADMIN_EMAIL) {
      sendBugReportEmail(process.env.ADMIN_EMAIL, report).catch((e) => console.error('E-mail o chybě se neodeslal:', e.message));
    }

    res.status(201).json({ id: report.id, message: 'Díky! Chybu jsme zaznamenali.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/feedback/bugs/mine – moje nahlášené chyby a jejich stav
router.get('/bugs/mine', async (req, res) => {
  try {
    const reports = await prisma.bugReport.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, title: true, status: true, createdAt: true },
    });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// Zobrazované jméno autora recenze: jen křestní jméno, nikdy e-mail
function displayName(user) {
  const first = (user?.name || '').trim().split(/\s+/)[0];
  return first || 'Uživatel AutoApp';
}

// GET /api/feedback/reviews – všechny recenze + průměr + moje recenze
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: { user: { select: { name: true } } },
    });
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
    const counts = [1, 2, 3, 4, 5].map((star) => reviews.filter((r) => r.rating === star).length);
    res.json({
      average,
      total: reviews.length,
      counts,
      mine: reviews.find((r) => r.userId === req.userId) ?? null,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        updatedAt: r.updatedAt,
        author: displayName(r.user),
        isMine: r.userId === req.userId,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// PUT /api/feedback/reviews/mine – vytvořit nebo upravit vlastní recenzi
router.put('/reviews/mine', writeLimiter, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Hodnocení musí být 1 až 5 hvězdiček.' });
    }
    const text = cleanText(req.body.text, 2000) || null;
    const review = await prisma.review.upsert({
      where: { userId: req.userId },
      create: { rating, text, userId: req.userId },
      update: { rating, text },
    });
    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// DELETE /api/feedback/reviews/mine – smazat vlastní recenzi
router.delete('/reviews/mine', async (req, res) => {
  try {
    await prisma.review.deleteMany({ where: { userId: req.userId } });
    res.json({ message: 'Recenze smazána.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

module.exports = router;
