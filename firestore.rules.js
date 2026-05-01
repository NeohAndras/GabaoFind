rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Listings: public read, admin write
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null && 
                   request.auth.token.email == 'admin@gabaoindex.com';
      allow create: if request.auth != null &&
                    request.auth.token.email == 'admin@gabaoindex.com';
    }
    
    // Admin content: admin only
    match /site_content/{docId} {
      allow read, write: if request.auth != null &&
                         request.auth.token.email == 'admin@gabaoindex.com';
    }
    
    // Admin logs: admin only
    match /admin_logs/{logId} {
      allow read, write: if request.auth != null &&
                         request.auth.token.email == 'admin@gabaoindex.com';
    }
    
    // Block all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
