const express = require('express');
const cors = require('cors');
require('dotenv').config();

const cron = require('node-cron');
const { checkReminders } = require('./jobs/reminderCheck');

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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server běží!' });
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

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});

cron.schedule('0 8 * * *', () => {
  return checkReminders().catch((error) => console.error('Kontrola připomínek selhala:', error));
});