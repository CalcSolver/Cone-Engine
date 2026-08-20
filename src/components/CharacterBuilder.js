import * as THREE from 'three';

export class CharacterBuilder {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e293b);

    this.camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    this.camera.position.set(0, 2, 4);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);

    this.setupLighting();
    this.buildBaseMesh();
    this.animate();
  }

  setupLighting() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  }

  buildBaseMesh() {
    // Torso & Head Base
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
      new THREE.BoxGeometry(0.1, 0.1, 0.2),
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

  reset() {
    this.scene.remove(this.characterGroup);
    this.characterGroup = new THREE.Group();
    this.scene.add(this.characterGroup);
    this.buildBaseMesh();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.characterGroup.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  }
}
