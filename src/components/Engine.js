import * as THREE from 'three';

export class Engine {
  constructor(canvas, onSelectCallback) {
    this.canvas = canvas;
    this.onSelectCallback = onSelectCallback;
    this.objects = [];
    this.keyframes = [];
    this.selectedObject = null;
    this.isAnimating = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(0, 6, 12);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLighting();
    this.setupGrid();
    this.setupNavigation();
    this.setupSelection();

    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(30, 30, 0x6366f1, 0x1e293b);
    grid.position.y = -0.01;
    this.scene.add(grid);
  }

  setupNavigation() {
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      if (document.activeElement.tagName === 'INPUT') return;
      this.keys[e.key.toLowerCase()] = false;
    });

    let isPointerLocked = false;
    let yaw = 0;
    let pitch = 0;

    this.canvas.addEventListener('click', () => {
      if (!isPointerLocked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      isPointerLocked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isPointerLocked) return;

      yaw -= e.movementX * 0.002;
      pitch -= e.movementY * 0.002;
      pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch));

      const euler = new THREE.Euler(pitch, yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
    });
  }

  setupSelection() {
    this.canvas.addEventListener('dblclick', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.objects.map(o => o.mesh);
      const intersects = this.raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let selected = intersects[0].object;
        while (selected.parent && selected.parent !== this.scene) {
          selected = selected.parent;
        }
        const foundObj = this.objects.find(o => o.mesh === selected);
        if (foundObj) {
          this.selectObject(foundObj);
        }
      }
    });
  }

  selectObject(obj) {
    this.selectedObject = obj;
    if (this.onSelectCallback) {
      this.onSelectCallback(obj);
    }
  }

  updateMovement() {
    const moveSpeed = 0.18;
    const direction = new THREE.Vector3();

    if (this.keys['w'] || this.keys['arrowup']) direction.z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) direction.z += 1;
    if (this.keys['a'] || this.keys['arrowleft']) direction.x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) direction.x += 1;

    direction.normalize();
    direction.applyQuaternion(this.camera.quaternion);
    this.camera.position.addScaledVector(direction, moveSpeed);
  }

  addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, 0.5, (Math.random() - 0.5) * 6);
    this.scene.add(mesh);
    
    const obj = { id: Date.now(), type: 'cube', mesh };
    this.objects.push(obj);
    this.selectObject(obj);
  }

  addSphere() {
    const geometry = new THREE.SphereGeometry(0.6, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, 0.6, (Math.random() - 0.5) * 6);
    this.scene.add(mesh);
    
    const obj = { id: Date.now(), type: 'sphere', mesh };
    this.objects.push(obj);
    this.selectObject(obj);
  }

  addNPC() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    body.position.y = 0.6;

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xfcd34d })
    );
    head.position.y = 1.4;

    group.add(body);
    group.add(head);
    group.position.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);

    this.scene.add(group);
    const obj = { id: Date.now(), type: 'npc', mesh: group };
    this.objects.push(obj);
    this.selectObject(obj);
  }

  deleteSelected() {
    if (!this.selectedObject) return;
    this.scene.remove(this.selectedObject.mesh);
    this.objects = this.objects.filter(o => o !== this.selectedObject);
    this.selectedObject = null;
    if (this.onSelectCallback) this.onSelectCallback(null);
  }

  captureKeyframe() {
    const frameState = this.objects.map((obj) => ({
      id: obj.id,
      position: obj.mesh.position.toArray(),
      rotation: obj.mesh.rotation.toArray()
    }));
    this.keyframes.push(frameState);
    return this.keyframes.length;
  }

  playAnimation() {
    if (this.keyframes.length === 0) return;
    this.isAnimating = !this.isAnimating;
    
    if (!this.isAnimating) return;

    let frameIndex = 0;
    const interval = setInterval(() => {
      if (!this.isAnimating) {
        clearInterval(interval);
        return;
      }
      const state = this.keyframes[frameIndex];
      state.forEach((savedObj) => {
        const found = this.objects.find(o => o.id === savedObj.id);
        if (found) {
          found.mesh.position.fromArray(savedObj.position);
          found.mesh.rotation.fromArray(savedObj.rotation);
        }
      });
      frameIndex = (frameIndex + 1) % this.keyframes.length;
    }, 600);
  }

  exportSceneData() {
    return JSON.stringify({
      objects: this.objects.map((o) => ({
        id: o.id,
        type: o.type,
        position: o.mesh.position.toArray(),
        rotation: o.mesh.rotation.toArray()
      })),
      keyframes: this.keyframes
    });
  }

  importSceneData(jsonString) {
    this.clear();
    const data = JSON.parse(jsonString);
    data.objects.forEach((obj) => {
      let created;
      if (obj.type === 'cube') this.addCube();
      else if (obj.type === 'sphere') this.addSphere();
      else if (obj.type === 'npc') this.addNPC();
      
      created = this.objects[this.objects.length - 1];
      if (created) {
        created.id = obj.id;
        created.mesh.position.fromArray(obj.position);
        if (obj.rotation) created.mesh.rotation.fromArray(obj.rotation);
      }
    });
    this.keyframes = data.keyframes || [];
  }

  clear() {
    this.objects.forEach((o) => this.scene.remove(o.mesh));
    this.objects = [];
    this.keyframes = [];
    this.selectedObject = null;
    if (this.onSelectCallback) this.onSelectCallback(null);
  }

  onResize() {
    if (!this.canvas.parentElement) return;
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    if (width === 0 || height === 0) return;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateMovement();
    this.renderer.render(this.scene, this.camera);
  }
}
