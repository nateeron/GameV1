// ===== hud.js — แถบข้อมูลในเกม (คะแนน / ด่าน / HP / อาวุธ / เลือด Boss) =====
function drawHUD(ctx, game) {
  const p = game.player;
  ctx.save();

  // พื้นหลังบนจอแบบจางๆ
  ctx.fillStyle = 'rgba(4,8,20,0.55)';
  ctx.fillRect(0, 0, CONFIG.WIDTH, 44);

  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';

  // คะแนน (ซ้าย)
  ctx.fillStyle = '#7df9ff';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE ' + game.score, 14, 22);

  // ด่าน + เฟส (กลาง)
  const phaseLabel = game.director
    ? { wave: 'WAVE', mini: 'MINI BOSS', boss: 'BOSS' }[game.director.phase]
    : '';
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.fillText('LV ' + game.level + '  •  ' + phaseLabel, CONFIG.WIDTH / 2, 22);

  // อาวุธ (ขวา)
  ctx.fillStyle = '#7dff9e';
  ctx.textAlign = 'right';
  ctx.fillText('WPN LV ' + p.weapon + '/' + CONFIG.WEAPON_MAX, CONFIG.WIDTH - 90, 22);

  // หัวใจ HP
  for (let i = 0; i < CONFIG.PLAYER.MAX_HP; i++) {
    const x = CONFIG.WIDTH - 74 + i * 22;
    ctx.fillStyle = i < p.hp ? '#ff6b8a' : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(x, 22, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // เกราะ (วงกลมรอบหัวใจ)
  if (p.shield) {
    ctx.strokeStyle = '#4dc3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CONFIG.WIDTH - 74 + (CONFIG.PLAYER.MAX_HP - 1) * 22, 22, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  // RAPID (ข้อความไฟใต้ HUD)
  if (p.rapidUntil > game.now) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('RAPID ' + Math.max(0, p.rapidUntil - game.now).toFixed(1) + 's', CONFIG.WIDTH - 14, 58);
  }

  // แถบ HP ของ Boss (ตอนมี Boss บนจอ)
  if (game.boss) {
    const b = game.boss;
    const w = 300, h = 12;
    const x = (CONFIG.WIDTH - w) / 2, y = 54;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = b.isMini ? '#8be9fd' : '#ff79c6';
    ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), h);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.isMini ? 'MINI BOSS' : 'BOSS', CONFIG.WIDTH / 2, y - 8);
  }

  ctx.restore();
}
