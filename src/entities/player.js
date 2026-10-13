// ===== player.js — เรือผู้เล่น (อาวุธ 5 ระดับ) =====
class Player {
  constructor() {
    this.x = CONFIG.WIDTH / 2;
    this.y = CONFIG.HEIGHT - 60;
    this.radius = CONFIG.PLAYER.RADIUS;
    this.hp = CONFIG.PLAYER.MAX_HP;
    this.shield = false;
    this.weapon = 1;         // ระดับอาวุธ 1..5
    this.rapidUntil = 0;     // เวลาที่ rapid fire สิ้นสุด
    this.invuln = 0;         // ใส้เหล็กที่เหลือ
    this.cooldown = 0;       // เวลายิงถัดไป
    this.muzzle = 0;         // ไฟหัวปากกระบอก
  }

  update(dt, input, game, now) {
    // --- เคลื่อนที่ ---
    let dx = 0, dy = 0;
    if (input.down('left')) dx -= 1;
    if (input.down('right')) dx += 1;
    if (input.down('up')) dy -= 1;
    if (input.down('down')) dy += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * CONFIG.PLAYER.SPEED * dt;
      this.y += (dy / len) * CONFIG.PLAYER.SPEED * dt;
    }
    this.x = Math.max(20, Math.min(CONFIG.WIDTH - 20, this.x));
    this.y = Math.max(40, Math.min(CONFIG.HEIGHT - 24, this.y));

    this.invuln = Math.max(0, this.invuln - dt);
    this.muzzle = Math.max(0, this.muzzle - dt);

    // --- auto-fire ---
    this.cooldown -= dt;
    if (this.cooldown <= 0) {
      const rapid = now < this.rapidUntil;
      this.cooldown = rapid
        ? CONFIG.PLAYER.FIRE_COOLDOWN / 1.8
        : CONFIG.PLAYER.FIRE_COOLDOWN;
      this.spawnBullets(game, rapid);
    }
  }

  // แบบฟอร์มกระสุนแต่ละระดับ: [มุมเบี่ยง, เว้นซ้าย-ขวา]
  spawnBullets(game, rapid) {
    const sp = rapid ? 720 : 620;
    const PATTERNS = [
      [[0, 0]],
      [[0, -7], [0, 7]],
      [[0, 0], [-0.16, -6], [0.16, 6]],
      [[0, -8], [0, 8], [-0.2, -10], [0.2, 10]],
      [[0, -6], [0, 6], [-0.18, -10], [0.18, 10], [-0.45, -14], [0.45, 14]],
    ];
    const pattern = PATTERNS[this.weapon - 1];
    for (const [ang, off] of pattern) {
      game.bullets.push(new Bullet(
        this.x + off, this.y - 16,
        Math.sin(ang) * sp, -Math.cos(ang) * sp,
        { friendly: true, radius: 4, damage: 1, color: rapid ? '#ffe27d' : '#7df9ff' }
      ));
    }
    this.muzzle = 0.06;
  }

  // คืนค่า true = โดนจริง (เลือด/เกราะถูกใช้), false = ใส้เหล็ก
  hit() {
    if (this.invuln > 0) return false;
    if (this.shield) {
      this.shield = false;
      this.invuln = 0.8;
      return true;
    }
    this.hp -= 1;
    this.invuln = CONFIG.PLAYER.INVULN_TIME;
    return true;
  }

  draw(ctx, now) {
    if (this.invuln > 0 && Math.floor(now * 14) % 2 === 0) return; // กระพริบตอนใส้เหล็ก

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#4dc3ff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#dfe9ff';
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(13, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-13, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#4dc3ff';
    ctx.beginPath();
    ctx.arc(0, -2, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.muzzle > 0) {
      ctx.fillStyle = 'rgba(125,249,255,0.8)';
      ctx.beginPath();
      ctx.arc(0, -22, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // วงแหวนเกราะ
    if (this.shield) {
      ctx.save();
      ctx.strokeStyle = 'rgba(77,195,255,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 25 + Math.sin(now * 5) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
