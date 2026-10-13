// ===== player-3d.js — 3D Player Ship: ยานอวกาศผู้เล่น ===
// Three.js Group with fuselage, wings, engine glow

class Player3D {
  constructor(game) {
    this.game = game;
    this.mesh = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x4dc3ff,
      roughness: 0.2,
      metalness: 0.7,
      emissive: 0x2266aa,
      emissiveIntensity: 0.3
    });

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.8
    });

    // Fuselage (cone shape)
    const bodyGeo = new THREE.ConeGeometry(1, 3, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    this.mesh.add(body);

    // Wings (elongated box)
    const wingGeo = new THREE.BoxGeometry(4, 0.1, 1.8);
    const wingLeft = new THREE.Mesh(wingGeo, bodyMat);
    wingLeft.position.x = -2;
    this.mesh.add(wingLeft);

    // Cockpit (sphere)
    const cockpitGeo = new THREE.SphereGeometry(0.4, 12, 12);
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: 0x88ccff,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0, -0.5);
    this.mesh.add(cockpit);

    // Engine glow (at back)
    const engineGeo = new THREE.SphereGeometry(0.3, 8, 8);
    const engine = new THREE.Mesh(engineGeo, glowMat);
    engine.position.z = 1.2;
    this.mesh.add(engine);

    // Weapon system - laser beams
    this.weaponLevel = 1;
    this.weaponMesh = this.createWeapon();

    this.mesh.add(this.weaponMesh);

    // Properties
    this.x = game.width / 2;
    this.y = game.height;
    this.z = 0;
    this.velocityX = 0;
    this.velocityZ = 0;

    // Animation
    this.thrustOffset = 0;

    // Connect collision handler
    this.connect(game);
  }

  createWeapon() {
    const group = new THREE.Group();

    if (this.weaponLevel === 1) {
      // Single beam - thin line
      const positions = [
        new THREE.Vector3(0, 0, -0.5),
        new THREE.Vector3(0, 0, -12)
      ];
      return new THREE.Line(
        new THREE.BufferGeometry({
          positions: new Float32Array(positions.flatMap(p => [p.x, p.y, p.z]))
        }),
        new THREE.LineBasicMaterial({
          color: 0x7df9ff,
          linewidth: 2
        })
      );
    } else if (this.weaponLevel >= 2) {
      // Spread shot - multiple beams
      const geometries = [];
      for (let i = 1; i <= this.weaponLevel; i++) {
        const spread = (i - 1) * 0.5;
        const positions = [
          new THREE.Vector3(spread, 0, -0.5),
          new THREE.Vector3(spread, 0, -12)
        ];
        geometries.push(new THREE.BufferGeometry({
          positions: new Float32Array(positions.flatMap(p => [p.x, p.y, p.z]))
        }));
      }

      const weaponGroup = new THREE.Group();
      const materials = geometries.map(() =>
        new THREE.LineBasicMaterial({
          color: 0x7df9ff,
          linewidth: 2
        })
      );

      geometries.forEach((geo, i) => {
        const line = new THREE.Line(geo, materials[i]);
        weaponGroup.add(line);
      });

      return weaponGroup;
    } else if (this.weaponLevel >= 4) {
      // Wide spread - cone of fire
      const positions = [];

      // Center beam
      positions.push(0, 0, -0.5);
      positions.push(0, 0, -12);

      // Side beams with angle
      const sidePositions = [
        new THREE.Vector3(-0.8, 0.4, -0.5),
        new THREE.Vector3(-2, -1, -12)
      ];
      const rightPositions = sidePositions.map(p => {
        return new THREE.Vector3(p.x * 1.3, p.y + 0.2, p.z);
      });

      // Create geometry groups
      const groupGeometries = [];

      // Center line
      const centerGeo = new THREE.BufferGeometry({
        positions: sidePositions.flatMap(p => [p.x, p.y, p.z]).concat(rightPositions.flatMap(p => [p.x, p.y, p.z]))
      });
      groupGeometries.push(centerGeo);

      // Side lines (angled)
      const angledGeo = new THREE.BufferGeometry({
        positions: sidePositions.flatMap(p => [p.x, p.y, p.z]).concat(rightPositions.flatMap(p => [p.x, p.y, p.z]))
      });
      groupGeometries.push(angledGeo);

      const weaponGroup = new THREE.Group();
      for (let i = 0; i < groupGeometries.length; i++) {
        const line = new THREE.Line(groupGeometries[i], new THREE.LineBasicMaterial({
          color: this.weaponLevel >= 5 ? 0xffcc00 : 0x7df9ff,
          linewidth: 2
        }));
        weaponGroup.add(line);
      }

      return weaponGroup;
    }

    return new THREE.Line(
      new THREE.BufferGeometry({ positions: [] }),
      new THREE.LineBasicMaterial({ color: 0xff6600 })
    );
  }

  update(dt, input, game, timeNow) {
    // Movement - x/z plane only (infinite scroll)
    this.velocityX = input.keys['ArrowLeft'].pressed ? -CONFIG.PLAYER.ACCEL :
                     input.keys['ArrowRight'].pressed ? CONFIG.PLAYER.ACCEL : 0;

    // WASD support (convert to velocityZ for depth movement)
    if (input.keys['KeyW'].pressed) this.velocityZ = -CONFIG.PLAYER.DEPTH_SPEED;
    else if (input.keys['KeyS'].pressed) this.velocityZ = CONFIG.PLAYER.DEPTH_SPEED;
    else this.velocityZ = 0;

    // Apply acceleration
    this.x += this.velocityX * dt;

    // Clamp to screen bounds with some padding
    const padding = CONFIG.WIDTH * 0.15;
    this.x = Math.max(padding, Math.min(game.width - padding, this.x));

    // Update position
    this.mesh.position.x = this.x - game.width / 2;

    // Engine thrust animation
    this.thrustOffset += dt * 3;
    const wave = Math.sin(this.thrustOffset) * 0.15;

    // Flicker engine glow
    const engineOpacity = 0.8 + (Math.random() * 0.2);
    if (this.engineGlow) {
      this.engineGlow.material.opacity = engineOpacity * 0.6;
    }

    // Weapon animation - slight vibration
    if (this.weaponMesh instanceof THREE.Line) {
      const flicker = Math.sin(timeNow * 50) * 0.3;
      this.weaponMesh.position.z = flicker;
    } else if (this.weaponMesh) {
      for (const child of this.weaponMesh.children) {
        const flicker = Math.sin(timeNow * 50 + child.id) * 0.15;
        child.position.z = flicker;
      }
    }

    // Banking effect when turning
    if (Math.abs(this.velocityX) > 0.1) {
      this.mesh.rotation.z = -this.velocityX * 20 * dt;
      this.mesh.rotation.y = -this.velocityX * 10 * dt;
    } else {
      // Return to upright
      this.mesh.rotation.z *= 0.95;
      this.mesh.rotation.y *= 0.95;
    }

    // Update mesh (ensure it stays in scene)
    game.scene.add(this.mesh);
  }

  hit() {
    // Player is invincible in standard play
    // Would add damage effects here if needed
  }

  connect(game) {
    this.game = game;

    // Weapon switch handler
    input.keys['Digit1'].pressed = () => {
      this.weaponLevel = 1;
    };
    input.keys['Digit2'].pressed = () => {
      this.weaponLevel = 2;
    };
    input.keys['Digit3'].pressed = () => {
      this.weaponLevel = 3;
    };
    input.keys['Digit4'].pressed = () => {
      this.weaponLevel = 4;
    };
    input.keys['Digit5'].pressed = () => {
      this.weaponLevel = 5;
    };

    // Update weapon mesh when level changes
    this.updateWeapon();
  }

  updateWeapon() {
    // Dispose old weapon
    if (this.weaponMesh) {
      this.game.scene.remove(this.weaponMesh);
      THREE.Object3D.prototype.dispose.call(this.weaponMesh);
    }

    // Create new weapon mesh
    const positions = [];
    for (let i = -this.weaponLevel; i <= this.weaponLevel; i++) {
      const spread = i * 0.8;
      positions.push(
        spread, 0, -0.5,
        spread, 0, -12
      );
    }

    this.weaponMesh = new THREE.Line(
      new THREE.BufferGeometry({
        positions: new Float32Array(positions)
      }),
      new THREE.LineBasicMaterial({
        color: this.weaponLevel >= 5 ? 0xffcc00 : 0x7df9ff,
        linewidth: 2
      })
    );

    this.game.scene.add(this.weaponMesh);
  }
}

export default Player3D;
