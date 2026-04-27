// scripts/import-data.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import { firebaseConfig } from '../firebase-config.js';

// Re-init app for Node.js environment
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importListings() {
  try {
    // Load your existing data.json
    const dataRaw = await readFile('./data.json', 'utf-8');
    const listings = JSON.parse(dataRaw);
    
    const listingsRef = collection(db, 'listings');
    let success = 0;
    
    console.log(`🚀 Starting import of ${listings.length} listings...`);
    
    for (const [index, item] of listings.entries()) {
      try {
        await addDoc(listingsRef, {
          name: item.name || '',
          category: item.category || 'Other',
          location: item.location || '',
          address: item.address || '',
          phone: item.phone || '',
          email: item.email || '',
          website: item.website || '',
          description: item.description || '',
          coordinates: item.coordinates ? {
            lat: parseFloat(item.coordinates.lat),
            lng: parseFloat(item.coordinates.lng)
          } : null,
          images: item.images || [],
          verified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Preserve original ID if exists
          legacyId: item.id || null
        });
        success++;
        
        // Progress log every 50 items
        if ((index + 1) % 50 === 0) {
          console.log(`✅ Imported ${index + 1}/${listings.length}...`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err) {
        console.error(`❌ Failed to import "${item.name}":`, err.message);
      }
    }
    
    console.log(`\n🎉 Import complete! ${success}/${listings.length} listings added.`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importListings();
}

export { importListings };