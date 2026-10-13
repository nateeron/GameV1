// ===== state.js — เก็บข้อมูลผู้เล่นลง localStorage =====
const Save = {
  defaults() {
    return { bestScore: 0, highestLevel: 1, totalKills: 0 };
  },

  load() {
    try {
      const raw = localStorage.getItem(CONFIG.SAVE_KEY);
      return Object.assign(this.defaults(), raw ? JSON.parse(raw) : {});
    } catch (e) {
      return this.defaults();
    }
  },

  write(data) {
    try {
      localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(data));
    } catch (e) { /* โหมด private / file:// ที่บล็อก storage ก็ข้ามไป */ }
  },
};
