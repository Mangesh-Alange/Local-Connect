import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// Your Firebase configuration
// IMPORTANT: Replace with actual config from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_NEW_API_KEY_HERE",
  authDomain: "localconnect-f077b.firebaseapp.com",
  projectId: "localconnect-f077b",
  storageBucket: "localconnect-f077b.firebasestorage.app",
  messagingSenderId: "717074499398",
  appId: "1:717074499398:web:ed91682d244b78c2c04747",
  measurementId: "G-LNEVQSKFH5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { db, auth, googleProvider };

/**
 * ========================================================
 * BACKEND STRUCTURE & DATABASE SCHEMA (Firestore NoSQL)
 * ========================================================
 * 
 * 1. Collection: `users`
 *    Stores authentication profiles and preferences.
 *    - uid (string) : Firebase Auth UID
 *    - name (string)
 *    - email (string)
 *    - role (enum: 'user', 'provider', 'admin')
 *    - displayPhoto (string, URL)
 *    - createdAt (Timestamp)
 * 
 * 2. Collection: `services`
 *    Stores professional provider listings.
 *    - id (auto-generated document id)
 *    - ownerUid (reference to users.uid)
 *    - businessName (string)
 *    - category (enum: 'Plumbers', 'Electricians', 'Hospitals', etc.)
 *    - description (string)
 *    - location (object) { state, city, stringified address, coordinates }
 *    - trustScore (number: 0 - 100)
 *    - rating (number: 0.0 - 5.0)
 *    - isVerified (boolean)
 *    - pricingText (string)
 *    - createdAt (Timestamp)
 * 
 * 3. Collection: `reviews`
 *    Stores user feedback for services to calculate trust scores.
 *    - id (auto-gen)
 *    - serviceId (reference to services.id)
 *    - reviewerUid (reference to users.uid)
 *    - rating (number)
 *    - text (string)
 *    - date (Timestamp)
 * 
 * 4. Collection: `analtics_events`
 *    Time-series structured data for demand/supply heatmap metrics.
 *    - id (auto-gen)
 *    - timestamp (Timestamp)
 *    - eventType (enum: 'search_plumber', 'search_electrician', etc.)
 *    - locationData (city/region string mapped for aggregation)
 * ========================================================
 */

// Example Database operations hooks (to be connected with UI later)

export const fetchServicesByCategory = async (categoryName) => {
  const q = query(collection(db, "services"), where("category", "==", categoryName));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const submitNewService = async (serviceData) => {
  const docRef = await addDoc(collection(db, "services"), {
    ...serviceData,
    trustScore: 80, // Default baseline for new non-verified users
    rating: 0,
    isVerified: false,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};
