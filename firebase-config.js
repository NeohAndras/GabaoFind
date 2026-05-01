// firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCnev6qdlNhgm4_WKPL1n5erz_C15H7JaI",
  authDomain: "gabaoindex.firebaseapp.com",
  projectId: "gabaoindex",
  storageBucket: "gabaoindex.appspot.com",
  messagingSenderId: "120284081903",
  appId: "1:120284081903:web:27d8a1e474f9a41e1ff51a",
  measurementId: "G-PELRPTFZZG", //
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Lazy loading is handled at the component level with loading="lazy" on images.

export { app };
