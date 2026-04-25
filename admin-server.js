// admin-server.js - Simple backend for admin panel to save data
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

const dataPath = path.join(__dirname, 'data.json');

// Load data
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save data
app.post('/api/data', (req, res) => {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Geocode addresses (Nominatim)
app.post('/api/geocode', async (req, res) => {
  const { addresses } = req.body;
  const results = [];
  
  for (const address of addresses) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Gabon')}&countrycodes=GA&limit=1`;
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'GabaoIndex-Admin/1.0' } });
      const data = await response.json();
      if (data.length > 0) {
        results.push({ address, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        results.push({ address, error: 'Not found' });
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    } catch (error) {
      results.push({ address, error: error.message });
    }
  }
  
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`🌿 GabaoIndex Admin Server running on http://localhost:${PORT}/admin.html`);
});