import { Engine } from './components/Engine.js';
import { CharacterBuilder } from './components/CharacterBuilder.js';
import { AuthManager } from './components/AuthManager.js';
import { 
  db, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where 
} from './lib/firebase.js';

// Global Project State
let activeProjectId = null;
let activeProjectTitle = "Untitled Project";

// DOM References
const authGate = document.getElementById('auth-gate');
const app = document.getElementById('app');
const emailInput = document.getElementById('email-input');
const passInput = document.getElementById('pass-input');
const emailLoginBtn = document.getElementById('email-login-btn');
const emailSignupBtn = document.getElementById('email-signup-btn');
const googleLoginBtn = document.getElementById('google-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userDisplay = document.getElementById('user-display');
const activeProjectBadge = document.getElementById('active-project-badge');

const inspectorPanel = document.getElementById('inspector-panel');
const inspectType = document.getElementById('inspect-type');
const inspectColor = document.getElementById('inspect-color');
const scaleX = document.getElementById('scale-x');
const scaleY = document.getElementById('scale-y');
const scaleZ = document.getElementById('scale-z');

const charInspectorPanel = document.getElementById('char-inspector-panel');
const charInspectColor = document.getElementById('char-inspect-color');

// Initialize 3D Engines
const renderCanvas = document.getElementById('render-canvas');
const mainEngine = new Engine(renderCanvas, (selected) => {
  if (selected) {
    inspectorPanel.classList.remove('hidden');
    inspectType.textContent = selected.type;
    inspectColor.value = selected.color || '#6366f1';
    scaleX.value = selected.mesh.scale.x;
    scaleY.value = selected.mesh.scale.y;
    scaleZ.value = selected.mesh.scale.z;
    renderObjectFrameList(selected);
  } else {
    inspectorPanel.classList.add('hidden');
    document.getElementById('frame-list').innerHTML = '';
  }
});

const charCanvas = document.getElementById('character-canvas');
const charBuilder = new CharacterBuilder(charCanvas, (selectedPart) => {
  if (selectedPart) {
    charInspectorPanel.classList.remove('hidden');
    if (selectedPart.material && selectedPart.material.color) {
      charInspectColor.value = '#' + selectedPart.material.color.getHexString();
    }
  } else {
    charInspectorPanel.classList.add('hidden');
  }
});

const playerCanvas = document.getElementById('player-canvas');
const playerEngine = new Engine(playerCanvas, null);

// Inspector Interactions
inspectColor.addEventListener('input', (e) => {
  if (!mainEngine.selectedObject) return;
  const col = e.target.value;
  mainEngine.selectedObject.color = col;
  if (mainEngine.selectedObject.mesh.material) {
    mainEngine.selectedObject.mesh.material.color.set(col);
  }
});

[scaleX, scaleY, scaleZ].forEach((input, idx) => {
  input.addEventListener('input', () => {
    if (!mainEngine.selectedObject) return;
    const val = parseFloat(input.value) || 1;
    if (idx === 0) mainEngine.selectedObject.mesh.scale.x = val;
    if (idx === 1) mainEngine.selectedObject.mesh.scale.y = val;
    if (idx === 2) mainEngine.selectedObject.mesh.scale.z = val;
  });
});

document.getElementById('resize-btn').addEventListener('click', () => {
  if (!mainEngine.selectedObject) return;
  mainEngine.selectedObject.mesh.scale.multiplyScalar(1.5);
  scaleX.value = mainEngine.selectedObject.mesh.scale.x;
  scaleY.value = mainEngine.selectedObject.mesh.scale.y;
  scaleZ.value = mainEngine.selectedObject.mesh.scale.z;
});

document.getElementById('delete-selected-btn').addEventListener('click', () => mainEngine.deleteSelected());

// Character Inspector Interactions
charInspectColor.addEventListener('input', (e) => {
  if (charBuilder.selectedPart && charBuilder.selectedPart.material) {
    charBuilder.selectedPart.material.color.set(e.target.value);
  }
});

document.getElementById('char-delete-part').addEventListener('click', () => charBuilder.deleteSelectedPart());

// Authentication
const authManager = new AuthManager((user) => {
  if (user) {
    authGate.classList.add('hidden');
    app.classList.remove('hidden');
    userDisplay.textContent = user.email || user.displayName;
    loadUserProjects();
  } else {
    authGate.classList.remove('hidden');
    app.classList.add('hidden');
  }
});

emailLoginBtn.addEventListener('click', async () => {
  try { await authManager.login(emailInput.value, passInput.value); } catch (e) { alert(e.message); }
});

emailSignupBtn.addEventListener('click', async () => {
  try { await authManager.signUp(emailInput.value, passInput.value); } catch (e) { alert(e.message); }
});

googleLoginBtn.addEventListener('click', async () => {
  try { await authManager.loginWithGoogle(); } catch (e) { alert(e.message); }
});

logoutBtn.addEventListener('click', () => authManager.logout());

// Tab Switching
const tabs = {
  'tab-projects': 'view-projects',
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
      if (tabId === 'tab-projects') loadUserProjects();
    }, 50);
  });
});

// Object Spawning
document.getElementById('add-cube-btn').addEventListener('click', () => mainEngine.addCube());
document.getElementById('add-sphere-btn').addEventListener('click', () => mainEngine.addSphere());
document.getElementById('add-npc-btn').addEventListener('click', () => mainEngine.addNPC());

