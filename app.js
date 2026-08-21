import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// CalcSolver Firebase Config
const firebaseConfig = {
  authDomain: "calcsolver-app.firebaseapp.com",
  projectId: "calcsolver-app",
  storageBucket: "calcsolver-app.appspot.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Globals
let scene, camera, renderer, orbitControls, transformControls;
let sceneObjects = [];
let selectedObject = null;
let selectionBox = null;
let isPlaying = false;
let currentUser = null;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function initEngine() {
  const canvas = document.getElementById("viewport");
  scene = new THREE.Scene();
  
  scene.background = new THREE.Color(0x0e0e11);
  scene.fog = new THREE.FogExp2(0x0e0e11, 0.03);

  const gridHelper = new THREE.GridHelper(60, 60, 0x007acc, 0x22222a);
  scene.add(gridHelper);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(10, 20, 15);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x007acc, 1.5, 30);
  fillLight.position.set(-10, 8, -10);
  scene.add(fillLight);

  const ambientLight = new THREE.AmbientLight(0x1a1a24, 1.0);
  scene.add(ambientLight);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 8, 14);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;

  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.addEventListener('dragging-changed', (e) => { orbitControls.enabled = !e.value; });
  scene.add(transformControls);

  selectionBox = new THREE.BoxHelper();
  selectionBox.material.color.setHex(0x00ffcc);
  selectionBox.visible = false;
  scene.add(selectionBox);

  canvas.addEventListener('pointerdown', onPointerDown);

  spawnHeroMesh();

  function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();

    if (isPlaying) {
      sceneObjects.forEach(obj => { obj.rotation.y += 0.01; });
    }

    if (selectedObject) {
      selectionBox.update();
    }

    renderer.render(scene, camera);
  }
  animate();
}

function spawnHeroMesh() {
  const group = new THREE.Group();
  group.name = "Hero_Character_Node";

  const baseGeo = new THREE.CylinderGeometry(2, 2.2, 0.4, 32);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f1f2e, roughness: 0.3, metalness: 0.8 });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.2;
  group.add(base);

  const coreGeo = new THREE.IcosahedronGeometry(1, 2);
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x007acc, roughness: 0.1, metalness: 0.9, wireframe: true });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 1.8;
  group.add(core);

  scene.add(group);
  sceneObjects.push(group);
  selectObject(group);
}

function onPointerDown(event) {
  if (isPlaying) return;
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sceneObjects, true);

  if (intersects.length > 0) {
    let topParent = intersects[0].object;
    while (topParent.parent && topParent.parent !== scene) {
      topParent = topParent.parent;
    }
    selectObject(topParent);
  }
}

function selectObject(obj) {
  selectedObject = obj;
  transformControls.attach(obj);
  selectionBox.setFromObject(obj);
  selectionBox.visible = true;
  updateUI();
}

function updateUI() {
  const treeEl = document.getElementById("tree-view");
  if (!treeEl) return;
  treeEl.innerHTML = "";
  sceneObjects.forEach(obj => {
    const li = document.createElement("li");
    li.className = `tree-node ${selectedObject === obj ? 'selected' : ''}`;
    li.innerText = `📦 ${obj.name}`;
    li.onclick = () => selectObject(obj);
    treeEl.appendChild(li);
  });
}

document.getElementById("add-mesh-btn")?.addEventListener("click", () => {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.6, 0.2, 64, 16),
    new THREE.MeshStandardMaterial({ color: 0x00ffcc, roughness: 0.2, metalness: 0.8 })
  );
  mesh.name = `Mesh_Node_${sceneObjects.length + 1}`;
  mesh.position.set((Math.random() - 0.5) * 6, 1.5, (Math.random() - 0.5) * 6);
  
  scene.add(mesh);
  sceneObjects.push(mesh);
  selectObject(mesh);
});

document.getElementById("play-btn")?.addEventListener("click", () => {
  isPlaying = !isPlaying;
  const playBtn = document.getElementById("play-btn");
  if (isPlaying) {
    playBtn.innerText = "⏹ Stop Runtime";
    transformControls.detach();
    selectionBox.visible = false;
  } else {
    playBtn.innerText = "▶ Play Game";
    if (selectedObject) {
      transformControls.attach(selectedObject);
      selectionBox.visible = true;
    }
  }
});

document.getElementById("save-btn")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const projectRef = doc(db, "users", currentUser.uid, "projects", "default_project");
  const payload = sceneObjects.map(obj => ({
    name: obj.name,
    position: [obj.position.x, obj.position.y, obj.position.z]
  }));
  await setDoc(projectRef, { nodes: payload }, { merge: true });
});

onAuthStateChanged(auth, (user) => {
  if (user) currentUser = user;
  else signInAnonymously(auth);
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

initEngine();
