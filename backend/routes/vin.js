const express = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/vin/makes - seznam všech značek osobních aut
router.get('/makes', async (req, res) => {
  try {
    const response = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getmakesforvehicletype/car?format=json');

    if (!response.ok) {
      return res.status(502).json({ error: 'Nepodařilo se načíst seznam značek.' });
    }

    const data = await response.json();
    const makes = (data.Results || [])
      .map((r) => r.MakeName)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json(makes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/vin/models/:make - seznam modelů pro danou značku
router.get('/models/:make', async (req, res) => {
  try {
    const make = encodeURIComponent(req.params.make);
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${make}?format=json`);

    if (!response.ok) {
      return res.status(502).json({ error: 'Nepodařilo se načíst seznam modelů.' });
    }

    const data = await response.json();
    const models = (data.Results || [])
      .map((r) => r.Model_Name)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    res.json(models);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Něco se pokazilo na serveru.' });
  }
});

// GET /api/vin/:vin - dekódování VIN pomocí NHTSA vPIC API
router.get('/:vin', async (req, res) => {
  try {
    const vin = req.params.vin.trim().toUpperCase();

    if (vin.length !== 17) {
      return res.status(400).json({ error: 'VIN musí mít přesně 17 znaků.' });
    }

    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);

    if (!response.ok) {
      return res.status(502).json({ error: 'Služba pro dekódování VIN je momentálně nedostupná.' });
    }

    const data = await response.json();
    const results = data.Results || [];

    function getValue(variableName) {
      const item = results.find((r) => r.Variable === variableName);
      return item && item.Value && item.Value !== 'Not Applicable' ? item.Value : null;
    }

    const make = getValue('Make');
    const model = getValue('Model');
    const year = getValue('Model Year');

    if (!make && !model) {
      return res.status(404).json({ error: 'VIN se nepodařilo rozpoznat. Zkontroluj, zda je zadán správně.' });
    }

    res.json({
      vin,
      make: make || null,
      model: model || null,
      year: year ? Number(year) : null,
      fuelType: getValue('Fuel Type - Primary'),
      engineCylinders: getValue('Engine Number of Cylinders'),
      bodyClass: getValue('Body Class'),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dekódování VIN selhalo.' });
  }
});

module.exports = router;