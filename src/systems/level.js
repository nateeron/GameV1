// ===== level.js — ผู้กำกับด่าน: คลื่นศัตรู → Mini Boss → Boss =====
// ลำดับของแต่ละด่าน (level):
//   phase 'wave'   : ยิงคลื่นศัตรู (จำนวนเพิ่มตามด่าน)
//   phase 'mini'   : Mini Boss ออกมา — ตายแล้วไป phase 'boss'
//   phase 'boss'   : Boss ใหญ่ — ตายแล้วด่านต่อไป (level++)
//
// ศัตรูเพิ่มทุกด่านตาม CONFIG.ENEMY (BASE_COUNT + COUNT_PER_LEVEL * (level-1))
class LevelDirector {
  constructor(game) {
    this.game = game;
    this.level = 1;
    this.resetLevel();
  }

  resetLevel() {
    this.phase = 'wave';
    this.waveLeft = this.totalForLevel();
    this.spawnTimer = 0.5;
  }

  // จำนวนศัตรูรวมของด่านนี้ (เพดานที่ MAX_COUNT)
  totalForLevel() {
    const n = CONFIG.ENEMY.BASE_COUNT +
      CONFIG.ENEMY.COUNT_PER_LEVEL * (this.level - 1);
    return Math.min(CONFIG.ENEMY.MAX_COUNT, n);
  }

  // จำนวนศัตรูที่ยิงพร้อมกันบนจอได้ (เพดาน MAX_ONSCREEN)
  concurrentLimit() {
    const n = 4 + Math.floor(this.level / 2);
    return Math.min(CONFIG.ENEMY.MAX_ONSCREEN, n);
  }

  update(dt) {
    const g = this.game;

    if (this.phase === 'wave') {
      // สุ่มปล่อยศัตรูจนกว่าจะหมดควอต้า
      this.spawnTimer -= dt;
      const onscreen = g.enemies.length;
      if (this.waveLeft > 0 && onscreen < this.concurrentLimit() &&
          this.spawnTimer <= 0) {
        this.spawnOne();
        this.waveLeft -= 1;
        this.spawnTimer = CONFIG.ENEMY.SPAWN_INTERVAL * Math.max(0.4, 1 - this.level * 0.05);
      }
      // คลื่นหมด + ศัตรูบนจอเหลือศูนย์ → ส่ง Mini Boss
      if (this.waveLeft <= 0 && g.enemies.length === 0) {
        this.phase = 'mini';
        g.boss = new Boss(this.level, true, g);
      }
      return;
    }

    // phase 'mini' / 'boss' — รอ Boss ตาย (Boss.die() จะตั้ง g.boss = null)
    if (g.boss === null) {
      if (this.phase === 'mini') {
        this.phase = 'boss';
        g.boss = new Boss(this.level, false, g);
      } else {
        this.clearLevel();
      }
    }
  }

  // เลือกรูปแบบศัตรูตามด่าน: ด่านต่ำเป็น drifter เป็นหลัก,
  // ด่านสูงค่อยๆ มี weaver/shooter แทรกมากขึ้น (ต้องใช้ไหวพริบหลบ)
  spawnOne() {
    const g = this.game;
    const roll = Math.random();
    const lv = this.level;

    let type = 'drifter';
    if (roll < 0.12 + lv * 0.05) type = 'shooter';
    else if (roll < 0.3 + lv * 0.06) type = 'weaver';

    // ตำแหน่งกระจายในแนวนอน เผื่อช่องว่างตรงกลาง
    const margin = 60;
    const x = margin + Math.random() * (CONFIG.WIDTH - margin * 2);
    g.enemies.push(new Enemy(x, -30, type, lv));
  }

  clearLevel() {
    const g = this.game;
    g.score += 1000 * this.level; // โบนัสเคลียร์ด่าน
    g.level++;
    this.level = g.level;
    this.resetLevel();
  }
}
