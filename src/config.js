// ===== config.js — ค่าปรับทั้งหมดของเกมน่า (จุดเดียวที่แก้ balance) =====
const CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,

  PLAYER: {
    SPEED: 340,            // พิกเซล/วินาที
    RADIUS: 14,
    MAX_HP: 3,             // ชีวิต (หัวใจ)
    FIRE_COOLDOWN: 0.16,   // วินาทีต่อกระสุน (auto-fire)
    INVULN_TIME: 1.2,      // ใส้เหล็กหลังโดนยิง (วินาที)
  },

  WEAPON_MAX: 5,           // ระดับอาวุธสูงสุด

  ENEMY: {
    BASE_COUNT: 8,         // ศัตรูด่าน 1
    COUNT_PER_LEVEL: 4,    // เพิ่มกี่ตัวต่อด่าน
    MAX_COUNT: 40,         // เพดานจำนวน
    SPAWN_INTERVAL: 0.9,   // วินาทีต่อตัว (ลดลงตามด่าน)
    MAX_ONSCREEN: 8,       // จำนวนพร้อมกันบนจอ
  },

  BOSS: {
    MINI_BASE_HP: 60,
    MINI_HP_PER_LEVEL: 40,
    BASE_HP: 150,
    HP_PER_LEVEL: 90,
  },

  ITEM_DROP_CHANCE: 0.18,  // โอกาศดรอปไอเทมเมื่อศัตรูตาย
  RAPID_DURATION: 6,       // ไอเทม Rapid Fire อยู่กี่วินาที
  SAVE_KEY: 'neon-striker-save-v1',
};
