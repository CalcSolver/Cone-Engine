import * as THREE from 'three';

export class CharacterBuilder {
  constructor(canvas, onSelectCallback) {
    this.canvas = canvas;
    this.onSelectCallback = onSelectCallback;
    this.parts = [];
    this.keyframes = [];
    this.selectedPart = null;
    this.isAnimating = false;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 2, 4);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLighting();
    this.buildBaseMesh();
    this.setupSelection();
    this.animate();
  }

  setupLighting() {
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 10, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  }

  buildBaseMesh() {
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    torso.position.y = 1;

    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xfde047 })
    );
    head.position.y = 1.8;
    head.name = "head";

    this.characterGroup.add(torso);
    this.characterGroup.add(head);
  }

  setupSelection() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.parts);

      if (intersects.length > 0) {
        this.selectedPart = intersects[0].object;
        if (this.onSelectCallback) this.onSelectCallback(this.selectedPart);
      } else {
        this.selectedPart = null;
        if (this.onSelectCallback) this.onSelectCallback(null);
      }
    });
  }

  addNose() {
    const head = this.characterGroup.getObjectByName("head");
    if (!head) return;
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    nose.position.set(0, 0, 0.35);
    head.add(nose);
    this.parts.push(nose);
  }

  addEye() {
    const head = this.characterGroup.getObjectByName("head");
    if (!head) return;
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    eye.position.set(0.15, 0.1, 0.31);
    head.add(eye);
    this.parts.push(eye);
  }

  addHat() {
    const head = this.characterGroup.getObjectByName("head");
    if (!head) return;
    const hat = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.2, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x10b981 })
    );
    hat.position.set(0, 0.35, 0);
    head.add(hat);
    this.parts.push(hat);
  }

  addArm() {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    arm.position.set(0.6, 1, 0);
    this.characterGroup.add(arm);
    this.parts.push(arm);
  }

  deleteSelectedPart() {
    if (!this.selectedPart) return;
    if (this.selectedPart.parent) this.selectedPart.parent.remove(this.selectedPart);
    this.parts = this.parts.filter(p => p !== this.selectedPart);
    this.selectedPart = null;
    if (this.onSelectCallback) this.onSelectCallback(null);
  }

  capturePoseKeyframe() {
    const frame = {
      rotation: this.characterGroup.rotation.toArray(),
      parts: this.parts.map(p => ({ pos: p.position.toArray(), rot: p.rotation.toArray() }))
    };
    this.keyframes.push(frame);
    return this.keyframes.length;
  }

  togglePoseAnimation() {
    if (this.keyframes.length === 0) return;
    this.isAnimating = !this.isAnimating;

    if (!this.isAnimating) return;

    let index = 0;
    const interval = setInterval(() => {
      if (!this.isAnimating) {
        clearInterval(interval);
        return;
      }
      const frame = this.keyframes[index];
      this.characterGroup.rotation.fromArray(frame.rotation);
      frame.parts.forEach((saved, i) => {
        if (this.parts[i]) {
          this.parts[i].position.fromArray(saved.pos);
          this.parts[i].rotation.fromArray(saved.rot);
        }
      });
      index = (index + 1) % this.keyframes.length;
    }, 500);
  }

  reset() {
    this.scene.remove(this.characterGroup);
    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);
    this.parts = [];
    this.keyframes = [];
    this.selectedPart = null;
    this.buildBaseMesh();
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
    if (!this.isAnimating) this.characterGroup.rotation.y += 0.005;
    this.renderer.render(this.scene, this.camera);
  }
}
