// geocode.js - Batch geocode addresses using Nominatim API
const fs = require('fs');
const path = require('path');

async function geocodeAddress(address) {
  const encodedAddress = encodeURIComponent(address + ', Gabon'); // Add country for better results
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=GA&limit=1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GabaoIndex-Geocoder/1.0'
      }
    });
    const data = await response.json();
    
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } else {
      console.log(`\nNo results for: ${address}`);
      return null;
    }
  } catch (error) {
    console.error(`\nError geocoding ${address}:`, error.message);
    return null;
  }
}

function updateProgress(current, total) {
  const percentage = Math.floor((current / total) * 100);
  const barLength = 50;
  const filled = Math.floor((percentage / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  process.stdout.write(`\r[${bar}] ${percentage}% (${current}/${total})`);
}

async function geocodeListings() {
  const dataPath = path.join(__dirname, 'data.json');
  const outputPath = path.join(__dirname, 'geocoded_data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const total = data.listings.length;
  let processed = 0;
  
  console.log('Starting geocoding...');
  updateProgress(0, total);
  
  for (let i = 0; i < data.listings.length; i++) {
    const listing = data.listings[i];
    
    console.log(`\nGeocoding ${i + 1}/${data.listings.length}: ${listing.name}`);
    const coords = await geocodeAddress(listing.address);
    
    if (coords) {
      listing.lat = coords.lat;
      listing.lng = coords.lng;
      console.log(`  -> Updated: ${coords.lat}, ${coords.lng}`);
    } else {
      console.log(`  -> Failed: Keeping existing or null`);
    }
    
    processed++;
    updateProgress(processed, total);
    
    // Rate limit: 1 second delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  process.stdout.write('\n'); // Newline after progress bar
  console.log('Geocoding complete. Saved to geocoded_data.json');
  
  // Save updated data to new file
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

// Run the script
geocodeListings().catch(console.error);