// Per-Object Keyframe Timeline Controls
const frameList = document.getElementById('frame-list');

function renderObjectFrameList(obj) {
  frameList.innerHTML = '';
  obj.keyframes.forEach((_, idx) => {
    const item = document.createElement('div');
    item.className = 'frame-item';
    item.innerHTML = `<span>Frame #${idx + 1}</span><small>Saved</small>`;
    frameList.appendChild(item);
  });
}

document.getElementById('add-frame-btn').addEventListener('click', () => {
  if (!mainEngine.selectedObject) {
    alert('Select an object first to add a frame for it!');
    return;
  }
  mainEngine.captureObjectKeyframe();
  renderObjectFrameList(mainEngine.selectedObject);
});

document.getElementById('play-anim-btn').addEventListener('click', () => {
  if (!mainEngine.selectedObject) {
    alert('Select an object first to play its animation!');
    return;
  }
  mainEngine.toggleObjectAnimation();
});

// Character Timeline Controls
const charFrameList = document.getElementById('char-frame-list');
document.getElementById('char-add-frame-btn').addEventListener('click', () => {
  const count = charBuilder.capturePoseKeyframe();
  const item = document.createElement('div');
  item.className = 'frame-item';
  item.innerHTML = `<span>Pose Frame #${count}</span><small>Saved</small>`;
  charFrameList.appendChild(item);
});

document.getElementById('char-play-anim-btn').addEventListener('click', () => charBuilder.togglePoseAnimation());

// Projects System (Firestore)
const projectsGrid = document.getElementById('projects-grid');

async function loadUserProjects() {
  if (!authManager.currentUser) return;
  projectsGrid.innerHTML = '<p style="color:#94a3b8">Loading projects...</p>';

  try {
    const q = query(collection(db, 'projects'), where('uid', '==', authManager.currentUser.uid));
    const snap = await getDocs(q);
    projectsGrid.innerHTML = '';

    if (snap.empty) {
      projectsGrid.innerHTML = '<p style="color:#94a3b8">No projects created yet. Click "+ New Project" to start!</p>';
      return;
    }

    snap.forEach((docSnap) => {
      const p = docSnap.data();
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <h4>${p.title}</h4>
        <p>Last edited: ${new Date(p.updatedAt?.toDate ? p.updatedAt.toDate() : p.updatedAt).toLocaleDateString()}</p>
        <div class="project-actions">
          <button class="btn primary small open-btn">Open Editor</button>
          <button class="btn danger small del-btn">Delete</button>
        </div>
      `;

      card.querySelector('.open-btn').addEventListener('click', () => openProject(docSnap.id, p.title, p.scene));
      card.querySelector('.del-btn').addEventListener('click', async () => {
        if (confirm(`Delete project "${p.title}"?`)) {
          await deleteDoc(doc(db, 'projects', docSnap.id));
          loadUserProjects();
        }
      });

      projectsGrid.appendChild(card);
    });
  } catch (err) {
    projectsGrid.innerHTML = '<p style="color:#ef4444">Error loading projects.</p>';
  }
}

document.getElementById('create-project-btn').addEventListener('click', async () => {
  const title = prompt('Project Name:');
  if (!title) return;

  const docRef = await addDoc(collection(db, 'projects'), {
    uid: authManager.currentUser.uid,
    title,
    scene: mainEngine.exportSceneData(),
    updatedAt: new Date()
  });

  openProject(docRef.id, title, mainEngine.exportSceneData());
});

function openProject(id, title, sceneData) {
  activeProjectId = id;
  activeProjectTitle = title;
  activeProjectBadge.textContent = title;

  mainEngine.importSceneData(sceneData);

  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.workspace-view').forEach((v) => v.classList.remove('active'));
  document.getElementById('tab-editor').classList.add('active');
  document.getElementById('view-editor').classList.add('active');

  setTimeout(() => mainEngine.onResize(), 50);
}

// Active Project Cloud Save & Publish
document.getElementById('save-scene-btn').addEventListener('click', async () => {
  if (!activeProjectId) {
    alert('Please create or open a project first in the "My Projects" tab!');
    return;
  }
  await setDoc(doc(db, 'projects', activeProjectId), {
    uid: authManager.currentUser.uid,
    title: activeProjectTitle,
    scene: mainEngine.exportSceneData(),
    updatedAt: new Date()
  }, { merge: true });

  alert(`Project "${activeProjectTitle}" saved successfully!`);
});

document.getElementById('publish-game-btn').addEventListener('click', async () => {
  if (!activeProjectId) {
    alert('Open a project before publishing!');
    return;
  }
  await addDoc(collection(db, 'community_games'), {
    title: activeProjectTitle,
    author: authManager.currentUser.email || 'Anonymous',
    scene: mainEngine.exportSceneData(),
    createdAt: new Date()
  });
  alert(`"${activeProjectTitle}" has been published to the community catalog!`);
});

// Community Catalog Load
const gamesList = document.getElementById('games-list');
async function loadCommunityGames() {
  gamesList.innerHTML = '<small style="color:#94a3b8">Loading catalog...</small>';
  try {
    const querySnapshot = await getDocs(collection(db, 'community_games'));
    gamesList.innerHTML = '';

    if (querySnapshot.empty) {
      gamesList.innerHTML = '<small style="color:#94a3b8">No community games found.</small>';
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

// Character Assembly
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
