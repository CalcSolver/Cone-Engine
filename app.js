import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Your CalcSolver Firebase Configuration
const firebaseConfig = {
  authDomain: "calcsolver-app.firebaseapp.com",
  projectId: "calcsolver-app",
  storageBucket: "calcsolver-app.appspot.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM UI Elements
const logEl = document.getElementById("console-log");
const statusEl = document.getElementById("status-bar");
const treeEl = document.getElementById("tree-view");
const playBtn = document.getElementById("play-btn");
const saveBtn = document.getElementById("save-btn");
const inspectorEl = document.getElementById("inspector-content");

function log(msg) { 
  if (logEl) logEl.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`; 
}

// Engine Globals
let scene, camera, renderer, orbitControls, transformControls;
let sceneObjects = [];
let selectedObject = null;
let selectionBox = null;
let currentUser = null;
let isPlaying = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Initialize 3D Viewport Engine
function initEngine() {
  const canvas = document.getElementById("viewport");
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);

  // Environment Grid & Lighting
  const grid = new THREE.GridHelper(40, 40, 0x007acc, 0x333333);
  scene.add(grid);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  // Camera Setup
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 12);

  // Renderer Setup
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Orbit Navigation Controls
  orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;

  // 3D Transform Gizmo (Highlighted Movement Arrows)
  transformControls = new THREE.TransformControls(camera, renderer.domElement);
  transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
  });
  scene.add(transformControls);

  // Object Hitbox Bounding Outline Helper
  selectionBox = new THREE.BoxHelper();
  selectionBox.material.color.setHex(0xffff00); // Yellow selection outline
  selectionBox.visible = false;
  scene.add(selectionBox);

  // Raycast Click Selection
  canvas.addEventListener('pointerdown', onPointerDown);

  // Render Loop
  function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();

    if (isPlaying) {
      sceneObjects.forEach((obj, i) => {
        obj.rotation.y += 0.01 * (i + 1);
      });
    }

    if (selectedObject) {
      selectionBox.update();
      updateInspectorValues();
    }

    renderer.render(scene, camera);
  }
  animate();
}

// Raycasting to select object, show hitboxes, and attach gizmo
function onPointerDown(event) {
  if (isPlaying) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sceneObjects, false);

  if (intersects.length > 0) {
    selectObject(intersects[0].object);
  }
}

function selectObject(obj) {
  selectedObject = obj;
  transformControls.attach(obj);
  selectionBox.setFromObject(obj);
  selectionBox.visible = true;

  updateHierarchyUI();
  updateInspectorValues();
  log(`Selected: ${obj.name}`);
}

function updateInspectorValues() {
  if (!selectedObject || !inspectorEl) return;
  inspectorEl.innerHTML = `
    <div style="font-size: 12px; line-height: 1.8;">
      <strong>Name:</strong> ${selectedObject.name}<br>
      <strong>Position X:</strong> ${selectedObject.position.x.toFixed(2)}<br>
      <strong>Position Y:</strong> ${selectedObject.position.y.toFixed(2)}<br>
      <strong>Position Z:</strong> ${selectedObject.position.z.toFixed(2)}
    </div>
  `;
}

function updateHierarchyUI() {
  if (!treeEl) return;
  treeEl.innerHTML = "";
  sceneObjects.forEach((obj) => {
    const li = document.createElement("li");
    li.className = `tree-node ${selectedObject === obj ? 'selected' : ''}`;
    li.innerText = obj.name;
    li.onclick = () => selectObject(obj);
    treeEl.appendChild(li);
  });
}

// Spawn Object Logic
const addMeshBtn = document.getElementById("add-mesh-btn");
if (addMeshBtn) {
  addMeshBtn.addEventListener("click", () => {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const material = new THREE.MeshStandardMaterial({ color: 0x007acc });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set((Math.random() - 0.5) * 6, 0.75, (Math.random() - 0.5) * 6);
    mesh.name = `Object_${sceneObjects.length + 1}`;

    scene.add(mesh);
    sceneObjects.push(mesh);

    selectObject(mesh);
    log(`Added new mesh: ${mesh.name}`);
  });
}

// Play Mode Logic
if (playBtn) {
  playBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;

    if (isPlaying) {
      playBtn.innerText = "⏹ Stop Game";
      playBtn.classList.add("playing");
      transformControls.detach();
      selectionBox.visible = false;
      if (statusEl) statusEl.textContent = "Status: Game Engine Running";
      log("Game loop started.");
    } else {
      playBtn.innerText = "▶ Play Game";
      playBtn.classList.remove("playing");
      if (selectedObject) {
        transformControls.attach(selectedObject);
        selectionBox.visible = true;
      }
      if (statusEl) statusEl.textContent = "Status: Studio Editor Active";
      log("Game loop stopped.");
    }
  });
}

// Cloud Save Logic
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    if (!currentUser) {
      log("Error: User not authenticated with Firebase.");
      return;
    }

    if (statusEl) statusEl.textContent = "Saving to Firebase...";
    const projectRef = doc(db, "users", currentUser.uid, "projects", "default_project");

    const nodesData = sceneObjects.map((obj) => ({
      name: obj.name,
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      color: obj.material.color.getHex()
    }));

    try {
      await setDoc(projectRef, { nodes: nodesData }, { merge: true });
      if (statusEl) statusEl.textContent = "Status: Cloud Saved Successfully!";
      log(`Saved ${nodesData.length} object state(s) to Firestore.`);
    } catch (err) {
      console.error(err);
      log("Save Failed: " + err.message);
      if (statusEl) statusEl.textContent = "Status: Save Error";
    }
  });
}

// Authentication & Auto-Load Collection
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    if (statusEl) statusEl.textContent = `User Logged In (${user.uid.slice(0, 5)}...)`;
    await loadProjectData(user.uid);
  } else {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      log("Auth Failed. Local engine fallback active.");
    }
  }
});

async function loadProjectData(uid) {
  const projectRef = doc(db, "users", uid, "projects", "default_project");
  try {
    const snap = await getDoc(projectRef);
    if (snap.exists() && snap.data().nodes) {
      const nodes = snap.data().nodes;
      nodes.forEach((data) => {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.5, 1.5),
          new THREE.MeshStandardMaterial({ color: data.color || 0x007acc })
        );
        mesh.name = data.name;
        mesh.position.fromArray(data.position);
        mesh.rotation.fromArray(data.rotation);
        scene.add(mesh);
        sceneObjects.push(mesh);
      });
      updateHierarchyUI();
      log("Loaded cloud project from Firestore successfully.");
    } else {
      log("No existing cloud project found. Add an object and hit Save.");
    }
  } catch (err) {
    log("Failed to load project from Firestore.");
  }
}

window.addEventListener("resize", () => {
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// Boot Engine
initEngine();
