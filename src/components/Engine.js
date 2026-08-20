import * as THREE from 'three';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.objects = [];
    this.keyframes = [];
    this.isAnimating = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.setupLighting();
    this.setupGrid();
    this.setupNavigation();

    this.animate();
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(30, 30, 0x6366f1, 0x334155);
    this.scene.add(grid);
  }

  setupNavigation() {
    this.keys = {};
    window.addEventListener('keydown', (e) => (this.keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.key.toLowerCase()] = false));

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) isDragging = true;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      this.camera.rotation.y -= deltaX * 0.005;
      this.camera.rotation.x -= deltaY * 0.005;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => (isDragging = false));
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  updateMovement() {
    const moveSpeed = 0.15;
    if (this.keys['w'] || this.keys['arrowup']) this.camera.translateZ(-moveSpeed);
    if (this.keys['s'] || this.keys['arrowdown']) this.camera.translateZ(moveSpeed);
    if (this.keys['a'] || this.keys['arrowleft']) this.camera.translateX(-moveSpeed);
    if (this.keys['d'] || this.keys['arrowright']) this.camera.translateX(moveSpeed);
  }

  addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x6366f1, flatShading: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, 0.5, (Math.random() - 0.5) * 6);
    this.scene.add(mesh);
    this.objects.push({ type: 'cube', mesh });
  }

  addSphere() {
    const geometry = new THREE.SphereGeometry(0.6, 12, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981, flatShading: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, 0.6, (Math.random() - 0.5) * 6);
    this.scene.add(mesh);
    this.objects.push({ type: 'sphere', mesh });
  }

  addNPC() {
    const group = new THREE.Group();
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.6;

    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.4;

    group.add(body);
    group.add(head);
    group.position.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);

    this.scene.add(group);
    this.objects.push({ type: 'npc', mesh: group });
  }

  captureKeyframe() {
    const frameState = this.objects.map((obj) => ({
      position: obj.mesh.position.toArray(),
      rotation: obj.mesh.rotation.toArray()
    }));
    this.keyframes.push(frameState);
    return this.keyframes.length;
  }

  playAnimation() {
    if (this.keyframes.length === 0) return;
    this.isAnimating = true;
    let frameIndex = 0;

    const interval = setInterval(() => {
      if (!this.isAnimating) {
        clearInterval(interval);
        return;
      }
      const state = this.keyframes[frameIndex];
      state.forEach((savedObj, i) => {
        if (this.objects[i]) {
          this.objects[i].mesh.position.fromArray(savedObj.position);
          this.objects[i].mesh.rotation.fromArray(savedObj.rotation);
        }
      });
      frameIndex = (frameIndex + 1) % this.keyframes.length;
    }, 500);
  }

  exportSceneData() {
    return JSON.stringify({
      objects: this.objects.map((o) => ({
        type: o.type,
        position: o.mesh.position.toArray()
      })),
      keyframes: this.keyframes
    });
  }

  importSceneData(jsonString) {
    this.clear();
    const data = JSON.parse(jsonString);
    data.objects.forEach((obj) => {
      if (obj.type === 'cube') this.addCube();
      if (obj.type === 'sphere') this.addSphere();
      if (obj.type === 'npc') this.addNPC();
      const created = this.objects[this.objects.length - 1];
      if (created) created.mesh.position.fromArray(obj.position);
    });
    this.keyframes = data.keyframes || [];
  }

  clear() {
    this.objects.forEach((o) => this.scene.remove(o.mesh));
    this.objects = [];
    this.keyframes = [];
  }

  onResize() {
    if (!this.canvas.parentElement) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateMovement();
    this.renderer.render(this.scene, this.camera);
  }
}
