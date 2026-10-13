// ===== input.js — คีย์บอร์ด (WASD + ลูกศร) =====
const Input = {
  keys: new Set(),
  game: null,

  down(...names) {
    return names.some((n) => this.keys.has(n));
  },

  init(game) {
    this.game = game;
    const map = {
      arrowleft: 'left', a: 'left',
      arrowright: 'right', d: 'right',
      arrowup: 'up', w: 'up',
      arrowdown: 'down', s: 'down',
    };

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k.startsWith('arrow') || k === ' ') e.preventDefault();
      if (map[k]) this.keys.add(map[k]);
      if (!e.repeat && this.game) this.game.onKey(k);
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (map[k]) this.keys.delete(map[k]);
    });

    // ปล่อยทุกปุ่มเมือหน้าต่างเสีย focus กันติดค้าง
    window.addEventListener('blur', () => this.keys.clear());
  },
};
