// ===== bullet.js — กระสุนทั้งฝั่งเราและศัตรู =====
class Bullet {
  constructor(x, y, vx, vy, o = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = o.radius || 4;
    this.damage = o.damage || 1;
    this.color = o.color || '#7df9ff';
    this.friendly = o.friendly !== false;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  offscreen() {
    return (
      this.x < -30 || this.x > CONFIG.WIDTH + 30 ||
      this.y < -40 || this.y > CONFIG.HEIGHT + 40
    );
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = this.color;
    if (this.friendly) {
      // กระสุนเรา: เส้นยาวแนวตั้ง
      ctx.fillRect(this.x - 2, this.y - 7, 4, 12);
    } else {
      // กระสุนศัตรู: จุดกลม
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
