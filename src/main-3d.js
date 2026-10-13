import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// The proven 2D gameplay classes manage movement, levels and collisions.
// This class projects their state onto real Three.js meshes.
class Game3D {
  constructor() {
    this.canvas = document.getElementById('game');
    this.overlay = document.getElementById('overlay').getContext('2d');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(CONFIG.WIDTH, CONFIG.HEIGHT, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x050a19);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-400, 400, 300, -300, 0.1, 1500);
    this.camera.position.set(0, 0, 900);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.AmbientLight(0x9bbcff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(-150, 220, 500);
    this.scene.add(key);

    this.visuals = new Map();
    this.stars = [];
    this.makeStars();

    this.saveData = Save.load();
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
    this.now = 0;
    this.state = 'menu';
    this.isRecord = false;
    this.bullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.enemies = [];
    this.particles = [];
    this.boss = null;
    this.setupRun();
    Input.init(this);

    this.canvas.addEventListener('click', () => {
      if (this.state === 'menu' || this.state === 'gameover') this.startGame();
      else if (this.state === 'levelclear') this.state = 'playing';
    });

    let last = performance.now();
    const frame = (time) => {
      const dt = Math.max(0, Math.min((time - last) / 1000, 0.05));
      last = time;
      this.update(dt);
      this.render();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  makeStars() {
    const geometry = new THREE.SphereGeometry(1.5, 5, 4);
    const material = new THREE.MeshBasicMaterial({ color: 0x9bcaff });
    for (let i = 0; i < 90; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Math.random() * 800 - 400, Math.random() * 600 - 300, -180);
      const speed = 15 + Math.random() * 55;
      const size = 0.35 + Math.random() * 1.1;
      mesh.scale.setScalar(size);
      this.scene.add(mesh);
      this.stars.push({ mesh, speed });
    }
  }

  setupRun() {
    this.clearVisuals();
    this.player = new Player();
    this.director = new LevelDirector(this);
    this.bullets.length = 0;
    this.enemyBullets.length = 0;
    this.items.length = 0;
    this.enemies.length = 0;
    this.particles.length = 0;
    this.boss = null;
  }

  startGame() {
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
    this.now = 0;
    this.isRecord = false;
    this.setupRun();
    this.state = 'playing';
  }

  onKey(key) {
    if (key === 'p') {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
      return;
    }
    if (this.state === 'playing' && /^[1-5]$/.test(key)) {
      this.player.weapon = Number(key);
      return;
    }
    if (key !== ' ') return;
    if (this.state === 'menu' || this.state === 'gameover') this.startGame();
    else if (this.state === 'levelclear') this.state = 'playing';
  }

  enterLevelClear() {
    this.state = 'levelclear';
    this.bullets.length = 0;
    this.enemyBullets.length = 0;
    this.enemies.length = 0;
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.isRecord = this.score > this.saveData.bestScore;
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.score);
    this.saveData.highestLevel = Math.max(this.saveData.highestLevel, this.level);
    Save.write(this.saveData);
  }

  update(dt) {
    for (const star of this.stars) {
      star.mesh.position.y -= star.speed * dt;
      if (star.mesh.position.y < -305) {
        star.mesh.position.y = 305;
        star.mesh.position.x = Math.random() * 800 - 400;
      }
    }
    if (this.state === 'playing') {
      this.now += dt;
      this.player.update(dt, Input, this, this.now);
      for (const enemy of this.enemies) enemy.update(dt, this);
      if (this.boss) this.boss.update(dt);
      for (const bullet of this.bullets) bullet.update(dt);
      for (const bullet of this.enemyBullets) bullet.update(dt);
      for (const item of this.items) item.update(dt);
      for (const particle of this.particles) particle.update(dt);

      this.director.update(dt);
      updateCollisions(this);
      this.cull();
      if (this.level > this.prevLevel) {
        this.prevLevel = this.level;
        this.enterLevelClear();
      }
    } else if (this.state === 'levelclear') {
      for (const particle of this.particles) particle.update(dt);
      this.particles = this.particles.filter((particle) => !particle.dead);
    }
  }

  cull() {
    this.bullets = this.bullets.filter((bullet) => !bullet.dead && !bullet.offscreen());
    this.enemyBullets = this.enemyBullets.filter((bullet) => !bullet.dead && !bullet.offscreen());
    this.items = this.items.filter((item) => !item.dead && item.y < CONFIG.HEIGHT + 30);
    this.enemies = this.enemies.filter((enemy) => !enemy.dead && enemy.y < CONFIG.HEIGHT + 40);
    this.particles = this.particles.filter((particle) => !particle.dead);
  }

