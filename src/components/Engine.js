import * as THREE from 'three';

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.objects = [];

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a24);

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.setupLighting();
    this.setupGrid();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);
  }

  setupGrid() {
    const grid = new THREE.GridHelper(20, 20, 0x6366f1, 0x374151);
    this.scene.add(grid);
  }

  addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88, flatShading: true });
    const cube = new THREE.Mesh(geometry, material);
    
    cube.position.set(
      (Math.random() - 0.5) * 6,
      0.5,
      (Math.random() - 0.5) * 6
    );

    this.scene.add(cube);
    this.objects.push({ type: 'cube', position: cube.position.toArray(), color: 0x00ff88 });
  }

  addSphere() {
    const geometry = new THREE.SphereGeometry(0.7, 8, 8);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0055, flatShading: true });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(
      (Math.random() - 0.5) * 6,
      0.7,
      (Math.random() - 0.5) * 6
    );

    this.scene.add(sphere);
    this.objects.push({ type: 'sphere', position: sphere.position.toArray(), color: 0xff0055 });
  }

  clear() {
    this.objects.forEach(obj => {
      const selected = this.scene.children.find(child => 
        child.isMesh && child.position.x === obj.position[0]
      );
      if (selected) this.scene.remove(selected);
    });
    this.objects = [];
  }

  exportWorldData() {
    return JSON.stringify(this.objects);
  }

  importWorldData(jsonString) {
    this.clear();
    const data = JSON.parse(jsonString);
    data.forEach(item => {
      let mesh;
      if (item.type === 'cube') {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: item.color, flatShading: true });
        mesh = new THREE.Mesh(geo, mat);
      } else if (item.type === 'sphere') {
        const geo = new THREE.SphereGeometry(0.7, 8, 8);
        const mat = new THREE.MeshStandardMaterial({ color: item.color, flatShading: true });
        mesh = new THREE.Mesh(geo, mat);
      }

      if (mesh) {
        mesh.position.fromArray(item.position);
        this.scene.add(mesh);
        this.objects.push(item);
      }
    });
  }

  onResize() {
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
