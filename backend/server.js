const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 5000;
const carRoutes = require('./routes/cars');
const serviceRoutes = require('./routes/service');
const fuelRoutes = require('./routes/fuel');
const expenseRoutes = require('./routes/expenses');
const statsRoutes = require('./routes/stats');
const dashboardRoutes = require('./routes/dashboard');

//Middleware
app.use(cors());
app.use(express.json());

// Testovací endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server běží' });
})
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/cars', serviceRoutes);
app.use('/api/cars', fuelRoutes);
app.use('/api/cars', expenseRoutes);
app.use('/api/cars', statsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.listen(PORT, () => {
     console.log(`Server běží na http://localhost:${PORT}`);
})