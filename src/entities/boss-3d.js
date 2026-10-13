// ===== boss-3d.js — 3D Boss Classes: เจ้านายขั้นสุด ===

class MiniBoss3D {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.mesh = new THREE.Group();
    this.dead = false;

    // Materials - dark purple with glowing edges
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x6b21a8,
      roughness: 0.15,
      metalness: 0.7,
      emissive: 0x331144,
      emissiveIntensity: 0.4
    });

    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      roughness: 0.05,
      metalness: 0.9,
      emissive: 0x662277,
      emissiveIntensity: 0.6
    });

    // Core body (larger cylinder with rounded top)
    const bodyGeo = new THREE.CylinderGeometry(1.5, 2.5, 6, 12);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    this.mesh.add(body);

    // Top dome
    const domeGeo = new THREE.SphereGeometry(2.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3);
    const dome = new THREE.Mesh(domeGeo, bodyMat);
    dome.position.y = 3;
    this.mesh.add(dome);

    // Energy rings (rotating)
    for (let i = 0; i < 3; i++) {
      const ringGeo = new THREE.TorusGeometry(2.8 + i * 0.6, 0.15, 16, 32);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 3 + (i + 1) * 0.8;
      ring.userData.originalY = ring.position.y;
      this.mesh.add(ring);
    }

    // Properties
    this.health = 3000 + (this.level - 1) * 500;
    this.maxHealth = this.health;
    this.attackLevel = Math.min(3, (this.level - 4));

    // Animation
    this.rotationOffset = Math.random() * Math.PI * 2;
    this.ringOffset = 0;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt) {
    // Rotate rings
    for (const ring of this.mesh.children) {
      if (ring.userData.originalY) {
        ring.position.y = ring.userData.originalY + Math.sin(this.ringOffset + ring.userData.id * 2) * 0.3;
      }
    }

    // Slight body rotation
    this.rotationOffset += dt * 0.5;
    this.mesh.rotation.y = Math.sin(this.rotationOffset) * 0.1;
  }
}

class FinalBoss3D {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.mesh = new THREE.Group();
    this.dead = false;

    // Materials - massive crimson with purple glow
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x330011,
      emissiveIntensity: 0.5
    });

    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x660022,
      emissiveIntensity: 0.7
    });

    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xff4d4d,
      roughness: 0.15,
      metalness: 0.7,
      emissive: 0x331122,
      emissiveIntensity: 0.4
    });

    // Main hull (large box)
    const hullGeo = new THREE.BoxGeometry(6, 6, 8);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    this.mesh.add(hull);

    // Core crystal
    const coreGeo = new THREE.OctahedronGeometry(2.5, 0);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 1;
    this.mesh.add(core);

    // Spikes around hull
    for (let i = 0; i < 8; i++) {
      const spikeGeo = new THREE.ConeGeometry(0.3, 2, 8);
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      const angle = (i / 8) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3);
      spike.rotation.x = Math.PI / 1.5;
      this.mesh.add(spike);
    }

    // Wing-like structures
    const wingGeo = new THREE.ConeGeometry(2, 4, 8);
    for (let i = 0; i < 2; i++) {
      const wing = new THREE.Mesh(wingGeo, hullMat);
      wing.rotation.y = i === 0 ? Math.PI / 6 : -Math.PI / 6;
      wing.position.set(i === 0 ? -4 : 4, 1, 0);
      this.mesh.add(wing);
    }

    // Properties
    this.health = 8000 + (this.level - 5) * 2000;
    this.maxHealth = this.health;
    this.attackLevel = Math.min(5, (this.level - 4));

    // Animation state
    this.state = 'idle'; // idle | attack | vulnerable
    this.flashTime = 0;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt) {
    // Core rotation
    this.mesh.rotation.z = Math.sin(this.clock * 2) * 0.05;

    // Wing animation
    for (const wing of this.mesh.children) {
      if (wing.userData.isWing) {
        wing.rotation.z = Math.sin(this.clock + wing.userData.offset) * 0.1;
      }
    }

    // Flash effect during vulnerable state
    if (this.state === 'vulnerable' && this.flashTime > 0) {
      this.flashTime -= dt;
    }
  }

  takeDamage(amount) {
    this.health -= amount;

    // Set to vulnerable when health drops below 50%
    if (this.health < this.maxHealth * 0.5 && this.state !== 'vulnerable') {
      this.state = 'vulnerable';
      this.flashTime = 1.0;

      // Change core color temporarily
      const oldMat = this.core.material;
      this.core.material = new THREE.MeshStandardMaterial({
        ...oldMat,
        emissive: 0xffffff,
        emissiveIntensity: 1.0
      });

      setTimeout(() => {
        this.state = 'idle';
        const oldEmissive = oldMat.emissive;
        this.core.material = new THREE.MeshStandardMaterial({
          ...oldMat,
          emissive: oldEmissive,
          emissiveIntensity: oldMat.emissiveIntensity
        });
      }, 1000);
    }

    return this.health <= 0;
  }

  get core() {
    return this.children.find(c => c.type === 'Octahedron') || null;
  }

  set core(val) {
    this.core = val;
  }
}

class Boss3D {
  static create(game, type, level) {
    if (type === 'mini') {
      return new MiniBoss3D(game, level);
    } else {
      return new FinalBoss3D(game, level);
    }
  }
}

export default Boss3D;
