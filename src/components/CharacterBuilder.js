import * as THREE from 'three';

export class CharacterBuilder {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x090d16);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.set(0, 2, 4);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);

    this.setupLighting();
    this.buildBaseMesh();
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

  addNose() {
    const head = this.characterGroup.getObjectByName("head");
    if (!head) return;
    const nose = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    nose.position.set(0, 0, 0.35);
    head.add(nose);
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
  }

  addArm() {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
    );
    arm.position.set(0.6, 1, 0);
    this.characterGroup.add(arm);
  }

  reset() {
    this.scene.remove(this.characterGroup);
    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);
    this.buildBaseMesh();
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
    this.characterGroup.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  }
}
