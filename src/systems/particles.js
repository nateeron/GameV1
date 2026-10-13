// ===== particles.js — เอฟเฟกต์ระเบิด =====
class Particle {
  constructor(x, y, color) {
    const a = Math.random() * Math.PI * 2;
    const sp = 60 + Math.random() * 240;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(a) * sp;
    this.vy = Math.sin(a) * sp;
    this.life = 0.5 + Math.random() * 0.5;
    this.maxLife = this.life;
    this.size = 2 + Math.random() * 3;
    this.color = color;
    this.dead = false;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.restore();
  }
}

// ปล่อยระเบิดที่ตำแหน่ง (x, y) จำนวน count จุด
function spawnExplosion(particles, x, y, color, count) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}
