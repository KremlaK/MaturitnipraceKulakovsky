const rateLimit = require('express-rate-limit');

const message = (text) => ({ error: text });

// Obecný limit na celé API – brzda proti zahlcení serveru z jedné IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Příliš mnoho požadavků. Zpomal prosím.'),
});

// Přihlášení: 10 neúspěšných pokusů na IP za 15 minut (úspěšné se nepočítají)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Moc neúspěšných pokusů o přihlášení. Zkus to znovu za 15 minut.'),
});

// Registrace, e-maily, obnova a změna hesla: 10 za hodinu na IP
const accountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: message('Příliš mnoho požadavků. Zkus to prosím za hodinu.'),
});

module.exports = { apiLimiter, loginLimiter, accountLimiter };
