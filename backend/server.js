const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const app = express();
const PORT = process.env.PORT || 5000;
const carRoutes = require('./routes/cars');

//Middleware
app.use(cors());
app.use(express.json());

// Testovací endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server běží' });
})
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.listen(PORT, () => {
     console.log(`Server běží na http://localhost:${PORT}`);
})