import { Engine } from './components/Engine.js';
import { CharacterBuilder } from './components/CharacterBuilder.js';
import { AuthManager } from './components/AuthManager.js';
import { db, doc, setDoc, collection, addDoc, getDocs } from './lib/firebase.js';

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

const inspectorPanel = document.getElementById('inspector-panel');
const inspectType = document.getElementById('inspect-type');
const posX = document.getElementById('pos-x');
const posY = document.getElementById('pos-y');
const posZ = document.getElementById('pos-z');

// Engines Initialization
const renderCanvas = document.getElementById('render-canvas');
const mainEngine = new Engine(renderCanvas, (selected) => {
  if (selected) {
    inspectorPanel.classList.remove('hidden');
    inspectType.textContent = selected.type;
    posX.value = selected.mesh.position.x.toFixed(2);
    posY.value = selected.mesh.position.y.toFixed(2);
    posZ.value = selected.mesh.position.z.toFixed(2);
  } else {
    inspectorPanel.classList.add('hidden');
  }
});

const charCanvas = document.getElementById('character-canvas');
const charBuilder = new CharacterBuilder(charCanvas);

const playerCanvas = document.getElementById('player-canvas');
const playerEngine = new Engine(playerCanvas, null);

// Inspector Inputs Bindings
[posX, posY, posZ].forEach((input, idx) => {
  input.addEventListener('input', () => {
    if (!mainEngine.selectedObject) return;
    const val = parseFloat(input.value) || 0;
    if (idx === 0) mainEngine.selectedObject.mesh.position.x = val;
    if (idx === 1) mainEngine.selectedObject.mesh.position.y = val;
    if (idx === 2) mainEngine.selectedObject.mesh.position.z = val;
  });
});

document.getElementById('delete-selected-btn').addEventListener('click', () => {
  mainEngine.deleteSelected();
});

// Auth Setup
const authManager = new AuthManager((user) => {
  if (user) {
    authGate.classList.add('hidden');
    app.classList.remove('hidden');
    userDisplay.textContent = user.email || user.displayName;
    setTimeout(() => mainEngine.onResize(), 100);
  } else {
    authGate.classList.remove('hidden');
    app.classList.add('hidden');
  }
});

emailLoginBtn.addEventListener('click', async () => {
  try { await authManager.login(emailInput.value, passInput.value); } 
  catch (err) { alert(err.message); }
});

emailSignupBtn.addEventListener('click', async () => {
  try { await authManager.signUp(emailInput.value, passInput.value); } 
  catch (err) { alert(err.message); }
});

googleLoginBtn.addEventListener('click', async () => {
  try { await authManager.loginWithGoogle(); } 
  catch (err) { alert(err.message); }
});

logoutBtn.addEventListener('click', () => authManager.logout());

// Tab Navigation
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

    setTimeout(() => {
      mainEngine.onResize();
      charBuilder.onResize();
      playerEngine.onResize();
      if (tabId === 'tab-community') loadCommunityGames();
    }, 50);
  });
});

// Object Spawner Bindings
document.getElementById('add-cube-btn').addEventListener('click', () => mainEngine.addCube());
document.getElementById('add-sphere-btn').addEventListener('click', () => mainEngine.addSphere());
document.getElementById('add-npc-btn').addEventListener('click', () => mainEngine.addNPC());

// Keyframe Timeline
const frameList = document.getElementById('frame-list');
document.getElementById('add-frame-btn').addEventListener('click', () => {
  const count = mainEngine.captureKeyframe();
  const item = document.createElement('div');
  item.className = 'frame-item';
  item.innerHTML = `<span>Frame #${count}</span><small>Saved</small>`;
  frameList.appendChild(item);
});

document.getElementById('play-anim-btn').addEventListener('click', () => mainEngine.playAnimation());

// Persistence
document.getElementById('save-scene-btn').addEventListener('click', async () => {
  if (!authManager.currentUser) return;
  const data = mainEngine.exportSceneData();
  await setDoc(doc(db, 'user_projects', authManager.currentUser.uid), {
    scene: data,
    updatedAt: new Date()
  });
  alert('Project saved successfully to Firestore!');
});

// Community Catalog
document.getElementById('publish-game-btn').addEventListener('click', async () => {
  const title = prompt('Enter a title for your game:');
  if (!title) return;
  
  try {
    await addDoc(collection(db, 'community_games'), {
      title,
      author: authManager.currentUser.email || 'Anonymous',
      scene: mainEngine.exportSceneData(),
      createdAt: new Date()
    });
    alert('Game successfully published to the community catalog!');
  } catch (err) {
    alert('Publish failed: ' + err.message);
  }
});

const gamesList = document.getElementById('games-list');
async function loadCommunityGames() {
  gamesList.innerHTML = '<small style="color:#94a3b8">Loading games...</small>';
  try {
    const querySnapshot = await getDocs(collection(db, 'community_games'));
    gamesList.innerHTML = '';
    
    if (querySnapshot.empty) {
      gamesList.innerHTML = '<small style="color:#94a3b8">No published games found.</small>';
      return;
    }

    querySnapshot.forEach((docSnap) => {
      const game = docSnap.data();
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `<strong>${game.title}</strong><br><small style="color:#94a3b8">by ${game.author}</small>`;
      card.addEventListener('click', () => {
        document.getElementById('playing-title').textContent = game.title;
        playerEngine.importSceneData(game.scene);
      });
      gamesList.appendChild(card);
    });
  } catch (err) {
    gamesList.innerHTML = '<small style="color:#ef4444">Error loading catalog.</small>';
  }
}

document.getElementById('refresh-games-btn').addEventListener('click', loadCommunityGames);

// Character Builder Attachments
document.getElementById('char-add-nose').addEventListener('click', () => charBuilder.addNose());
document.getElementById('char-add-eye').addEventListener('click', () => charBuilder.addEye());
document.getElementById('char-add-hat').addEventListener('click', () => charBuilder.addHat());
document.getElementById('char-add-arm').addEventListener('click', () => charBuilder.addArm());
document.getElementById('char-reset').addEventListener('click', () => charBuilder.reset());

window.addEventListener('resize', () => {
  mainEngine.onResize();
  charBuilder.onResize();
  playerEngine.onResize();
});
