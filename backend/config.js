// Kontrola konfigurace při startu: server bez povinných proměnných vůbec nenaběhne,
// místo aby spadl až při prvním požadavku (nebo běžel s nebezpečným nastavením).
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';
const errors = [];
const warnings = [];

const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) {
  errors.push('JWT_SECRET musí mít aspoň 32 znaků (vygeneruj: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))").');
} else if (/replace|change|secret|example/i.test(jwtSecret)) {
  (isProd ? errors : warnings).push('JWT_SECRET vypadá jako ukázková hodnota – nastav vlastní náhodný klíč.');
}
if (!process.env.DATABASE_URL) errors.push('Chybí DATABASE_URL.');

if (isProd) {
  if (!process.env.FRONTEND_URL || !process.env.FRONTEND_URL.startsWith('https://')) {
    errors.push('V produkci musí být FRONTEND_URL nastavená a začínat https://.');
  }
  if (!process.env.RESEND_API_KEY) warnings.push('Chybí RESEND_API_KEY – e-maily (ověření, obnova hesla, připomínky) nebudou chodit.');
}
if (!process.env.CLOUDINARY_API_SECRET) warnings.push('Chybí Cloudinary – nahrávání fotek a faktur nebude fungovat.');

for (const w of warnings) console.warn(`[konfigurace] Upozornění: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`[konfigurace] Chyba: ${e}`);
  console.error('[konfigurace] Server se nespustí. Oprav proměnné v backend/.env (vzor: backend/.env.example).');
  process.exit(1);
}

// FRONTEND_URL může obsahovat víc adres oddělených čárkou
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
// Při vývoji je localhost a 127.0.0.1 totéž – povolíme obě podoby
if (!isProd) {
  for (const origin of [...allowedOrigins]) {
    if (origin.includes('://localhost')) allowedOrigins.push(origin.replace('://localhost', '://127.0.0.1'));
  }
}

// Za reverzní proxy (Apache, nginx) nastav TRUST_PROXY=1, aby limity viděly skutečné IP uživatelů
const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false;

module.exports = { isProd, allowedOrigins, trustProxy, port: Number(process.env.PORT) || 5000 };
