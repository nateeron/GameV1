// ===== enemy.js — ศัตรู 3 แบบ: ลอยตรง / ส่าย / ยิงตอบโต้ =====
class Enemy {
  constructor(x, y, type, level) {
    this.type = type;
    this.level = level;
    this.x = x;
    this.y = y;
    this.baseX = x;
    this.t = Math.random() * 10;
    this.dead = false;

    this.radius = type === 'shooter' ? 16 : 14;

    // เลือดหนาขึ้นทุก 2 ด่าน
    const lvHp = 1 + Math.floor((level - 1) / 2);
    this.hp = (type === 'shooter' ? 2 : 1) * lvHp;
    this.maxHp = this.hp;

    this.speed = (type === 'drifter' ? 95 : 72) + level * 6;
    this.color =
      type === 'shooter' ? '#c792ea' :
      type === 'weaver' ? '#73d0ff' :
      '#8be9fd';
    this.score = type === 'shooter' ? 150 : type === 'weaver' ? 120 : 100;

    this.fireTimer = 1 + Math.random();
  }

  update(dt, game) {
    this.t += dt;
    this.y += this.speed * dt;

    if (this.type === 'weaver') {
      this.x = this.baseX + Math.sin(this.t * 2.2) * 70;
    }

    if (this.type === 'shooter') {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && this.y > 0 && this.y < CONFIG.HEIGHT * 0.7) {
        const p = game.player;
        const a = Math.atan2(p.y - this.y, p.x - this.x);
        const sp = 180 + this.level * 8;
        game.enemyBullets.push(new Bullet(
          this.x, this.y,
          Math.cos(a) * sp, Math.sin(a) * sp,
          { friendly: false, radius: 5, damage: 1, color: '#ff5d7d' }
        ));
        this.fireTimer = Math.max(0.9, 1.8 - this.level * 0.05);
      }
    }
  }

  hit(damage) {
    this.hp -= damage;
    return this.hp <= 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    const r = this.radius;
    if (this.type === 'weaver') {
      // รูปทึบ
      ctx.moveTo(0, -r); ctx.lineTo(r, 0); ctx.lineTo(0, r); ctx.lineTo(-r, 0);
    } else if (this.type === 'shooter') {
      // 육เหลี่ยม
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + Math.PI / 6;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else {
      // สามเหลี่ยมพุ่งลง
      ctx.moveTo(-r, -r * 0.7); ctx.lineTo(r, -r * 0.7); ctx.lineTo(0, r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // แถบเลือด (แสดงตอนถูกโจมตีแล้ว)
    if (this.hp < this.maxHp) {
      const w = 26;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 9, w, 3);
      ctx.fillStyle = '#7dff9e';
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 9, w * (this.hp / this.maxHp), 3);
    }
  }
}
