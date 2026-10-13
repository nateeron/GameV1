// ===== enemy-3d.js — 3D Enemy Classes: กองทัพยานอวกาศ ===

class Drifter3D {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.type = 'drifter';
    this.dead = false;

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x443377,
      emissiveIntensity: 0.25
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x332266,
      emissiveIntensity: 0.2
    });

    // Main body (elongated shape)
    const bodyGeo = new THREE.CylinderGeometry(0.4, 0.8, 3, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(body);

    // Wings
    const wingGeo = new THREE.BoxGeometry(1.5, 0.1, 2.5);
    const wingLeft = new THREE.Mesh(wingGeo, wingMat);
    wingLeft.rotation.z = Math.PI / 6;
    wingLeft.position.x = -1.2;
    this.mesh.add(wingLeft);

    const wingRight = new THREE.Mesh(wingGeo, wingMat);
    wingRight.rotation.z = -Math.PI / 6;
    wingRight.position.x = 1.2;
    this.mesh.add(wingRight);

    // Properties
    this.y = game.height + Math.random() * 300 - 150;
    this.z = (Math.random() - 0.5) * 400;
    this.speed = 800 + game.level * 50;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt, game) {
    // Move down (infinite scroll effect)
    this.y -= this.speed * dt;

    // Slight rotation for movement
    this.mesh.rotation.x += dt * 0.3;
    this.mesh.rotation.z = Math.sin(this.y * 0.01) * 0.1;
  }
}

class Weaver3D {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.type = 'weaver';
    this.dead = false;

    // Materials - more complex geometry
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.15,
      metalness: 0.7,
      emissive: 0x662244,
      emissiveIntensity: 0.3
    });

    const armMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.6,
      emissive: 0x441133,
      emissiveIntensity: 0.2
    });

    // Core (twisted shape)
    const coreGeo = new THREE.TorusKnotGeometry(0.7, 0.25, 40, 8);
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.mesh.add(this.core);

    // Arms (rotating appendages)
    for (let i = 0; i < 3; i++) {
      const armGeo = new THREE.CylinderGeometry(0.15, 0.1, 2.5, 8);
      const arm = new THREE.Mesh(armGeo, armMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.set(Math.cos(i * Math.PI / 3) * 1.2, 0, Math.sin(i * Math.PI / 3) * 1.2);

      // Store original position for animation
      arm.userData.originalPosition = { ...arm.position };

      this.mesh.add(arm);
    }

    // Properties
    this.y = game.height + Math.random() * 300 - 150;
    this.z = (Math.random() - 0.5) * 400;
    this.speed = 600 + game.level * 40;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt, game) {
    // Move down
    this.y -= this.speed * dt;

    // Rotate arms
    for (const arm of this.mesh.children) {
      if (arm.userData.originalPosition) {
        const angle = dt * (0.5 + Math.random() * 0.3);
        arm.position.x = arm.userData.originalPosition.x * Math.cos(angle) -
                         arm.userData.originalPosition.z * Math.sin(angle);
        arm.position.z = arm.userData.originalPosition.x * Math.sin(angle) +
                         arm.userData.originalPosition.z * Math.cos(angle);
      }
    }
  }
}

class Shooter3D {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.type = 'shooter';
    this.dead = false;

