// ===== boss.js — Mini Boss กับ Boss (HP มาก + พัดลมกระสุน/จี้ยิง) =====
class Boss {
  constructor(level, isMini, game) {
    this.level = level;
    this.isMini = isMini;
    this.game = game;
    this.radius = isMini ? 38 : 58;

    const hp = isMini
      ? CONFIG.BOSS.MINI_BASE_HP + level * CONFIG.BOSS.MINI_HP_PER_LEVEL
      : CONFIG.BOSS.BASE_HP + level * CONFIG.BOSS.HP_PER_LEVEL;
    this.maxHp = hp;
    this.hp = hp;

    this.x = CONFIG.WIDTH / 2;
    this.y = -90;
    this.targetY = isMini ? 100 : 115;

    this.t = 0;
    this.fireTimer = 1.2;
    this.mode = 'spread';
    this.modeTimer = 2.5;
  }

  update(dt) {
    // ช่วงบินลงมา — ยังไม่ยิง
    if (this.y < this.targetY) {
      this.y += 100 * dt;
      return;
    }

    this.t += dt;
    const range = CONFIG.WIDTH / 2 - this.radius - 60;
    this.x = CONFIG.WIDTH / 2 + Math.sin(this.t * 0.7) * range;

    // สลับโหมดยิงทุก ~2.5 วิ (ด่านสูงสลับเร็วกว่า)
    this.modeTimer -= dt;
    if (this.modeTimer <= 0) {
      this.mode = this.mode === 'spread' ? 'aimed' : 'spread';
      this.modeTimer = Math.max(1.4, 2.5 - this.level * 0.12);
    }

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      if (this.mode === 'spread') {
        this.fireSpread();
        this.fireTimer = (this.isMini ? 1.4 : 1.1) + 0.4;
      } else {
        this.fireAimed();
        this.fireTimer = this.isMini ? 0.95 : 0.7;
      }
    }
  }

  // พัดลมกระสุนลงด้านล่าง
  fireSpread() {
    const n = this.isMini ? 5 : 7;
    const spread = this.isMini ? 1.1 : 1.5;
    const sp = 200 + this.level * 10;
    for (let i = 0; i < n; i++) {
      const a = Math.PI / 2 - spread / 2 + spread * (i / (n - 1));
      this.game.enemyBullets.push(new Bullet(
        this.x, this.y + this.radius * 0.6,
        Math.cos(a) * sp, Math.sin(a) * sp,
        { friendly: false, radius: 6, damage: 1, color: '#ff5d7d' }
      ));
    }
  }

  // จี้ยิงผู้เล่น 3 นัด
  fireAimed() {
    const p = this.game.player;
    const a = Math.atan2(p.y - this.y, p.x - this.x);
    const sp = 260 + this.level * 12;
    for (let k = -1; k <= 1; k++) {
      const aa = a + k * 0.12;
      this.game.enemyBullets.push(new Bullet(
        this.x, this.y,
        Math.cos(aa) * sp, Math.sin(aa) * sp,
        { friendly: false, radius: 5, damage: 1, color: '#ffb84d' }
      ));
    }
  }

  damage(d) {
    this.hp -= d;
    if (this.hp <= 0) this.die();
  }

  die() {
    const g = this.game;
    g.score += this.isMini ? 1500 : 5000;
    spawnExplosion(g.particles, this.x, this.y, this.isMini ? '#8be9fd' : '#ff79c6', 70);
    // Boss ดรอปไอเทมคุ้มกันแน่นอน
    g.items.push(new Item(this.x - 20, this.y, 'heal'));
    if (Math.random() < 0.6) g.items.push(new Item(this.x + 20, this.y, 'power'));
    g.boss = null; // LevelDirector จะตรวจเห็นแล้วเริ่มเฟสถัดไป
  }

  draw(ctx, now) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const r = this.radius;
    const main = this.isMini ? '#8be9fd' : '#ff79c6';

    // วงแหวนหมุนรอบตัว
    ctx.shadowColor = main;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = this.isMini ? 'rgba(139,233,253,0.9)' : 'rgba(255,121,198,0.9)';
    ctx.lineWidth = 5;
    const rot = now * (this.isMini ? 1.2 : 0.8);
    for (let i = 0; i < 8; i++) {
      const a0 = rot + i * Math.PI / 4;
      ctx.beginPath();
      ctx.arc(0, 0, r, a0, a0 + Math.PI / 6);
      ctx.stroke();
    }

    // ตัว
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.isMini ? '#0f2b3a' : '#2b0f2a';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();

    // ใจกลางเต้น
    const pulse = 0.7 + Math.sin(now * 6) * 0.3;
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