  material(color, glow = 0.35) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: glow,
      metalness: 0.55,
      roughness: 0.28,
    });
  }

  makeVisual(kind, object) {
    const group = new THREE.Group();
    const add = (geometry, material, x = 0, y = 0, z = 0) => {
      const part = new THREE.Mesh(geometry, material);
      part.position.set(x, y, z);
      group.add(part);
      return part;
    };

    if (kind === 'player') {
      const hull = this.material(0x4dc3ff);
      add(new THREE.ConeGeometry(16, 38, 6), hull, 0, 0, 5);
      add(new THREE.BoxGeometry(48, 5, 15), hull, 0, -8, -1);
      add(new THREE.SphereGeometry(7, 12, 8), this.material(0xc7f4ff, 0.8), 0, 4, 16);
      add(new THREE.ConeGeometry(6, 15, 8), this.material(0xffb14d, 0.9), 0, -25, 2).rotation.z = Math.PI;
    } else if (kind === 'enemy') {
      const color = object.type === 'shooter' ? 0xcf7cff :
        object.type === 'weaver' ? 0x66d9ff : 0x8be9fd;
      const body = object.type === 'weaver'
        ? new THREE.OctahedronGeometry(17)
        : object.type === 'shooter'
          ? new THREE.DodecahedronGeometry(16)
          : new THREE.ConeGeometry(17, 32, 5);
      add(body, this.material(color), 0, 0, 4);
      add(new THREE.BoxGeometry(36, 4, 10), this.material(color, 0.15), 0, 0, -4);
      if (object.type === 'drifter') group.rotation.z = Math.PI;
    } else if (kind === 'boss') {
      const color = object.isMini ? 0x8be9fd : 0xff79c6;
      const radius = object.radius;
      add(new THREE.IcosahedronGeometry(radius * 0.72, 1), this.material(color, 0.5), 0, 0, 8);
      const ring = add(new THREE.TorusGeometry(radius, 4, 8, 48), this.material(color, 0.9), 0, 0, 14);
      ring.name = 'ring';
      add(new THREE.OctahedronGeometry(radius * 0.24), this.material(0xffffff, 0.95), 0, 0, 33);
    } else if (kind === 'bullet') {
      const color = new THREE.Color(object.color);
      const geometry = object.friendly
        ? new THREE.CylinderGeometry(2.5, 2.5, 17, 8)
        : new THREE.SphereGeometry(object.radius, 8, 6);
      add(geometry, this.material(color, 0.95), 0, 0, 18);
    } else if (kind === 'item') {
      const color = new THREE.Color(ITEM_TYPES[object.kind]?.color || '#ffffff');
      add(new THREE.TorusGeometry(12, 2.5, 8, 20), this.material(color, 0.9), 0, 0, 20);
      add(new THREE.OctahedronGeometry(6), this.material(color, 0.7), 0, 0, 20);
    } else if (kind === 'particle') {
      add(new THREE.SphereGeometry(Math.max(1, object.size), 5, 4),
        new THREE.MeshBasicMaterial({ color: object.color }), 0, 0, 22);
    }
    this.scene.add(group);
    return group;
  }

  syncVisuals() {
    const seen = new Set();
    const sync = (object, kind) => {
      if (!object || object.dead) return;
      seen.add(object);
      let mesh = this.visuals.get(object);
      if (!mesh) {
        mesh = this.makeVisual(kind, object);
        this.visuals.set(object, mesh);
      }
      mesh.position.set(object.x - 400, 300 - object.y, 0);
      if (kind === 'player') {
        mesh.visible = !(object.invuln > 0 && Math.floor(this.now * 14) % 2 === 0);
        mesh.rotation.z = Input.down('left') ? 0.12 : Input.down('right') ? -0.12 : 0;
      } else if (kind === 'boss') {
        mesh.getObjectByName('ring').rotation.z += 0.01;
      } else if (kind === 'item') {
        mesh.rotation.z += 0.02;
      } else if (kind === 'particle') {
        mesh.scale.setScalar(Math.max(0.1, object.life / object.maxLife));
      }
    };
    sync(this.player, 'player');
    for (const enemy of this.enemies) sync(enemy, 'enemy');
    sync(this.boss, 'boss');
    for (const bullet of this.bullets) sync(bullet, 'bullet');
    for (const bullet of this.enemyBullets) sync(bullet, 'bullet');
    for (const item of this.items) sync(item, 'item');
    for (const particle of this.particles) sync(particle, 'particle');

    for (const [object, mesh] of this.visuals) {
      if (seen.has(object)) continue;
      this.scene.remove(mesh);
      mesh.traverse((part) => {
        if (!part.isMesh) return;
        part.geometry.dispose();
        part.material.dispose();
      });
      this.visuals.delete(object);
    }
  }

  clearVisuals() {
    if (!this.visuals) return;
    for (const mesh of this.visuals.values()) {
      this.scene.remove(mesh);
      mesh.traverse((part) => {
        if (!part.isMesh) return;
        part.geometry.dispose();
        part.material.dispose();
      });
    }
    this.visuals.clear();
  }

  render() {
    this.syncVisuals();
    this.renderer.render(this.scene, this.camera);
    const ctx = this.overlay;
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'levelclear') {
      drawHUD(ctx, this);
    }
    if (this.state === 'menu') drawMenuScreen(ctx, this.saveData);
    else if (this.state === 'levelclear') drawLevelClearScreen(ctx, this.level - 1, this.score);
    else if (this.state === 'gameover') drawGameOverScreen(ctx, this.score, this.level, this.isRecord);
    else if (this.state === 'paused') drawPauseScreen(ctx);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game3d = new Game3D();
});
