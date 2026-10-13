// ===== bullet-3d.js — 3D Bullet Projectiles: กระสุนเลเซอร์ ===

class Bullet3D {
  constructor(game, startX, startY, startZ, targetX, targetY, targetZ) {
    this.game = game;
    this.mesh = new THREE.Group();
    this.dead = false;

    // Materials - bright cyan laser
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x7df9ff,
      transparent: true,
      opacity: 0.6
    });

    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xe0ffff,
      transparent: true,
      opacity: 0.95
    });

    // Trail (fading effect behind bullet)
    const trailLen = 24;
    const trailPositions = [];
    for (let i = 0; i < trailLen; i++) {
      trailPositions.push(0, 0, -(i + 1));
    }

    const trailGeo = new THREE.BufferGeometry({
      attributes: {
        position: new Float32Array(trailPositions)
      }
    });

    const trail = new THREE.Line(trailGeo, trailMat);
    this.trail = trail;
    this.mesh.add(trail);

    // Core (bright center)
    const coreLen = 40;
    const corePositions = [];
    for (let i = 0; i < coreLen; i++) {
      corePositions.push(0, 0, -i);
    }

    const coreGeo = new THREE.BufferGeometry({
      attributes: {
        position: new Float32Array(corePositions)
      }
    });

    this.core = new THREE.Line(coreGeo, coreMat);
    this.mesh.add(this.core);

    // Set initial position (aiming ahead of player)
    const angle = Math.atan2(targetX - startX, targetZ - startZ);
    const speed = 1200 + game.level * 100;
    const velocityX = Math.cos(angle) * speed;
    const velocityZ = Math.sin(angle) * speed;

    // Calculate end position
    this.positionX = startX + (targetX - startX) * 0.5;
    this.positionY = startY;
    this.positionZ = startZ + (targetZ - startZ) * 0.5;

    // Store for animation
    this.velocityX = velocityX;
    this.velocityY = 0;
    this.velocityZ = velocityZ;

    // Animation offset
    this.trailOffset = 0;
  }

  update(dt, game) {
    // Move forward
    this.positionX += this.velocityX * dt;
    this.positionY += this.velocityY * dt;
    this.positionZ += this.velocityZ * dt;

    // Update positions array (shift trail)
    const allPositions = Array.from(this.core.geometry.attributes.position.array);
    for (let i = 0; i < this.core.geometry.attributes.position.count; i++) {
      allPositions[i * 3 + 1] = Math.sin(this.trailOffset + i * 0.5) * 0.2;
    }
    this.core.geometry.attributes.position.needsUpdate = true;

    // Move trail offset
    this.trailOffset += dt * 40;

    // Check if hit something (will be handled by collision system)
    // Bullet disappears on collision - collision handler calls game.removeBullet(this)

    // Remove from scene when dead
    if (this.dead) {
      THREE.Object3D.prototype.remove.call(this.mesh);
    }
  }

  hit() {
    this.dead = true;
  }

  offscreen() {
    // Check if bullet is beyond horizon
    return this.positionZ < -CONFIG.HEIGHT * 2 || this.positionZ > CONFIG.HEIGHT * 2;
  }
}

export default Bullet3D;
