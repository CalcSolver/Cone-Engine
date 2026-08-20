import { Engine } from './components/Engine.js';
import { CharacterBuilder } from './components/CharacterBuilder.js';
import { AuthManager } from './components/AuthManager.js';
import { db, doc, setDoc, getDoc, collection, addDoc, getDocs } from './lib/firebase.js';

// DOM Elements
const authGate = document.getElementById('auth-gate');
const app = document.getElementById('app');
const emailInput = document.getElementById('email-input');
const passInput = document.getElementById('pass-input');
const emailLoginBtn = document.getElementById('email-login-btn');
const emailSignupBtn = document.getElementById('email-signup-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');

// Initialize Engines
const renderCanvas = document.getElementById('render-canvas');
const mainEngine = new Engine(renderCanvas);

const charCanvas = document.getElementById('character-canvas');
const charBuilder = new CharacterBuilder(charCanvas);

const playerCanvas = document.getElementById('player-canvas');
const playerEngine = new Engine(playerCanvas);

// Auth Setup
const authManager = new AuthManager((user) => {
  if (user) {
    authGate.classList.add('hidden');
    app.classList.remove('hidden');
    userDisplay.textContent = user.email || user.displayName;
    mainEngine.onResize();
  } else {
    authGate.classList.remove('hidden');
    app.classList.add('hidden');
  }
});

// Auth Event Listeners
emailLoginBtn.addEventListener('click', async () => {
  try {
    await authManager.login(emailInput.value, passInput.value);
  } catch (err) { alert(err.message); }
});

emailSignupBtn.addEventListener('click', async () => {
  try {
    await authManager.signUp(emailInput.value, passInput.value);
  } catch (err) { alert(err.message); }
});

googleLoginBtn.addEventListener('click', async () => {
  try {
    await authManager.loginWithGoogle();
  } catch (err) { alert(err.message); }
});

logoutBtn.addEventListener('click', () => authManager.logout());

// Tab Switching Navigation
const tabs = {
  'tab-editor': 'view-editor',
  'tab-character': 'view-character',
  'tab-community': 'view-community'
};

Object.keys(tabs).forEach((tabId) => {
  document.getElementById(tabId).addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.workspace-view').forEach((v) => v.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabs[tabId]).classList.add('active');

    mainEngine.onResize();
    charBuilder.renderer.setSize(charCanvas.parentElement.clientWidth, charCanvas.parentElement.clientHeight);
    playerEngine.onResize();
  });
});

// Scene Editor Bindings
document.getElementById('add-cube-btn').addEventListener('click', () => mainEngine.addCube());
document.getElementById('add-sphere-btn').addEventListener('click', () => mainEngine.addSphere());
document.getElementById('add-npc-btn').addEventListener('click', () => mainEngine.addNPC());

const frameList = document.getElementById('frame-list');
document.getElementById('add-frame-btn').addEventListener('click', () => {
  const count = mainEngine.captureKeyframe();
  const item = document.createElement('div');
  item.className = 'frame-item';
  item.textContent = `Frame #${count}`;
  frameList.appendChild(item);
});

document.getElementById('play-anim-btn').addEventListener('click', () => mainEngine.playAnimation());

// Active Save System
document.getElementById('save-scene-btn').addEventListener('click', async () => {
  if (!authManager.currentUser) return;
  const data = mainEngine.exportSceneData();
  await setDoc(doc(db, 'user_projects', authManager.currentUser.uid), {
    scene: data,
    updatedAt: new Date()
  });
  alert('Project saved successfully to Firestore!');
});

// Community Games Publishing & Loading
document.getElementById('publish-game-btn').addEventListener('click', async () => {
  const title = prompt('Enter a title for your game:');
  if (!title) return;
  
  await addDoc(collection(db, 'community_games'), {
    title,
    author: authManager.currentUser.email,
    scene: mainEngine.exportSceneData(),
    createdAt: new Date()
  });
  alert('Game published to the community catalog!');
});

const gamesList = document.getElementById('games-list');
const refreshBtn = document.getElementById('refresh-games-btn');

async function loadCommunityGames() {
  gamesList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, 'community_games'));
  querySnapshot.forEach((docSnap) => {
    const game = docSnap.data();
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `<strong>${game.title}</strong><br><small>by ${game.author}</small>`;
    card.addEventListener('click', () => {
      document.getElementById('playing-title').textContent = game.title;
      playerEngine.importSceneData(game.scene);
    });
    gamesList.appendChild(card);
  });
}

refreshBtn.addEventListener('click', loadCommunityGames);

// Character Builder Controls
document.getElementById('char-add-nose').addEventListener('click', () => charBuilder.addNose());
document.getElementById('char-add-eye').addEventListener('click', () => charBuilder.addEye());
document.getElementById('char-reset').addEventListener('click', () => charBuilder.reset());
