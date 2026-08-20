import { Engine } from './components/Engine.js';
import { AuthManager } from './components/AuthManager.js';
import { db, doc, setDoc, getDoc } from './lib/firebase.js';

const canvas = document.getElementById('render-canvas');
const engine = new Engine(canvas);

// UI Elements
const userDisplay = document.getElementById('user-display');
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const loginActionBtn = document.getElementById('login-action-btn');
const signupActionBtn = document.getElementById('signup-action-btn');

const addCubeBtn = document.getElementById('add-cube-btn');
const addSphereBtn = document.getElementById('add-sphere-btn');
const clearBtn = document.getElementById('clear-btn');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');

// Auth Setup
const authManager = new AuthManager((user) => {
  if (user) {
    userDisplay.textContent = user.email;
    authBtn.textContent = 'Logout';
  } else {
    userDisplay.textContent = 'Not logged in';
    authBtn.textContent = 'Login / Register';
  }
});

// Modal Logic
authBtn.addEventListener('click', () => {
  if (authManager.currentUser) {
    authManager.logout();
  } else {
    authModal.classList.remove('hidden');
  }
});

closeModal.addEventListener('click', () => authModal.classList.add('hidden'));

loginActionBtn.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  try {
    await authManager.login(email, password);
    authModal.classList.add('hidden');
  } catch (err) {
    alert(err.message);
  }
});

signupActionBtn.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  try {
    await authManager.signUp(email, password);
    authModal.classList.add('hidden');
  } catch (err) {
    alert(err.message);
  }
});

// Engine Action Bindings
addCubeBtn.addEventListener('click', () => engine.addCube());
addSphereBtn.addEventListener('click', () => engine.addSphere());
clearBtn.addEventListener('click', () => engine.clear());

// Save & Load to Firebase Firestore
saveBtn.addEventListener('click', async () => {
  if (!authManager.currentUser) {
    alert('Please log in to save your world!');
    return;
  }
  const worldData = engine.exportWorldData();
  const userDocRef = doc(db, 'user_worlds', authManager.currentUser.uid);

  try {
    await setDoc(userDocRef, { world: worldData, updatedAt: new Date() });
    alert('World saved successfully!');
  } catch (err) {
    alert('Failed to save: ' + err.message);
  }
});

loadBtn.addEventListener('click', async () => {
  if (!authManager.currentUser) {
    alert('Please log in to load your world!');
    return;
  }
  const userDocRef = doc(db, 'user_worlds', authManager.currentUser.uid);

  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      engine.importWorldData(docSnap.data().world);
      alert('World loaded successfully!');
    } else {
      alert('No saved world found.');
    }
  } catch (err) {
    alert('Failed to load: ' + err.message);
  }
});
