// Crimbo Panic intro movie: six pixel-art scenes with typewriter dialogue, in the
// style of old console game intros. Self-contained: create one with a canvas 2D
// context, then call update() 60 times a second and draw() every frame.
//
//   const intro = CrimboIntro.create(ctx);
//   intro.update(); intro.draw(W, H);   // W must be 144, H 256 or taller
//   intro.next();                       // jump to the next scene
//   intro.done                          // true once the last scene has finished
(function () {
  // ---------- Pixel helpers ----------
  const PAL = {
    R: '#d62839', r: '#9e1b2a', W: '#ffffff', S: '#f2c09b', s: '#d99a74', K: '#1b1b1b',
    G: '#f7c843', g: '#b8862b', B: '#7a4a24', b: '#4f2f17', N: '#e23b3b', P: '#ff6b6b',
    H: '#808080', O: '#ff9a3c',
  };
  function sprite(rows, map) {
    const c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const x = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, i) => {
      const col = (map && map[ch]) || PAL[ch];
      if (ch !== '.' && col) { x.fillStyle = col; x.fillRect(i, y, 1, 1); }
    }));
    return c;
  }
  const silhouette = (rows, col) => sprite(rows.map(r => r.replace(/[^.]/g, 'Z')), { Z: col });
  let C; // current context
  const R = (col, x, y, w = 1, h = 1) => { C.fillStyle = col; C.fillRect(Math.round(x), Math.round(y), w, h); };
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- 3x5 pixel font ----------
  const FONT = {
    '0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111',
    '4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010',
    '8':'111101111101111','9':'111101111001111',
    A:'010101111101101',B:'110101110101110',C:'011100100100011',D:'110101101101110',
    E:'111100111100111',F:'111100110100100',G:'011100101101011',H:'101101111101101',
    I:'111010010010111',J:'001001001101010',K:'101101110101101',L:'100100100100111',
    M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',
    Q:'010101101110011',R:'110101110101101',S:'011100010001110',T:'111010010010010',
    U:'101101101101111',V:'101101101101010',W:'101101111111101',X:'101101010101101',
    Y:'101101010010010',Z:'111001010100111',' ':'000000000000000','!':'010010010000010',
    "'":'010010000000000',',':'000000000010100','.':'000000000000010','*':'101010101000000',
    '?':'111001010000010','-':'000000111000000',':':'000010000010000',
  };
  function text(str, x, y, col = '#fff', scale = 1, shadow = '#05070f') {
    str = String(str).toUpperCase();
    [[shadow, scale], [col, 0]].forEach(([c, off]) => {
      C.fillStyle = c;
      [...str].forEach((ch, i) => {
        const g = FONT[ch] || FONT[' '];
        for (let p = 0; p < 15; p++) if (g[p] === '1')
          C.fillRect(Math.round(x) + i * 4 * scale + (p % 3) * scale + off, Math.round(y) + Math.floor(p / 3) * scale + off, scale, scale);
      });
    });
  }
  const textC = (str, cx, y, col, scale = 1, shadow) => text(str, cx - (String(str).length * 4 * scale - scale) / 2, y, col, scale, shadow);
  function wrap(str, max) {
    const lines = []; let line = '';
    str.split(' ').forEach(w => {
      if ((line + ' ' + w).trim().length > max) { lines.push(line); line = w; } else line = (line + ' ' + w).trim();
    });
    lines.push(line);
    return lines;
  }

  // ---------- Sprites ----------
  const SANTA_HEAD = [
    '...RRRRR....',
    '..RRRRRRRW..',
    '..RRRRRRRWW.',
    '.WWWWWWWW...',
    '..SSSKSSK...',
    '..SSSSSSSN..',
  ];
  const santaWalkA = sprite([...SANTA_HEAD,
    '.WWWWWWWWW..',
    '.WWWWWWWWW..',
    'RRWWWWWWWRR.',
    'RRRWWWWWRRR.',
    'SRRRRRRRRRS.',
    '.KKKKGKKKK..',
    '.RRRRRRRRR..',
    '.RRR...RRR..',
    '.RRR...RRR..',
    '.KKK...KKKK.',
    '.KKKK..KKKK.',
  ]);
  const santaWalkB = sprite([...SANTA_HEAD,
    '.WWWWWWWWW..',
    '.WWWWWWWWW..',
    'RRWWWWWWWRR.',
    'RRRWWWWWRRR.',
    'SRRRRRRRRRS.',
    '.KKKKGKKKK..',
    '.RRRRRRRRR..',
    '..RRR.RRR...',
    '...RRRRR....',
    '...KKKKK....',
    '..KKKKKKK...',
  ]);
  const santaTopless = sprite([...SANTA_HEAD,
    '.WWWWWWWWW..',
    '..WWWWWWW...',
    '.SSSWWWSSS..',
    'SSSSSSSSSSS.',
    'SSsSSSSSsSS.',
    '.SSSSSSSSS..',
    '.SSSSsSSSS..',
    '.KKKKGKKKK..',
    '.RRR...RRR..',
    '.RRR...RRR..',
    '.KKKK..KKKK.',
  ]);
  function lad(hair, jumper) {
    return sprite([
      '..HHHHH...',
      '.HHHHHHH..',
      '.HSSSSSH..',
      '..SKSSK...',
      '..SSSSS...',
      '...SSS....',
      '.JJJJJJJ..',
      'JJJJJJJJJ.',
      'JJJJJJJJJ.',
      'SJJJJJJJS.',
      '.JJJJJJJ..',
      '.TTT.TTT..',
      '.TTT.TTT..',
      '.TTT.TTT..',
      '.KKK.KKK..',
    ], { H: hair, J: jumper, T: '#2b3a67' });
  }
  const lad1 = lad('#4f2f17', '#2e7d32'), lad2 = lad('#e8c14a', '#2f6fd6');
  const MRS = [
    '...WWWW...',
    '..WWWWWW..',
    '.WWSSSSWW.',
    '.WKKSKKSW.',
    '.WSSSSSSW.',
    '..SSMMSS..',
    '...SSSS...',
    '..RRRRRR..',
    '.RRRWWRRR.',
    'RRRRRRRRRR',
  ];
  const mrsA = sprite(MRS, { M: '#9e1b2a' }), mrsB = sprite(MRS, { M: '#f2c09b' });
  // Santa's sleigh and reindeer, as in the game (and an empty one without Santa)
  const SLEIGH = [
    '......RRW..................',
    '.....RRRRW...........B.B...',
    '....RRRRR............BbB...',
    '....SSKSS............bB....',
    '....WWWWW...........BBBN...',
    '..GGRRRRRRSHHHHHHHHBBBBB...',
    '.GRRRRRRRRRRRRRGG..BBBB....',
    '.GRRRRRRRRRRRRRG.BBBBBB....',
    '..GRRRRGGRRRRRG..BBBBBB....',
    '...GRRRRRRRRRG...B.B..B....',
    '....GGGGGGGGG...B...B......',
    '..g..gg.....g..............',
    '...gggggggggggg............',
  ];
  const EMPTY_SLEIGH = SLEIGH.map((row, y) => y < 5 ? '...........' + row.slice(11) : y === 5 ? '..GG.......' + row.slice(11) : row);
  const emptySleigh = sprite(EMPTY_SLEIGH);
  const sleighShadow = silhouette(SLEIGH, '#05070f');

  // ---------- Shared bits of scenery ----------
  const STARS = Array.from({ length: 30 }, (_, k) => [(k * 53) % 128, (k * 37) % 60, k * 7]);
  function sky(t, top = '#0b1026', mid = '#111a3a', low = '#18244d') {
    R(top, 0, 0, 128, 30); R(mid, 0, 30, 128, 30); R(low, 0, 60, 128, 36);
    STARS.forEach(([x, y, k]) => { if ((t + k) % 70 < 58) R('#fff7c2', x, y); });
  }
  function pint(x, y) {
    R('#fff7e0', x, y, 4, 1); R('#f2a93b', x, y + 1, 4, 5); R('#c77d1a', x + 3, y + 1, 1, 5); R('#ffe0a0', x, y + 1, 1, 4);
  }
  const PRESENT_COLS = [['#d62839', '#f7c843'], ['#2e9e44', '#ff4d4d'], ['#2f6fd6', '#ffffff'], ['#8e44c9', '#f7c843'], ['#ff6fae', '#ffffff'], ['#1fb5a8', '#ffe680']];
  function present(x, y, k) {
    const [p, r] = PRESENT_COLS[k % PRESENT_COLS.length];
    R(p, x, y, 5, 5); R(r, x + 2, y, 1, 5); R(r, x, y + 2, 5, 1); R(r, x + 1, y - 1); R(r, x + 3, y - 1);
  }
  function drawRot(img, x, y, ang, ox = img.width / 2, oy = img.height / 2) {
    C.save(); C.translate(Math.round(x), Math.round(y)); C.rotate(ang); C.drawImage(img, -ox, -oy); C.restore();
  }
  function pubInside(t, disco) {
    R('#5a3420', 0, 0, 128, 96);
    for (let x = 0; x < 128; x += 16) R('#4d2b19', x, 0, 1, 50);         // wood panels
    R('#3e2414', 0, 50, 128, 20); R('#2a1a10', 0, 70, 128, 26);          // wainscot + floor
    for (let x = 0; x < 128; x += 10) R('#24160d', x, 70, 1, 26);
    [[22, 8], [104, 8]].forEach(([x, y]) => { R('#7a4a24', x - 6, y - 3, 13, 9); R('#ffcf7a', x - 3, y, 7, 3); R('#3e2414', x, 0, 1, y - 3); });
    // bar with taps and bottles
    R('#2b1a0e', 2, 22, 30, 2);
    ['#2e9e44', '#d62839', '#f7c843', '#2f6fd6', '#8e44c9', '#2e9e44'].forEach((c, i) => { R(c, 4 + i * 5, 15, 2, 7); R(c, 4 + i * 5, 13, 1, 2); });
    R('#6b3a1e', 0, 46, 34, 24); R('#8a5530', 0, 44, 36, 3);
    R('#f7c843', 8, 38, 2, 6); R('#f7c843', 16, 38, 2, 6); R('#f7c843', 24, 38, 2, 6);
    // dartboard
    R('#1b1b1b', 104, 24, 12, 12); R('#d62839', 106, 26, 8, 8); R('#e8d2a6', 108, 28, 4, 4); R('#2e9e44', 109, 29, 2, 2);
    if (disco) {
      const cols = ['rgba(255,60,90,0.28)', 'rgba(60,140,255,0.28)', 'rgba(255,220,60,0.28)', 'rgba(80,255,140,0.28)'];
      for (let i = 0; i < 4; i++) {
        C.fillStyle = cols[(i + Math.floor(t / 10)) % 4];
        const bx = ((i * 37 + t * 1.5) % 160) - 16;
        C.beginPath(); C.moveTo(64, 0); C.lineTo(bx - 10, 96); C.lineTo(bx + 10, 96); C.closePath(); C.fill();
      }
    }
  }
  function table() {
    R('#8a5530', 34, 64, 60, 3); R('#6b3a1e', 34, 67, 60, 1);
    R('#4f2f17', 38, 68, 3, 14); R('#4f2f17', 87, 68, 3, 14);
  }

  // ---------- Scenes ----------
  // Each scene: how long it lasts (frames at 60/s), an optional caption above the
  // picture, the dialogue lines (when they start and who says them), and a picture.
  const SCENES = [
    { // 1. Santa leaves home to escape Mrs Claus's nagging
      dur: 360, caption: 'CHRISTMAS EVE EVE',
      lines: [{ at: 50, who: 'SANTA', text: "I can't be arsed with her nagging. I'm off down the pub!" }],
      draw(t) {
        sky(t);
        R('#dfe8f5', 0, 74, 128, 22); R('#ffffff', 0, 74, 128, 2);
        // house
        R('#e8d2a6', 8, 40, 64, 36); R('#d4b98a', 8, 72, 64, 4);
        for (let k = 0; k <= 18; k++) { const w = 8 + k * 4; R(k < 4 ? '#ffffff' : '#7a2e22', 40 - w / 2, 22 + k, w, 1); R('#ffffff', 40 - w / 2, 22 + k, 2, 1); R('#ffffff', 40 + w / 2 - 2, 22 + k, 2, 1); }
        R('#8c3b2c', 56, 16, 7, 14); R('#ffffff', 55, 15, 9, 2);
        [0, 1, 2].forEach(i => { const a = (t + i * 30) % 90; R(`rgba(200,205,215,${(1 - a / 90) * 0.7})`, 58 + a / 10, 12 - a / 4, 3 + a / 30, 3 + a / 30); });
        // window with Mrs Claus nagging
        R('#6b4a2a', 14, 46, 20, 18); R('#ffd27a', 16, 48, 16, 14);
        C.drawImage(Math.floor(t / 6) % 2 ? mrsA : mrsB, 19, 50);
        R('#6b4a2a', 16, 60, 16, 2);
        if (t > 10) ['NAG', 'NAG!', 'NAG'].forEach((w, i) => {
          if ((Math.floor(t / 16) + i) % 3) text(w, [2, 26, 14][i], [36, 30, 24][i] - ((t + i * 13) % 40) / 10, '#ff9ad5');
        });
        // open front door with warm light, wreath
        R('#2a1a10', 46, 52, 12, 24); R('#ffb347', 47, 53, 10, 23);
        C.fillStyle = 'rgba(255,179,71,0.35)'; C.beginPath(); C.moveTo(46, 76); C.lineTo(58, 76); C.lineTo(66, 92); C.lineTo(40, 92); C.fill();
        R('#2e7d32', 49, 46, 6, 5); R('#5a3420', 51, 48, 2, 1); R('#d62839', 51, 50, 2, 1);
        // Santa storms off to the right
        const p = clamp01((t - 20) / 150);
        const moving = p > 0 && p < 1;
        C.drawImage(moving && Math.floor(t / 7) % 2 ? santaWalkB : santaWalkA, Math.round(lerp(46, 98, p)), 59);
        if (!moving && t > 175 && (t % 40) < 20) R('rgba(255,255,255,0.7)', 111, 62, 2, 2); // huff of breath
      },
    },
    { // 2. One pint with the lads
      dur: 260,
      lines: [{ at: 40, who: 'SANTA', text: "Sorry lads, I'm only having one." }],
      draw(t) {
        pubInside(t, false);
        C.drawImage(lad1, 30, 52); C.drawImage(lad2, 88, 52);
        C.drawImage(santaWalkA, 58, 48);
        table();
        pint(42, 58); pint(84, 58);
        const lift = Math.sin(t / 30) > 0.6 ? 4 : 0;   // Santa takes a swig now and then
        pint(70, 56 - lift); R('#f2c09b', 69, 60 - lift, 2, 2);
      },
    },
    { // 3. Several pints later: topless on the table, crowd cheering
      dur: 330, caption: '3 HOURS LATER...',
      lines: [{ at: 40, who: 'CROWD', text: 'WAHEY!!! Go on Santa!' }],
      draw(t) {
        pubInside(t, true);
        table();
        const bounce = -Math.abs(Math.sin(t / 7)) * 3, sway = Math.sin(t / 14) * 2;
        const sx = 58 + sway, sy = 47 + bounce;
        C.drawImage(santaTopless, Math.round(sx), Math.round(sy));
        // arm up with a sloshing pint, other arm waving
        R('#f2c09b', sx + 10, sy + 4, 2, 6); pint(sx + 10, sy - 2);
        if (t % 20 < 10) { R('#f7c843', sx + 9, sy - 4); R('#f7c843', sx + 15, sy - 3); }
        const wave = Math.floor(t / 10) % 2;
        R('#f2c09b', sx - 3, sy + (wave ? 4 : 8), 3, 2); R('#f2c09b', sx - 4, sy + (wave ? 2 : 9), 2, 2);
        // crowd in the foreground, arms going up and down
        for (let i = 0; i < 9; i++) {
          const hx = i * 15 - 2, hy = 82 + (Math.floor(t / 8 + i) % 2) * 2;
          R('#120a18', hx, hy, 9, 14); R('#120a18', hx + 1, hy - 2, 7, 2);
          if ((Math.floor(t / 9) + i) % 2) { R('#120a18', hx - 2, hy - 8, 2, 9); R('#120a18', hx + 9, hy - 8, 2, 9); }
        }
        [['WAHEY!', 10, 60, 0], ['CHEERS!', 84, 58, 25], ['GET IN!', 46, 70, 50]].forEach(([w, x, y, k]) => {
          if ((t + k) % 75 < 45) text(w, x, y, '#ffe680');
        });
      },
    },
    { // 4. Leaving the pub, refusing to listen
      dur: 440,
      lines: [
        { at: 20, who: 'BARMAN', text: "You're too pissed to fly, Santa!" },
        { at: 210, who: 'SANTA', text: "Don't worry about me!" },
      ],
      draw(t) {
        sky(t);
        R('#dfe8f5', 0, 78, 128, 18); R('#ffffff', 0, 78, 128, 2);
        // the pub
        R('#24402e', 0, 16, 72, 62); R('#1a3022', 0, 16, 72, 3); R('#ffffff', 0, 14, 72, 2);
        R('#ffcf7a', 6, 44, 16, 14); R('#1a3022', 13, 44, 2, 14); R('#ffcf7a', 50, 44, 16, 14); R('#1a3022', 57, 44, 2, 14);
        R('#1b1b1b', 16, 24, 40, 11); R('#b8862b', 16, 24, 40, 1); R('#b8862b', 16, 34, 40, 1);
        textC('THE HOLLY', 36, 27, '#f7c843');
        R('#2a1a10', 28, 54, 14, 24); R('#ffb347', 29, 55, 12, 23);
        // the barman shouting from inside
        if (t >= 20 && t < 200) {
          R('#ffffff', 40, 38, 16, 9); R('#ffffff', 41, 37, 14, 11); R('#ffffff', 39, 47, 3, 3); R('#ffffff', 38, 50, 2, 2);
          text('!!!', 42, 40, '#d62839', 1, '#ffffff');
        }
        // sleigh waiting
        C.drawImage(emptySleigh, 96, 66);
        // Santa staggers towards it, hiccupping
        const p = clamp01((t - 60) / 300);
        const sx = lerp(30, 82, p) + Math.sin(t / 9) * 3, ang = Math.sin(t / 11) * 0.25;
        drawRot(Math.floor(t / 9) % 2 ? santaWalkB : santaWalkA, sx + 6, 78, ang, 6, 17);
        if (t % 70 > 50) text('HIC!', sx + 8, 50, '#ffffff');
      },
    },
    { // 5. Silhouette flight across the moon, then the crash
      dur: 320,
      lines: [
        { at: 15, who: 'SANTA', text: 'WHEEEEEEEE!' },
        { at: 165, who: 'SANTA', text: 'Uh oh...' },
      ],
      draw(t) {
        sky(t, '#0b1026', '#141f45', '#1d2b5c');
        // big moon
        for (let dy = -26; dy <= 26; dy++) { const w = Math.round(Math.sqrt(26 * 26 - dy * dy)); R('#fff3c4', 64 - w, 40 + dy, w * 2, 1); }
        R('#efe0a8', 50, 30, 6, 5); R('#efe0a8', 72, 46, 8, 6); R('#efe0a8', 66, 22, 4, 3);
        // town rooftops silhouette
        for (let i = 0; i < 9; i++) { const hx = i * 15 - 4, hh = 14 + ((i * 7) % 4) * 4; R('#070b1a', hx, 96 - hh, 14, hh); R('#070b1a', hx + 2, 96 - hh - 4, 10, 4); if (i % 2) R('#ffd27a', hx + 5, 96 - hh + 5, 2, 2); }
        let x, y, ang;
        if (t < 170) {                       // all over the place, with a loop-the-loop
          x = -30 + t * 0.78; y = 34 + Math.sin(t / 9) * 12 + Math.sin(t / 23) * 6; ang = Math.cos(t / 9) * 0.6;
          if (t > 80 && t < 120) { const a = (t - 80) / 40 * Math.PI * 2; ang += a; y += -Math.sin(a) * 10; }
        } else if (t < 235) {                // nose dive, tumbling
          const d = (t - 170) / 65;
          x = lerp(102, 70, d); y = lerp(34, 92, d * d); ang = d * 9;
        }
        if (t < 235) drawRot(sleighShadow, x, y, ang);
        if (t >= 235) {                      // impact
          const k = t - 235;
          if (k < 10) { C.fillStyle = `rgba(255,255,255,${1 - k / 10})`; C.fillRect(0, 0, 128, 96); }
          const shake = k < 40 ? (k % 4 < 2 ? 2 : -2) : 0;
          for (let i = 0; i < 8; i++) R('#ffffff', 66 + Math.cos(i) * k * 0.6, 88 - Math.abs(Math.sin(i * 1.7)) * k * 0.5, 2, 2);
          textC('CRASH!', 64 + shake, 46, '#d62839', 3, '#ffffff');
        }
      },
    },
    { // 6. The morning after: presents everywhere
      dur: 360,
      lines: [{ at: 120, who: 'SANTA', text: 'Oh sh*t.' }],
      draw(t) {
        sky(t, '#0b1026', '#111a3a', '#141f45');
        // the town below, presents scattered over roofs and streets
        const HOUSES = [[0, 44, 18], [16, 50, 16], [30, 40, 20], [48, 48, 16], [62, 42, 18], [78, 46, 16], [92, 38, 20], [110, 47, 18]];
        HOUSES.forEach(([hx, top, w], i) => {
          R('#3d4f8a', hx, top, w, 70 - top); R('#2c3b6b', hx + w - 2, top, 2, 70 - top); R('#ffffff', hx - 1, top - 2, w + 2, 2);
          R((t + i * 9) % 90 < 80 ? '#ffd27a' : '#3d4f8a', hx + 4, top + 6, 3, 3); R('#ffd27a', hx + w - 7, top + 12, 3, 3);
        });
        R('#c3cfe2', 0, 66, 128, 6);
        [[6, 39], [20, 45], [35, 35], [44, 62], [53, 43], [66, 37], [74, 63], [83, 41], [97, 33], [104, 64], [115, 42], [26, 63], [60, 60], [120, 62], [12, 60], [90, 60]]
          .forEach(([px, py], k) => present(px, py, k));
        // snowy hill in front
        for (let x = 0; x < 128; x++) { const y = 74 + Math.round(Math.sin(x / 18) * 3); R('#eef3fa', x, y, 1, 96 - y); R('#ffffff', x, y, 1, 1); }
        // crashed sleigh, nose in the snow, a runner snapped off
        drawRot(emptySleigh, 34, 80, 0.45);
        R('#b8862b', 52, 88, 7, 1); R('#b8862b', 58, 87, 1, 1);
        R('#eef3fa', 20, 86, 34, 10);
        // Santa flat on his back with stars round his head
        drawRot(santaWalkA, 88, 84, -Math.PI / 2);
        for (let i = 0; i < 3; i++) { const a = t / 14 + i * 2.1; R('#ffe680', 80 + Math.cos(a) * 6, 79 + Math.sin(a) * 2, 2, 2); }
        if (t < 30) { C.fillStyle = `rgba(0,0,0,${1 - t / 30})`; C.fillRect(0, 0, 128, 96); }
      },
    },
  ];
  const WHO_COLS = { SANTA: '#ff6b6b', BARMAN: '#9be29b', CROWD: '#7cc4ef' };

  // ---------- The player ----------
  function create(ctx) {
    let scene = 0, t = 0;
    const intro = {
      get done() { return scene >= SCENES.length; },
      get scene() { return scene; },
      seek(s, f) { scene = s; t = f; },
      next() { scene++; t = 0; },
      update() { if (scene < SCENES.length && ++t >= SCENES[scene].dur) { scene++; t = 0; } },
      draw(W, H, hint = 'TAP TO SKIP') {
        if (scene >= SCENES.length) return;
        C = ctx;
        const S = SCENES[scene], oy = Math.floor((H - 256) / 2);
        R('#05070f', 0, 0, W, H);
        ctx.save(); ctx.translate(0, oy);
        if (S.caption) text(S.caption.slice(0, Math.floor(t / 3)), 8, 18, '#f7c843');
        // picture
        R('#b8862b', 7, 29, 130, 98); R('#05070f', 8, 30, 128, 96);
        ctx.save(); ctx.beginPath(); ctx.rect(8, 30, 128, 96); ctx.clip(); ctx.translate(8, 30);
        S.draw(t);
        ctx.restore();
        // dialogue box, typed out letter by letter
        R('#3a4a7a', 6, 136, 132, 62); R('#0b1026', 7, 137, 130, 60);
        const line = S.lines.filter(l => t >= l.at).pop();
        if (line) {
          text(line.who, 11, 141, WHO_COLS[line.who] || '#fff');
          const shown = Math.floor((t - line.at) / 2);
          let used = 0;
          wrap(line.text, 31).forEach((l, i) => {
            const part = l.slice(0, Math.max(0, shown - used)); used += l.length + 1;
            text(part, 11, 151 + i * 8, '#ffffff');
          });
        }
        // fade in and out between scenes
        const edge = Math.min(t, S.dur - t);
        if (edge < 15) { ctx.fillStyle = `rgba(5,7,15,${1 - edge / 15})`; ctx.fillRect(0, 0, W, 256); }
        if (hint && (t >> 5) % 2) textC(hint, W / 2, 230, '#5a6488');
        ctx.restore();
      },
    };
    return intro;
  }
  window.CrimboIntro = { create, sceneCount: SCENES.length };
})();
