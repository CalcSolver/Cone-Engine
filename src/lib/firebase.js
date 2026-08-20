import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCzsTF-kiR_jCOJMLfonV6BNemreeT7v-g",
  authDomain: "cone-engine.firebaseapp.com",
  projectId: "cone-engine",
  storageBucket: "cone-engine.firebasestorage.app",
  messagingSenderId: "733009087130",
  appId: "1:733009087130:web:a097a8ab7285a2058bed23",
  measurementId: "G-MF9Q67FKHJ"
};

const app = initializeApp(firebaseConfig);

// Initialize Analytics (safely handles SSR or non-browser environments)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Core Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
};
