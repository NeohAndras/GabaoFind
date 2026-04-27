// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCnev6qdlNhgm4_WKPL1n5erz_C15H7JaI",
  authDomain: "gabaoindex.firebaseapp.com",
  projectId: "gabaoindex",
  storageBucket: "gabaoindex.appspot.com",
  messagingSenderId: "120284081903",
  appId: "1:120284081903:web:27d8a1e474f9a41e1ff51a"
  measurementId: "G-PELRPTFZZG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence for PWA
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Multiple tabs open – persistence limited');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Browser doesn\'t support offline persistence');
  }
});

export { app };