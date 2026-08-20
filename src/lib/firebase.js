import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  addDoc,
  getDocs
} from 'firebase/firestore';

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

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs
};
