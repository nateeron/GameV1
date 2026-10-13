// ===== item.js — ไอเทมดรอป อัพเกรดอาวุธ / ปกป้องผู้เล่น =====
const ITEM_TYPES = {
  power:  { color: '#7dff9e', label: 'P' }, // อัพเกรดอาวุธ
  shield: { color: '#4dc3ff', label: 'S' }, // เกราะกันโดน 1 ครั้ง
  heal:   { color: '#ff6b8a', label: 'H' }, // ฟื้นเลือด 1
  rapid:  { color: '#ffd166', label: 'R' }, // ยิงเร็วขึ้นชั่วคราว
};

class Item {
  constructor(x, y, kind) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.radius = 12;
    this.vy = 85;
    this.t = Math.random() * 6;
    this.dead = false;
  }

  update(dt) {
    this.t += dt;
    this.y += this.vy * dt;
    this.x += Math.sin(this.t * 3) * 0.5;
  }

  applyTo(player, now) {
    switch (this.kind) {
      case 'power':
        player.weapon = Math.min(CONFIG.WEAPON_MAX, player.weapon + 1);
        break;
      case 'shield':
        player.shield = true;
        break;
      case 'heal':
        player.hp = Math.min(CONFIG.PLAYER.MAX_HP, player.hp + 1);
        break;
      case 'rapid':
        player.rapidUntil = now + CONFIG.RAPID_DURATION;
        break;
    }
  }

  draw(ctx) {
    const info = ITEM_TYPES[this.kind] || { color: '#fff', label: '?' };
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = info.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(10,16,30,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = info.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = info.color;
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(info.label, 0, 1);
    ctx.restore();
    ctx.textBaseline = 'alphabetic';
  }
}
