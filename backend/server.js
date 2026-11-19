const config = require('./config'); // jako první: načte .env a zkontroluje konfiguraci
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const cron = require('node-cron');
const { checkReminders } = require('./jobs/reminderCheck');
const { apiLimiter } = require('./middleware/rateLimits');

const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const serviceRoutes = require('./routes/service');
const fuelRoutes = require('./routes/fuel');
const expenseRoutes = require('./routes/expenses');
const reminderRoutes = require('./routes/reminders');
const uploadRoutes = require('./routes/upload');
const dashboardRoutes = require('./routes/dashboard');
const statsRoutes = require('./routes/stats');
const photoRoutes = require('./routes/photos');
const exportRoutes = require('./routes/export');
const shareRoutes = require('./routes/shares');
const vinRoutes = require('./routes/vin');
const mapRoutes = require('./routes/map');
const stationRoutes = require('./routes/stations');
const feedbackRoutes = require('./routes/feedback');

const app = express();

app.set('trust proxy', config.trustProxy);

// Bezpečnostní hlavičky (API vrací jen JSON a soubory, nic se tu nevykresluje)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));

// CORS jen pro náš frontend (FRONTEND_URL), ne pro libovolný web
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/cars', serviceRoutes);
app.use('/api/cars', fuelRoutes);
app.use('/api/cars', expenseRoutes);
app.use('/api/cars', reminderRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cars', statsRoutes);
app.use('/api/cars', photoRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/cars', exportRoutes);
app.use('/api/cars', shareRoutes);
app.use('/api/shares', shareRoutes);
app.use('/api/vin', vinRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/feedback', feedbackRoutes);

// Neznámá adresa API
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Tahle adresa API neexistuje.' });
});

// Jednotné zpracování chyb – klient nikdy nedostane výpis chyby ani detaily serveru
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const text = err.code === 'LIMIT_FILE_SIZE' ? 'Soubor je moc velký (max. 10 MB).' : 'Soubor se nepodařilo nahrát.';
    return res.status(400).json({ error: text });
  }
  if (err?.message?.startsWith('Nepovolený typ souboru')) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Neplatná data v požadavku.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Požadavek je moc velký.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
});

app.listen(config.port, () => {
  console.log(`Server běží na portu ${config.port}${config.isProd ? ' (produkce)' : ''}`);
});

cron.schedule('0 8 * * *', () => {
  return checkReminders().catch((error) => console.error('Kontrola připomínek selhala:', error));
});
