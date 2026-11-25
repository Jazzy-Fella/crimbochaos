// Xmas Panic intro movie: six pixel-art scenes with typewriter dialogue, in the
// style of old console game intros. Self-contained: create one with a canvas 2D
// context, then call update() 60 times a second and draw() every frame.
//
//   const intro = CrimboIntro.create(ctx, { tone, noise }); // sound makers optional
//   intro.update(); intro.draw(W, H);   // W must be 144, H 256 or taller
//   intro.next();                       // jump to the next scene
//   CrimboIntro.create(ctx, sound, 'ending')  // the ending movie instead (reaching 100 presents)
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
    '?':'111001010000010','-':'000000111000000',':':'000010000010000','(':'001010010010001',')':'100010010010100',
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
  const WHO_COLS = { SANTA: '#ff6b6b', BARMAN: '#9be29b', CROWD: '#7cc4ef', OFFICER: '#7cc4ef', CHILD: '#ff9ad5' };

  // ---------- Sound effects ----------
  // The game passes in its own tone() and noise() makers (so the Sound FX setting
  // applies); without them the intro is silent. Each scene's cue list runs once per
  // frame and plays sounds on exact frames.
  let T = () => {}, N = () => {};
  const crunch = () => N({ dur: 0.05, vol: 0.12, f: 2500 });
  const SCENE_SFX = [
    t => { // 1. door slam, footsteps in the snow, nagging squeaks
      if (t === 18) { N({ dur: 0.2, vol: 0.5, f: 300 }); T({ type: 'sine', f0: 90, f1: 45, dur: 0.18, vol: 0.3 }); }
      if (t >= 20 && t < 170 && (t - 20) % 14 === 0) crunch();
      if (t > 10 && t < 330 && t % 16 === 0) { T({ f0: 900, f1: 1300, dur: 0.05, vol: 0.025 }); T({ f0: 950, f1: 1400, dur: 0.05, vol: 0.025, delay: 0.08 }); }
    },
    t => { // 2. clinking glasses, Santa gulping his pint
      if (t === 25) { T({ type: 'sine', f0: 2400, dur: 0.15, vol: 0.05 }); T({ type: 'sine', f0: 3200, dur: 0.15, vol: 0.05, delay: 0.06 }); }
      if (Math.sin(t / 30) > 0.6 && Math.sin((t - 1) / 30) <= 0.6) [0, 0.16, 0.32].forEach(d => T({ type: 'sine', f0: 320, f1: 150, dur: 0.12, vol: 0.09, delay: d }));
    },
    t => { // 3. thumping dance beat and the crowd cheering
      if (t % 30 === 0) T({ type: 'sine', f0: 150, f1: 40, dur: 0.15, vol: 0.35 });
      if (t % 30 === 15) N({ dur: 0.04, vol: 0.06, f: 7000, type: 'highpass' });
      [0, 25, 50].forEach(k => { if ((t + k) % 75 === 0) { N({ dur: 0.5, vol: 0.12, f: 1200, type: 'bandpass' }); T({ type: 'sine', f0: 1800, f1: 2600, dur: 0.3, vol: 0.03 }); } });
    },
    t => { // 4. staggering footsteps and hiccups
      if (t >= 60 && t < 360 && t % 18 === 0) crunch();
      if (t % 70 === 51) T({ f0: 500, f1: 1100, dur: 0.07, vol: 0.06 });
    },
    t => { // 5. whooshing about, a falling whistle, then the crash
      if (t === 10 || t === 85) N({ dur: 0.7, vol: 0.12, f: 600, f1: 2200, type: 'bandpass' });
      if (t === 170) T({ type: 'sine', f0: 1600, f1: 200, dur: 1.05, vol: 0.06 });
      if (t === 235) {
        N({ dur: 1.3, vol: 0.7, f: 800, f1: 80 });
        T({ type: 'sine', f0: 90, f1: 30, dur: 0.6, vol: 0.45 });
        T({ f0: 320, f1: 90, dur: 0.3, vol: 0.08 });
      }
    },
    t => { // 6. dizzy tweets, then a sad trombone after "Oh sh*t"
      if (t > 30 && t < 330 && t % 50 === 0) { T({ type: 'sine', f0: 2600, f1: 3400, dur: 0.05, vol: 0.04 }); T({ type: 'sine', f0: 2800, f1: 3600, dur: 0.05, vol: 0.04, delay: 0.08 }); }
      if (t === 190) [[392, 0], [370, 0.4], [349, 0.8]].forEach(([f, d]) => T({ type: 'triangle', f0: f, dur: 0.35, vol: 0.1, delay: d }));
      if (t === 190) T({ type: 'triangle', f0: 330, f1: 290, dur: 1.0, vol: 0.1, delay: 1.2 });
    },
  ];
  SCENES.forEach((S, i) => { S.sfx = SCENE_SFX[i]; });

  // ---------- The ending (reaching 100 presents) ----------
  // Same player and style as the intro: Santa gets home, gets nicked for drink flying, ends
  // up in a cell, and Christmas is ruined for every child in town.
  const officer = sprite([
    '...KKK....',
    '..KKKKK...',
    '..KKHKK...',
    '.KKKKKKK..',
    '..SSSS....',
    '.KSSSS....',
    '..SSSS....',
    '.VVVVVV...',
    'VVVUUVVV..',
    'VVVUUVVV..',
    'SVVVVVVS..',
    '.UUUUUU...',
    '.UU..UU...',
    '.UU..UU...',
    '.UU..UU...',
    '.KK..KK...',
    'KKK.KKK...',
  ], { H: '#d8dde6', V: '#cfe83a', U: '#1d2a4a' });
  const child = sprite([
    '..HHHH..',
    '.HHHHHH.',
    '.HSSSSH.',
    '..SKSK..',
    '..SSSS..',
    '...SS...',
    '.PPPPPP.',
    'PPWPPWPP',
    'SPPPPPPS',
    '.PPWPPP.',
    '.PP..PP.',
    '.PP..PP.',
    '.SS..SS.',
  ], { H: '#7a4a24', P: '#7cc4ef', W: '#ffffff' });
  const fullSleigh = sprite(SLEIGH);
  function cottage(t) {          // Santa's house, as in the intro (without Mrs Claus in the window)
    R('#e8d2a6', 8, 40, 64, 36); R('#d4b98a', 8, 72, 64, 4);
    for (let k = 0; k <= 18; k++) { const w = 8 + k * 4; R(k < 4 ? '#ffffff' : '#7a2e22', 40 - w / 2, 22 + k, w, 1); R('#ffffff', 40 - w / 2, 22 + k, 2, 1); R('#ffffff', 40 + w / 2 - 2, 22 + k, 2, 1); }
    R('#8c3b2c', 56, 16, 7, 14); R('#ffffff', 55, 15, 9, 2);
    R('#6b4a2a', 14, 46, 20, 18); R('#ffd27a', 16, 48, 16, 14); R('#6b4a2a', 23, 48, 2, 14);
    R('#2a1a10', 46, 52, 12, 24); R('#7a2e22', 47, 53, 10, 23); R('#f7c843', 55, 64, 1, 2);
    R('#2e7d32', 49, 46, 6, 5); R('#5a3420', 51, 48, 2, 1); R('#d62839', 51, 50, 2, 1);
  }
  function policeCar(x, y, t, lit) {   // little white panda car with flashing lights
    const fx = Math.round(x), fy = Math.round(y), blue = (t >> 3) % 2;
    if (lit) { C.fillStyle = blue ? 'rgba(60,140,255,0.28)' : 'rgba(255,60,60,0.28)'; C.fillRect(fx - 6, fy - 8, 40, 22); }
    R('#2f6fd6', fx + 12, fy, 3, 2); R('#d62839', fx + 15, fy, 3, 2);
    if (lit) R(blue ? '#bfe0ff' : '#ffc0c0', blue ? fx + 12 : fx + 15, fy, 3, 1);
    R('#f4f6fa', fx + 7, fy + 2, 16, 5); R('#7cc4ef', fx + 9, fy + 3, 5, 3); R('#7cc4ef', fx + 16, fy + 3, 5, 3);
    R('#f4f6fa', fx, fy + 6, 30, 5); R('#ffe14d', fx, fy + 7, 2, 2);
    for (let i = 0; i < 30; i += 3) R((i / 3) % 2 ? '#f7c843' : '#2f6fd6', fx + i, fy + 9, 3, 2);
    R('#1b1b1b', fx + 4, fy + 10, 5, 3); R('#1b1b1b', fx + 21, fy + 10, 5, 3); R('#8a8a8a', fx + 6, fy + 11, 1, 1); R('#8a8a8a', fx + 23, fy + 11, 1, 1);
  }
  function bubble(x, y, lines, k) {    // white speech bubble with a tail pointing down
    const w = Math.max(...lines.map(l => l.length)) * 4 + 3, h = lines.length * 7 + 3;
    R('#05070f', x - 1, y - 1, w + 2, h + 2); R('#ffffff', x, y, w, h);
    R('#ffffff', x + 3, y + h, 3, 2); R('#ffffff', x + 3, y + h + 2, 1, 1);
    lines.forEach((l, i) => text(l, x + 2, y + 2 + i * 7, '#1b1b1b', 1, '#ffffff'));
  }
  const ENDING_SCENES = [
    { // 1. Home just in time, sleigh piled with presents... then a police car pulls up
      dur: 440, caption: 'CHRISTMAS EVE',
      lines: [{ at: 70, who: 'SANTA', text: 'Got them all, just in time!' }],
      draw(t) {
        sky(t);
        R('#dfe8f5', 0, 74, 128, 22); R('#ffffff', 0, 74, 128, 2);
        cottage(t);
        // sleigh glides in and lands, a sack of presents piled up behind Santa
        const p = clamp01(t / 70), sx = lerp(-30, 74, 1 - (1 - p) * (1 - p)), sy = lerp(40, 64, p);
        [[0, 0], [5, 0], [2, -4], [7, -4], [4, -8]].forEach(([dx, dy], k) => present(sx - 3 + dx, sy + 2 + dy, k + 1));
        C.drawImage(fullSleigh, Math.round(sx), Math.round(sy));
        // then the police turn up, lights flashing
        if (t > 190) {
          const cp = clamp01((t - 190) / 60);
          policeCar(lerp(132, 104, 1 - (1 - cp) * (1 - cp)), 66, t, true);
          if (t > 255 && t < 300) R('rgba(255,255,255,0.6)', 101, 76, 4, 1);   // tyre skid
        }
      },
    },
    { // 2. "Mr Claus, I'm placing you under arrest..."  "Gulp."
      dur: 470,
      lines: [
        { at: 70, who: 'OFFICER', text: "Mr Claus, I'm placing you under arrest for drink flying. You do not have to say anything..." },
        { at: 330, who: 'SANTA', text: 'Gulp.' },
      ],
      draw(t) {
        sky(t);
        R('#dfe8f5', 0, 74, 128, 22); R('#ffffff', 0, 74, 128, 2);
        cottage(t);
        C.drawImage(emptySleigh, 74, 64);
        policeCar(104, 66, t, true);
        // the officer walks over from the car; Santa stands facing him
        const op = clamp01(t / 70);
        C.drawImage(officer, Math.round(lerp(100, 74, op)), 59);
        C.drawImage(op < 1 && (t >> 3) % 2 ? santaWalkB : santaWalkA, 58, 59);
        if (t > 330) { const d = (t - 330) % 40; R('#9fd8f5', 68, 58 + d / 6, 1, 2); }   // nervous sweat
      },
    },
    { // 3. Locked up, looking sorry for himself
      dur: 320,
      lines: [],
      draw(t) {
        R('#4a4f5c', 0, 0, 128, 96);
        for (let y = 0; y < 76; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < 128; x += 12) R('#3d414c', x, y, 11, 5);
        R('#2c2f38', 0, 76, 128, 20);
        // little barred window with the moon
        R('#0b1026', 50, 10, 20, 14); R('#fff3c4', 60, 13, 5, 5);
        for (let x = 53; x < 70; x += 4) R('#8a8f9a', x, 10, 1, 14);
        // bench, and Santa slumped on it, no hat bobble bouncing now
        R('#6b4a2a', 36, 66, 44, 4); R('#4f2f17', 38, 70, 3, 6); R('#4f2f17', 75, 70, 3, 6);
        C.drawImage(santaWalkA, 52, 51);
        R('#f2c09b', 56, 57, 1, 1);
        if (t > 60) { const d = (t - 60) % 50; if (d < 30) R('#7cc4ef', 61, 56 + d / 5, 1, 2); }   // a tear
        if (t > 140 && (t >> 5) % 2) text('SIGH', 66, 40, '#ffffff');
        // cell bars across the front
        for (let x = 6; x < 128; x += 14) { R('#9aa0ab', x, 0, 2, 96); R('#c7ccd6', x, 0, 1, 96); }
        R('#9aa0ab', 0, 30, 128, 2); R('#9aa0ab', 0, 70, 128, 2);
      },
    },
    { // 4. Christmas morning, and nothing under the tree
      dur: 400, caption: 'CHRISTMAS MORNING',
      lines: [{ at: 160, who: 'CHILD', text: 'Mummy, where are all my presents?' }],
      draw(t) {
        R('#7a3d3d', 0, 0, 128, 70); for (let x = 0; x < 128; x += 8) R('#6b3434', x, 0, 4, 70);
        R('#8a5530', 0, 70, 128, 26); for (let x = 0; x < 128; x += 16) R('#6b3a1e', x, 70, 1, 26);
        // window with a snowy morning outside
        R('#4f2f17', 6, 14, 24, 22); R('#bfe0ff', 8, 16, 20, 18); R('#ffffff', 8, 30, 20, 4); R('#4f2f17', 17, 16, 2, 18);
        // fireplace with empty stockings
        R('#8c3b2c', 34, 40, 28, 30); R('#2a1a10', 40, 50, 16, 20); R('#ff9a3c', 44, 64, 8, 4); R('#6e2c20', 32, 38, 32, 3);
        [38, 46, 54].forEach(x => { R('#d62839', x, 41, 4, 7); R('#ffffff', x, 41, 4, 2); });
        // the tree, lit up, with nothing underneath
        for (let k = 0; k < 30; k++) R(k % 10 < 2 ? '#1b5e20' : '#2e7d32', 86 - k * 0.6, 34 + k, k * 1.2 + 2, 1);
        R('#4f2f17', 85, 64, 4, 6); R('#f7c843', 85, 31, 4, 4);
        for (let i = 0; i < 10; i++) if ((t >> 4) % 2 === i % 2) R(['#ff4d4d', '#ffe14d', '#4dd2ff'][i % 3], 78 + (i * 7) % 18, 40 + (i * 11) % 22, 1, 1);
        R('#d62839', 76, 70, 24, 2);   // empty tree skirt
        // the stairs, and the child coming down them
        for (let k = 0; k < 6; k++) R('#6b3a1e', 104 + k * 4, 70 - k * 6, 24 - k * 4, 6);
        const cp = clamp01(t / 140);
        C.drawImage(child, Math.round(lerp(120, 100, cp)), Math.round(lerp(30, 57, cp)));
        if (t > 230 && (t >> 4) % 2) text('?', 104, 46, '#ffffff');
      },
    },
    { // 5. The whole town in tears, then the verdict
      dur: 760,
      lines: [
        { at: 170, who: '', text: "...and due to Santa's drunken escapades, none of the children got their toys. Christmas was ruined." },
        { at: 520, who: '', text: 'He got 6 months and a 3 year flying ban.' },
      ],
      draw(t) {
        R('#8090bd', 0, 0, 128, 30); R('#a3b0d6', 0, 30, 128, 30); R('#c6cfe8', 0, 60, 128, 36);   // grey Christmas morning, no stars
        const HOUSES = [[0, 50, 18], [16, 56, 16], [30, 46, 20], [48, 54, 16], [62, 48, 18], [78, 52, 16], [92, 44, 20], [110, 53, 18]];
        HOUSES.forEach(([hx, top, w], i) => {
          R('#3d4f8a', hx, top, w, 80 - top); R('#2c3b6b', hx + w - 2, top, 2, 80 - top); R('#ffffff', hx - 1, top - 2, w + 2, 2);
          R('#ffd27a', hx + 4, top + 6, 3, 3); R('#ffd27a', hx + w - 7, top + 12, 3, 3);
        });
        R('#dfe8f5', 0, 80, 128, 16); R('#ffffff', 0, 80, 128, 1);
        // crying from every house
        const SAY = [[['WAAAAA!'], 3, 24, 10], [['*SOB*'], 98, 30, 40], [['WHERE ARE ALL', 'THE PRESENTS?'], 37, 6, 80], [['WAAAH!'], 97, 6, 120], [['*SOB*'], 58, 32, 150]];
        SAY.forEach(([lines, x, y, from], k) => { if (t > from && (t - from) % 220 < 160) bubble(x, y, lines, k); });
      },
    },
    { // 6. The end
      dur: 240, full: true,
      lines: [],
      draw(t) {
        if (t > 20) textC('THE END', 72, 112, '#d62839', 3, '#ffffff');
        if (t > 80) textC('MERRY CHRISTMAS', 72, 146, '#f7c843');
      },
    },
  ];
  // ending sound cues, one list per scene (same idea as the intro's)
  const ENDING_SFX = [
    t => { // sleigh bells as he lands, then a siren and a skid
      if (t < 70 && t % 6 === 0) T({ type: 'sine', f0: 2400 + (t % 12 ? 400 : 0), dur: 0.05, vol: 0.03 });
      if (t >= 190 && t % 24 === 0) T({ f0: (t / 24) % 2 ? 950 : 740, dur: 0.22, vol: 0.035 });
      if (t === 252) N({ dur: 0.35, vol: 0.15, f: 3000, type: 'highpass' });
    },
    t => { // siren dies down, footsteps, then a big gulp
      if (t < 60 && t % 24 === 0) T({ f0: (t / 24) % 2 ? 950 : 740, dur: 0.22, vol: 0.02 });
      if (t < 70 && t % 16 === 0) N({ dur: 0.05, vol: 0.1, f: 2000 });
      if (t === 334) { T({ type: 'sine', f0: 520, f1: 180, dur: 0.22, vol: 0.12 }); T({ type: 'sine', f0: 300, f1: 110, dur: 0.18, vol: 0.1, delay: 0.24 }); }
    },
    t => { // the cell door slamming, then a drip
      if (t === 8) { N({ dur: 0.5, vol: 0.5, f: 600 }); [220, 330, 470].forEach(f => T({ f0: f, dur: 0.6, vol: 0.05 })); }
      if (t > 60 && (t - 60) % 50 === 29) T({ type: 'sine', f0: 1800, f1: 1200, dur: 0.06, vol: 0.04 });
    },
    t => { // footsteps down the stairs
      if (t < 140 && t % 23 === 0) T({ type: 'sine', f0: 110, f1: 60, dur: 0.1, vol: 0.2 });
    },
    t => { // wailing and sobbing as the bubbles appear, sad trombone at the end
      [10, 120].forEach(from => { if (t > from && (t - from) % 220 === 1) [0, 0.12, 0.24].forEach((d, i) => T({ type: 'sawtooth', f0: 620 - i * 40, f1: 480 - i * 40, dur: 0.18, vol: 0.03, delay: d })); });
      [40, 150].forEach(from => { if (t > from && (t - from) % 220 === 1) [0, 0.15].forEach(d => N({ dur: 0.08, vol: 0.1, f: 900, type: 'bandpass', delay: d })); });
      if (t === 640) [[392, 0], [370, 0.4], [349, 0.8]].forEach(([f, d]) => T({ type: 'triangle', f0: f, dur: 0.35, vol: 0.1, delay: d }));
      if (t === 640) T({ type: 'triangle', f0: 330, f1: 290, dur: 1.0, vol: 0.1, delay: 1.2 });
    },
    t => { // a last little chime
      if (t === 22) [784, 659, 523].forEach((f, i) => T({ type: 'triangle', f0: f, dur: 0.4, vol: 0.06, delay: i * 0.25 }));
    },
  ];
  ENDING_SCENES.forEach((S, i) => { S.sfx = ENDING_SFX[i]; });

  // Talking blips as the dialogue types out (deeper for Santa), and for captions
  const VOICE = { SANTA: 200, BARMAN: 330, CROWD: 520, OFFICER: 260, CHILD: 650 };
  function typeBlips(S, t) {
    if (S.caption && t % 6 === 0) { const ch = S.caption[t / 3]; if (ch && ch !== ' ') T({ f0: 1100, dur: 0.02, vol: 0.02 }); }
    const line = S.lines.filter(l => t >= l.at).pop();
    if (!line) return;
    const k = t - line.at;
    if (k % 4 !== 0) return;
    const ch = line.text[k / 2];
    if (ch && ch !== ' ') T({ f0: (VOICE[line.who] || 400) * (1 + ((k * 7) % 5 - 2) * 0.04), dur: 0.035, vol: 0.035 });
  }

  // ---------- The player ----------
  function create(ctx, sound, which = 'intro') {
    const SCENES_ = which === 'ending' ? ENDING_SCENES : SCENES;
    let scene = 0, t = 0;
    T = (sound && sound.tone) || (() => {});
    N = (sound && sound.noise) || (() => {});
    const intro = {
      get done() { return scene >= SCENES_.length; },
      get scene() { return scene; },
      seek(s, f) { scene = s; t = f; },
      next() { scene++; t = 0; },
      update() {
        if (scene >= SCENES_.length) return;
        SCENES_[scene].sfx(t);
        typeBlips(SCENES_[scene], t);
        if (++t >= SCENES_[scene].dur) { scene++; t = 0; }
      },
      draw(W, H, hint = 'TAP TO SKIP') {
        if (scene >= SCENES_.length) return;
        C = ctx;
        const S = SCENES_[scene], oy = Math.floor((H - 256) / 2);
        R('#05070f', 0, 0, W, H);
        ctx.save(); ctx.translate(0, oy);
        // text is centred on its finished width, so it types out left to right without sliding
        const startX = str => W / 2 - (str.length * 4 - 1) / 2;
        if (S.full) {                       // a plain card (THE END), no picture frame or text box
          S.draw(t);
          const e = Math.min(t, S.dur - t);
          if (e < 15) { ctx.fillStyle = `rgba(5,7,15,${1 - e / 15})`; ctx.fillRect(0, 0, W, 256); }
          ctx.restore();
          return;
        }
        if (S.caption) text(S.caption.slice(0, Math.floor(t / 3)), startX(S.caption), 18, '#f7c843');
        // picture
        R('#b8862b', 7, 29, 130, 98); R('#05070f', 8, 30, 128, 96);
        ctx.save(); ctx.beginPath(); ctx.rect(8, 30, 128, 96); ctx.clip(); ctx.translate(8, 30);
        S.draw(t);
        ctx.restore();
        // dialogue box, typed out letter by letter
        R('#3a4a7a', 6, 136, 132, 62); R('#0b1026', 7, 137, 130, 60);
        const line = S.lines.filter(l => t >= l.at).pop();
        if (line) {
          if (line.who) text(line.who, startX(line.who), 141, WHO_COLS[line.who] || '#fff');   // narration has no name
          const shown = Math.floor((t - line.at) / 2);
          let used = 0;
          wrap(line.text, 31).forEach((l, i) => {
            const part = l.slice(0, Math.max(0, shown - used)); used += l.length + 1;
            text(part, startX(l), 151 + i * 8, '#ffffff');
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
  window.CrimboIntro = { create, sceneCount: SCENES.length, endingSceneCount: ENDING_SCENES.length };
})();
