// ===== screens.js — หน้าจอ overlay: เริ่มเกม / เคลียร์ด่าน / แพ้ / พัก =====
// ทุกหน้าจอตึบบน canvas โดยตรง (ไม่ต้องใช้ DOM element เพิ่ม)

function drawOverlay(ctx, title, color, lines, hint) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,6,16,0.72)';
  ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // ชื่อ
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.font = 'bold 46px "Segoe UI", sans-serif';
  ctx.fillText(title, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 90);

  ctx.shadowBlur = 0;
  ctx.font = '18px "Segoe UI", sans-serif';
  ctx.fillStyle = '#dfe8ff';
  lines.forEach((ln, i) => {
    ctx.fillText(ln, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 30 + i * 28);
  });

  // คำแนะนำกระพริบ
  if (hint) {
    const blink = 0.55 + Math.sin(performance.now() / 300) * 0.45;
    ctx.globalAlpha = blink;
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 20px "Segoe UI", sans-serif';
    ctx.fillText(hint, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 110);
  }
  ctx.restore();
}

function drawMenuScreen(ctx, save) {
  drawOverlay(ctx, 'NEON STRIKER', '#7df9ff', [
    'ตะลุยด่าน • ยิงอัตโนมัติ • เก็บไอเทมอัพเกรดอาวุธ',
    'WASD / ลูกศร = เคลื่อนที่   •   P = พักเกม',
    '',
    'BEST SCORE ' + save.bestScore +
    '    HIGHEST LV ' + save.highestLevel +
    '    KILLS ' + save.totalKills,
  ], 'SPACE / คลิก = เริ่มเกม');
}

function drawLevelClearScreen(ctx, level, score) {
  drawOverlay(ctx, 'LEVEL ' + level + ' CLEAR', '#7dff9e', [
    'คะแนนตอนนี้: ' + score,
  ], 'SPACE = ไปด่าน ' + (level + 1));
}

function drawGameOverScreen(ctx, score, level, isRecord) {
  drawOverlay(ctx, 'GAME OVER', '#ff5d7d', [
    'SCORE ' + score + (isRecord ? '  ★ NEW RECORD' : ''),
    'ผ่านถึงด่าน ' + level,
  ], 'SPACE = ลองอีกครั้ง');
}

function drawPauseScreen(ctx) {
  drawOverlay(ctx, 'PAUSED', '#ffd166', ['เกมหยุดชั่วคราว'], 'P = เล่นต่อ');
}
