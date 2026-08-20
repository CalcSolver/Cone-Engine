import * as THREE from 'three';

export class Engine {
  constructor(canvas, onSelectCallback) {
    this.canvas = canvas;
    this.onSelectCallback = onSelectCallback;
    this.objects = [];
    this.selectedObject = null;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.camera.position.set(0, 6, 12);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.transformGizmo = new THREE.Group();
    this.draggingGizmoAxis = null;
    this.plane = new THREE.Plane();
    this.planeIntersect = new THREE.Vector3();

    this.setupLighting();
    this.setupGrid();
    this.setupGizmo();
    this.setupNavigation();
    this.setupSelectionAndDrag();

    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(30, 30, 0x6366f1, 0x1e293b);
    grid.position.y = -0.01;
    this.scene.add(grid);
  }

  setupGizmo() {
    const createArrow = (color, dir) => {
      const group = new THREE.Group();
      const lineGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2);
      const mat = new THREE.MeshBasicMaterial({ color, depthTest: false });
      const line = new THREE.Mesh(lineGeo, mat);
      line.position.y = 0.6;

      const coneGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
      const cone = new THREE.Mesh(coneGeo, mat);
      cone.position.y = 1.35;

      group.add(line);
      group.add(cone);

      if (dir === 'x') group.rotation.z = -Math.PI / 2;
      if (dir === 'z') group.rotation.x = Math.PI / 2;
      group.userData = { axis: dir };
      return group;
    };

    this.gizmoX = createArrow(0xef4444, 'x');
    this.gizmoY = createArrow(0x10b981, 'y');
    this.gizmoZ = createArrow(0x3b82f6, 'z');

    this.transformGizmo.add(this.gizmoX);
    this.transformGizmo.add(this.gizmoY);
    this.transformGizmo.add(this.gizmoZ);
    this.transformGizmo.visible = false;
    this.scene.add(this.transformGizmo);
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

