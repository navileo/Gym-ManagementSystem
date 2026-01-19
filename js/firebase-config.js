// Firebase Configuration Template
// Replace the config object below with your actual Firebase project credentials
const firebaseConfig = { 
    apiKey: "AIzaSyC7-Jy_qZTpRJSU_w9fAY-pPCtXmZxEhpQ", 
    authDomain: "gym-management-project-98078.firebaseapp.com", 
    projectId: "gym-management-project-98078", 
    storageBucket: "gym-management-project-98078.firebasestorage.app", 
    messagingSenderId: "515064507728", 
    appId: "1:515064507728:web:4ff9de2a97c984b7d8d055", 
    measurementId: "G-82LP2S25QZ" 
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Initialize Firestore with settings to avoid connection issues in some environments
const db = firebase.firestore();
db.settings({
    experimentalForceLongPolling: true, // Forces long-polling for better compatibility
    experimentalAutoDetectLongPolling: true // Automatically switch to long-polling if needed
});

// Enable persistence for better offline/connection handling
db.enablePersistence().catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn("Firestore Persistence failed: Multiple tabs open");
    } else if (err.code == 'unimplemented') {
        console.warn("Firestore Persistence not supported by browser");
    }
});

// Connection check
db.collection('users').limit(1).get()
    .then(() => console.log("Firestore Connected successfully"))
    .catch(err => {
        console.error("Firestore Connection Error:", err);
        if (err.code === 'permission-denied') {
            console.error("Check your Firestore Security Rules! Ensure they are set to 'Test Mode' or allow reads.");
        }
    });

// Storage is disabled to avoid billing plan requirements. 
// Images are stored as Base64 strings in Firestore instead.
const storage = null;
