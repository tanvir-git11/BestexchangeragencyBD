/**
 * Firebase Configuration & Initialization
 * Dollar Exchange Bangladesh
 * 
 * IMPORTANT: Replace the firebaseConfig values below with your actual
 * Firebase project credentials from the Firebase Console.
 * https://console.firebase.google.com → Project Settings → General → Your Apps
 */

// ========== REPLACE WITH YOUR FIREBASE CONFIG ==========
const firebaseConfig = {
  apiKey: "AIzaSyAii3Cv7Xj0rXVhnWW_MZ4KT4Aw9n_2j6A",
  authDomain: "doller-f4f3a.firebaseapp.com",
  databaseURL: "https://doller-f4f3a-default-rtdb.firebaseio.com",
  projectId: "doller-f4f3a",
  storageBucket: "doller-f4f3a.firebasestorage.app",
  messagingSenderId: "535401057799",
  appId: "1:535401057799:web:f152b78a6ea2141c14a4a2",
  measurementId: "G-XTM68QSCTG"
};
// ========================================================

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
// const storage = firebase.storage(); // Storage not used, images uploaded to Telegram instead

// Set Firestore settings for performance
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not available in this browser.');
  }
});

console.log('[Firebase] Initialized successfully.');