    // Materials - heavy warship look
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.25,
      metalness: 0.6,
      emissive: 0x551111,
      emissiveIntensity: 0.15
    });

    const turretMat = new THREE.MeshStandardMaterial({
      color: 0xf9a8d4,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x331122,
      emissiveIntensity: 0.25
    });

    // Main hull (box with cone top)
    const hullGeo = new THREE.BoxGeometry(3, 3, 4);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    this.mesh.add(hull);

    // Top cone (weapon turret)
    const turretGeo = new THREE.ConeGeometry(1.5, 2.5, 8);
    const turret = new THREE.Mesh(turretGeo, turretMat);
    turret.position.y = 1.5;
    this.turret = turret;
    this.mesh.add(turret);

    // Cannon barrel (visible when shooting)
    const barrelGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    this.barrel = new THREE.Mesh(barrelGeo, hullMat);
    this.barrel.rotation.x = Math.PI / 2;
    this.barrel.position.y = -0.5;
    this.barrel.visible = false;
    this.mesh.add(this.barrel);

    // Properties
    this.y = game.height + Math.random() * 300 - 150;
    this.z = (Math.random() - 0.5) * 400;
    this.speed = 700 + game.level * 60;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt, game) {
    // Move down
    this.y -= this.speed * dt;

    // Turret slowly rotates
    this.turret.rotation.y += dt * 0.1;

    // Barre l flicker when about to fire (random chance)
    if (Math.random() < 0.02) {
      this.barrel.visible = true;
      setTimeout(() => { this.barrel.visible = false; }, 50);
    }
  }
}

class Tank3D {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.type = 'tank';
    this.dead = false;

    // Materials - heavy armored dreadnought
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0x111122,
      emissiveIntensity: 0.2
    });

    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x331500,
      emissiveIntensity: 0.3
    });

    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.9,
      emissive: 0x112233,
      emissiveIntensity: 0.15
    });

    // Main hull (large blocky warship)
    const hullGeo = new THREE.BoxGeometry(4, 3, 5);
    const hull = new THREE.Mesh(hullGeo, hullMat);
    this.mesh.add(hull);

    // Armor plates (orange accents above and below the hull)
    const plateGeo = new THREE.BoxGeometry(4.4, 0.4, 5.4);
    const plateTop = new THREE.Mesh(plateGeo, armorMat);
    plateTop.position.y = 1.7;
    this.mesh.add(plateTop);

    const plateBottom = new THREE.Mesh(plateGeo, armorMat);
    plateBottom.position.y = -1.7;
    this.mesh.add(plateBottom);

    // Twin side cannons (heavy long barrels with muzzle rings)
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;

      const barrelGeo = new THREE.CylinderGeometry(0.35, 0.5, 4, 8);
      const barrel = new THREE.Mesh(barrelGeo, gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(side * 2.6, 0, 0);
      this.mesh.add(barrel);

      const ringGeo = new THREE.TorusGeometry(0.35, 0.1, 8, 16);
      const ring = new THREE.Mesh(ringGeo, armorMat);
      ring.position.set(side * 2.6, 0, 2.0);
      this.mesh.add(ring);
    }

    // Core reactor (glowing heart, pulses in update)
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xff5533,
      roughness: 0.1,
      metalness: 0.5,
      emissive: 0xff2200,
      emissiveIntensity: 0.8
    });
    const coreGeo = new THREE.SphereGeometry(0.7, 16, 16);
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.core.position.z = 2.6;
    this.mesh.add(this.core);

    // Properties (tank: slowest and heaviest of the fleet)
    this.y = game.height + Math.random() * 300 - 150;
    this.z = (Math.random() - 0.5) * 400;
    this.speed = 500 + game.level * 30;

    // Connect collision handler
    this.connect(game);
  }

  connect(game) {
    this.game = game;
  }

  update(dt, game) {
    // Move down (slow, heavy dreadnought)
    this.y -= this.speed * dt;

    // Core reactor pulses as it moves
    this.core.scale.setScalar(1 + Math.sin(this.y * 0.02) * 0.1);

    // Slight hull sway
    this.mesh.rotation.x += dt * 0.1;
  }
}

class Enemy3D {
  static create(game, type) {
    switch (type) {
      case 'drifter':
        return new Drifter3D(game);
      case 'weaver':
        return new Weaver3D(game);
      case 'shooter':
        return new Shooter3D(game);
      case 'tank':
        return new Tank3D(game);
      default:
        return new Drifter3D(game);
    }
  }
}

export default Enemy3D;
