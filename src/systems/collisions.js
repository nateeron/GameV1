// ===== collisions.js — ตรวจชนแบบวงกลม + จัดการการชนทั้งหมดของด่าน =====
function circleHit(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy < r * r;
}

// เรียกใน Game.update ทุกเฟรม (เฉพาะตอน playing)
function updateCollisions(game) {
  const p = game.player;

  // 1) กระสุนเรา → ศัตรู
  for (const b of game.bullets) {
    if (b.dead) continue;
    for (const e of game.enemies) {
      if (e.dead) continue;
      if (circleHit(b, e)) {
        b.dead = true;
        const dead = e.hit(b.damage);
        if (dead) killEnemy(game, e);
        else spawnExplosion(game.particles, b.x, b.y, e.color, 5);
        break;
      }
    }
    if (!b.dead && game.boss && circleHit(b, game.boss)) {
      b.dead = true;
      game.boss.damage(b.damage);
      spawnExplosion(game.particles, b.x, b.y, '#ff79c6', 5);
    }
  }

  // 2) กระสุนศัตรู → ผู้เล่น
  if (p.invuln <= 0) {
    for (const b of game.enemyBullets) {
      if (!b.dead && circleHit(b, p)) {
        b.dead = true;
        if (p.hit()) {
          spawnExplosion(game.particles, p.x, p.y, '#4dc3ff', 14);
          if (p.hp <= 0) {
            spawnExplosion(game.particles, p.x, p.y, '#ffffff', 40);
            game.gameOver();
            return;
          }
        }
      }
    }

    // 3) ตัวศัตรูชนผู้เล่น (โดนทีเดียว)
    for (const e of game.enemies) {
      if (!e.dead && circleHit(e, p)) {
        e.dead = true;
        killEnemy(game, e, 0); // ไม่ให้คะแนนเพราะโดนชน
        if (p.hit()) {
          spawnExplosion(game.particles, p.x, p.y, '#4dc3ff', 14);
          if (p.hp <= 0) {
            spawnExplosion(game.particles, p.x, p.y, '#ffffff', 40);
            game.gameOver();
            return;
          }
        }
      }
    }
  }

  // 4) ผู้เล่นเก็บไอเทม
  for (const it of game.items) {
    if (!it.dead && circleHit(it, p)) {
      it.dead = true;
      it.applyTo(p, game.now);
      spawnExplosion(game.particles, it.x, it.y,
        (ITEM_TYPES[it.kind] || { color: '#fff' }).color, 10);
    }
  }
}

// จัดการตอนศัตรูตาย: คะแนน + โอกาสดรอปไอเทม
function killEnemy(game, e, score) {
  e.dead = true;
  if (score !== 0) game.score += e.score;
  game.saveData.totalKills += 1;
  spawnExplosion(game.particles, e.x, e.y, e.color, 16);

  // โอกาสดรอปไอเทม (ด่านสูงดรอปเยอะขึ้นเล็กน้อย)
  const chance = CONFIG.ITEM_DROP_CHANCE + (game.level - 1) * 0.01;
  if (Math.random() < chance) {
    const r = Math.random();
    const kind =
      r < 0.45 ? 'power' :
      r < 0.70 ? 'shield' :
      r < 0.90 ? 'rapid' : 'heal';
    game.items.push(new Item(e.x, e.y, kind));
  }
}
