// ===== main.js — Game class: จัดการสถานะ/loop/วาด/เชื่อมทุก module =====
// state: 'menu' | 'playing' | 'levelclear' | 'paused' | 'gameover'

class Game {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');

    // ข้อมูลเซฟ (bestScore / highestLevel / totalKills) — killEnemy จะ += totalKills ให้
    this.saveData = Save.load();

    // ค่าเริ่มต้น
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
    this.now = 0;          // เวลาในเกม (วินาที) — เดินเฉพาะตอน playing
    this.state = 'menu';
    this.isRecord = false;
    this.scroll = 0;       // สำหรับเลื่อนพื้นหลัง

    // arrays วัตถุ
    this.bullets = [];       // กระสุนเรา
    this.enemyBullets = [];  // กระสุนศัตรู
    this.items = [];
    this.enemies = [];
    this.particles = [];
    this.boss = null;

    // วัตถุด้นหลัง (ดาวลอย)
    this.stars = [];
    for (let i = 0; i < 46; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.WIDTH,
        y: Math.random() * CONFIG.HEIGHT,
        s: 1 + Math.random() * 2,
        sp: 18 + Math.random() * 55,
      });
    }

    this.setupRun();        // สร้าง player + director ให้พร้อม (menu ยังไม่เล่น)
    Input.init(this);       // ต่อคีย์บอร์ด

    // คลิกเพื่อเริ่ม/ต่อไป (ตาม hint "SPACE / คลิก")
    this.canvas.addEventListener('click', () => {
      if (this.state === 'menu' || this.state === 'gameover') this.startGame();
      else if (this.state === 'levelclear') this.state = 'playing';
    });

    // loop หลัก
    let last = performance.now();
    const loop = (t) => {
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05;   // กันกระตุกเวลาสลับแท็บ
      if (dt < 0) dt = 0;
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ตั้งค่ารอบเกมใหม่ (ใช้ตอนเริ่ม / เริ่มใหม่)
  setupRun() {
    this.player = new Player();
    this.director = new LevelDirector(this);
    this.bullets.length = 0;
    this.enemyBullets.length = 0;
    this.items.length = 0;
    this.enemies.length = 0;
    this.particles.length = 0;
    this.boss = null;
  }

  startGame() {
    this.score = 0;
    this.level = 1;
    this.prevLevel = 1;
    this.now = 0;
    this.isRecord = false;
    this.setupRun();
    this.state = 'playing';
  }

  // คีย์กด (จาก Input) — ' ' = space, 'p' = พัก
  onKey(k) {
    if (k === 'p') {
      if (this.state === 'playing') this.state = 'paused';
      else if (this.state === 'paused') this.state = 'playing';
      return;
    }
    if (k !== ' ') return;
    if (this.state === 'menu' || this.state === 'gameover') this.startGame();
    else if (this.state === 'levelclear') this.state = 'playing';
  }

  enterLevelClear() {
    this.state = 'levelclear';
    // ล้างกระสุนที่ค้าง (ทั้งเรา/ศัตรู) ให้หน้าตาสะอาด — เก็บไอเทม+ระเบิดไว้
    this.bullets.length = 0;
    this.enemyBullets.length = 0;
    this.enemies.length = 0;
  }

  gameOver() {
    if (this.state === 'gameover') return; // กันซ้ำ
    this.state = 'gameover';
    this.isRecord = this.score > this.saveData.bestScore; // เทียบก่อนอัปเดต
    this.saveData.bestScore = Math.max(this.saveData.bestScore, this.score);
    this.saveData.highestLevel = Math.max(this.saveData.highestLevel, this.level);
    Save.write(this.saveData);
  }

  update(dt) {
    // ดาวลอย — เดินตลอดเวลาเพื่อให้พื้นหลังมีชีวิต
    for (const s of this.stars) {
      s.y += s.sp * dt;
      if (s.y > CONFIG.HEIGHT) { s.y = 0; s.x = Math.random() * CONFIG.WIDTH; }
    }

    if (this.state === 'playing') {
      this.now += dt;
      this.player.update(dt, Input, this, this.now);
      for (const e of this.enemies) e.update(dt, this);
      if (this.boss) this.boss.update(dt);
      for (const b of this.bullets) b.update(dt);
      for (const b of this.enemyBullets) b.update(dt);
      for (const it of this.items) it.update(dt);
      for (const pt of this.particles) pt.update(dt);

      this.director.update(dt);
      updateCollisions(this);
      this.cull();

      // ด่านจบ (director เพิ่ม level เอง) → ไปหน้า LEVEL CLEAR
      if (this.level > this.prevLevel) {
        this.prevLevel = this.level;
        this.enterLevelClear();
      }
    } else if (this.state === 'levelclear') {
      // ช่วงพัก: animate เฉพาะระเบิดให้ดูสวย
      for (const pt of this.particles) pt.update(dt);
      this.particles = this.particles.filter((pt) => !pt.dead);
    }
  }

  // ตัดวัตถุที่ตาย/ออกจอ (สำคัญ: level.js ตรวจ enemies.length === 0)
  cull() {
    this.bullets = this.bullets.filter((b) => !b.dead && !b.offscreen());
    this.enemyBullets = this.enemyBullets.filter((b) => !b.dead && !b.offscreen());
    this.items = this.items.filter((it) => !it.dead && it.y < CONFIG.HEIGHT + 30);
    this.enemies = this.enemies.filter((e) => !e.dead && e.y < CONFIG.HEIGHT + 40);
    this.particles = this.particles.filter((pt) => !pt.dead);
  }

  drawBackground(ctx) {
    ctx.clearRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    // ดาวลอย
    ctx.fillStyle = 'rgba(160,190,255,0.55)';
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + (s.s / 3) * 0.5;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // กริดเลื่อนล่าง (ความรู้สึกบินไปข้างหน้า)
    const grid = 44;
    const off = (this.scroll % grid) || 0;
    if (this.state === 'playing') this.scroll += 60 * 0.016; // เลื่อนช้าๆ
    ctx.strokeStyle = 'rgba(90,120,200,0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= CONFIG.WIDTH; x += grid) { ctx.moveTo(x, 0); ctx.lineTo(x, CONFIG.HEIGHT); }
    for (let y = off - grid; y <= CONFIG.HEIGHT; y += grid) { ctx.moveTo(0, y); ctx.lineTo(CONFIG.WIDTH, y); }
    ctx.stroke();
  }

  render() {
    const ctx = this.ctx;
    this.drawBackground(ctx);

    for (const pt of this.particles) pt.draw(ctx);
    for (const it of this.items) it.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx, this.now);
    for (const b of this.bullets) b.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    this.player.draw(ctx, this.now);

    // HUD (แสดงตอนอยู่ในเกม)
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'levelclear') {
      drawHUD(ctx, this);
    }

    // หน้าจอ overlay ตามสถานะ
    if (this.state === 'menu') drawMenuScreen(ctx, this.saveData);
    else if (this.state === 'levelclear') drawLevelClearScreen(ctx, this.level - 1, this.score);
    else if (this.state === 'gameover') drawGameOverScreen(ctx, this.score, this.level, this.isRecord);
    else if (this.state === 'paused') drawPauseScreen(ctx);
  }
}

// จุดเริ่ม — สร้างเมื่อโหลดหน้าเสร็จ
window.addEventListener('DOMContentLoaded', () => { new Game(); });