    let isRightDragging = false;
    let prevMouse = { x: 0, y: 0 };

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) {
        isRightDragging = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isRightDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;

      this.camera.rotation.y -= deltaX * 0.004;
      this.camera.rotation.x -= deltaY * 0.004;
      this.camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.camera.rotation.x));

      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) isRightDragging = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  setupSelectionAndDrag() {
    let isLeftDraggingGizmo = false;

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;

      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check Gizmo Intersect First
      if (this.selectedObject && this.transformGizmo.visible) {
        const gizmoChildren = [];
        this.transformGizmo.traverse(c => { if (c.isMesh) gizmoChildren.push(c); });
        const gizmoHits = this.raycaster.intersectObjects(gizmoChildren);

        if (gizmoHits.length > 0) {
          let parent = gizmoHits[0].object;
          while (parent && !parent.userData.axis) parent = parent.parent;
          if (parent && parent.userData.axis) {
            isLeftDraggingGizmo = true;
            this.draggingGizmoAxis = parent.userData.axis;
            return;
          }
        }
      }

      // Check Object Selection
      const meshes = this.objects.map(o => o.mesh);
      const intersects = this.raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let selected = intersects[0].object;
        while (selected.parent && selected.parent !== this.scene) {
          selected = selected.parent;
        }
        const foundObj = this.objects.find(o => o.mesh === selected);
        if (foundObj) this.selectObject(foundObj);
      } else {
        this.deselectAll();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!isLeftDraggingGizmo || !this.selectedObject) return;

      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      const pos = this.selectedObject.mesh.position;
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);

      this.plane.setFromNormalAndCoplanarPoint(camDir.negate(), pos);
      if (this.raycaster.ray.intersectPlane(this.plane, this.planeIntersect)) {
        if (this.draggingGizmoAxis === 'x') pos.x = this.planeIntersect.x;
        if (this.draggingGizmoAxis === 'y') pos.y = this.planeIntersect.y;
        if (this.draggingGizmoAxis === 'z') pos.z = this.planeIntersect.z;
        this.updateGizmoPosition();
        if (this.onSelectCallback) this.onSelectCallback(this.selectedObject);
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        isLeftDraggingGizmo = false;
        this.draggingGizmoAxis = null;
      }
    });
  }

  selectObject(obj) {
    this.deselectAll();
    this.selectedObject = obj;
    this.transformGizmo.visible = true;
    this.updateGizmoPosition();

    // Emphasize selection highlight
    if (obj.mesh.material && obj.mesh.material.emissive) {
      obj.mesh.material.emissive.setHex(0x3b82f6);
    }

    if (this.onSelectCallback) this.onSelectCallback(obj);
  }

  deselectAll() {
    if (this.selectedObject && this.selectedObject.mesh.material && this.selectedObject.mesh.material.emissive) {
      this.selectedObject.mesh.material.emissive.setHex(0x000000);
    }
    this.selectedObject = null;
    this.transformGizmo.visible = false;
    if (this.onSelectCallback) this.onSelectCallback(null);
  }

  updateGizmoPosition() {
    if (this.selectedObject) {
      this.transformGizmo.position.copy(this.selectedObject.mesh.position);
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
    
    const obj = { id: Date.now(), type: 'cube', mesh, color: '#6366f1', keyframes: [], isAnimating: false };
    this.objects.push(obj);
    this.selectObject(obj);
  }

  addSphere() {
    const geometry = new THREE.SphereGeometry(0.6, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set((Math.random() - 0.5) * 6, 0.6, (Math.random() - 0.5) * 6);
    this.scene.add(mesh);
    
    const obj = { id: Date.now(), type: 'sphere', mesh, color: '#10b981', keyframes: [], isAnimating: false };
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
    const obj = { id: Date.now(), type: 'npc', mesh: group, color: '#ef4444', keyframes: [], isAnimating: false };
    this.objects.push(obj);
    this.selectObject(obj);
  }

  deleteSelected() {
    if (!this.selectedObject) return;
    this.scene.remove(this.selectedObject.mesh);
    this.objects = this.objects.filter(o => o !== this.selectedObject);
    this.deselectAll();
  }

  captureObjectKeyframe() {
    if (!this.selectedObject) return 0;
    const frame = {
      position: this.selectedObject.mesh.position.toArray(),
      scale: this.selectedObject.mesh.scale.toArray(),
      rotation: this.selectedObject.mesh.rotation.toArray()
    };
    this.selectedObject.keyframes.push(frame);
    return this.selectedObject.keyframes.length;
  }

  toggleObjectAnimation() {
    if (!this.selectedObject || this.selectedObject.keyframes.length === 0) return;
    const obj = this.selectedObject;
    obj.isAnimating = !obj.isAnimating;

    if (!obj.isAnimating) return;

    let index = 0;
    const interval = setInterval(() => {
      if (!obj.isAnimating) {
        clearInterval(interval);
        return;
      }
      const frame = obj.keyframes[index];
      obj.mesh.position.fromArray(frame.position);
      obj.mesh.scale.fromArray(frame.scale);
      obj.mesh.rotation.fromArray(frame.rotation);
      this.updateGizmoPosition();
      index = (index + 1) % obj.keyframes.length;
    }, 500);
  }

  exportSceneData() {
    return JSON.stringify({
      objects: this.objects.map((o) => ({
        id: o.id,
        type: o.type,
        color: o.color,
        position: o.mesh.position.toArray(),
        scale: o.mesh.scale.toArray(),
        rotation: o.mesh.rotation.toArray(),
        keyframes: o.keyframes
      }))
    });
  }

  importSceneData(jsonString) {
    this.clear();
    if (!jsonString) return;
    const data = JSON.parse(jsonString);
    data.objects.forEach((item) => {
      let created;
      if (item.type === 'cube') this.addCube();
      else if (item.type === 'sphere') this.addSphere();
      else if (item.type === 'npc') this.addNPC();
      
      created = this.objects[this.objects.length - 1];
      if (created) {
        created.id = item.id;
        created.color = item.color || '#6366f1';
        created.mesh.position.fromArray(item.position);
        created.mesh.scale.fromArray(item.scale || [1,1,1]);
        created.mesh.rotation.fromArray(item.rotation || [0,0,0]);
        created.keyframes = item.keyframes || [];

        if (created.mesh.material && created.mesh.material.color) {
          created.mesh.material.color.set(created.color);
        }
      }
    });
    this.deselectAll();
  }

  clear() {
    this.objects.forEach((o) => this.scene.remove(o.mesh));
    this.objects = [];
    this.deselectAll();
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
