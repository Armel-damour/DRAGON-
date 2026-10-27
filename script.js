(() => {
  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  const hint = document.getElementById('hint');
  const BONE = '#e9e2cf', SHADE = '#a89f87', DARK = '#0b0c14', GLOW = '#8fdcff';
  const N = 64, SP = 13;
  let W, H, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  const p = [], q = [], ang = [];
  for (let i = 0; i < N; i++) { p.push({ x: W / 2 - i * SP, y: H / 2 }); q.push({ x: 0, y: 0 }); ang.push(0); }

  let tx = W / 2, ty = H / 2, lastMove = -1e9, speed = 0;
  function onMove(e) {
    tx = e.clientX; ty = e.clientY; lastMove = performance.now();
    hint.classList.add('gone');
  }
  addEventListener('pointermove', onMove);
  const embers = []; let fireUntil = 0;
  let zapUntil = 0, lastClick = -1e9, clicks = 0, flesh = false, fleshAmt = 0;
  addEventListener('pointerdown', e => {
    onMove(e);
    const now = performance.now();
    clicks = now - lastClick < 350 ? clicks + 1 : 1;
    lastClick = now;
    if (clicks === 1) fireUntil = now + 1300;
    else if (clicks === 2) { zapUntil = now + 2500; fireUntil = 0; }
    else if (clicks === 4) { flesh = !flesh; zapUntil = 0; fireUntil = 0; clicks = 0; lastClick = -1e9; }
  });
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
  const BONE_RGB = [233, 226, 207], SKIN = [58, 110, 92], SKIN_DK = [24, 52, 46], SKIN_LT = [96, 150, 118];
  function bolt(a, b, jag, w, alpha) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d;
    const n = Math.max(3, Math.round(d / 9));
    ctx.beginPath(); ctx.moveTo(a.x, a.y);
    for (let k = 1; k < n; k++) {
      const u = k / n, o = (Math.random() - 0.5) * 2 * jag;
      ctx.lineTo(a.x + dx * u + nx * o, a.y + dy * u + ny * o);
    }
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = `rgba(120,200,255,${alpha})`; ctx.lineWidth = w * 2.6; ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = w; ctx.stroke();
  }

  const rad = i => 2.2 + 7.5 * Math.pow(1 - i / N, 1.3);

  function line(a, b, w, col) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const polar = (o, a, l) => ({ x: o.x + Math.cos(a) * l, y: o.y + Math.sin(a) * l });

  function drawWing(s, time) {
    const sh = q[10], a = ang[10];
    const amp = Math.min(0.5, 0.14 + speed * 0.02);
    const flap = Math.sin(time * 5) * amp;
    const el = polar(sh, a + s * (1.1 + flap), 58);
    const wr = polar(el, a + s * (1.55 + flap * 0.8), 62);
    const th = [1.8, 2.2, 2.6, 2.95], ln = [96, 108, 90, 64];
    const tips = th.map((t, k) => polar(wr, a + s * (t + flap * (1 + k * 0.25)), ln[k]));
    ctx.fillStyle = 'rgba(233,226,207,0.05)';
    ctx.beginPath(); ctx.moveTo(wr.x, wr.y);
    tips.forEach(t => ctx.lineTo(t.x, t.y));
    ctx.lineTo(q[22].x, q[22].y); ctx.closePath(); ctx.fill();
    if (fleshAmt > 0.01) { ctx.fillStyle = `rgba(120,48,64,${0.8 * fleshAmt})`; ctx.fill(); }
    ctx.strokeStyle = 'rgba(233,226,207,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(q[22].x, q[22].y);
    tips.forEach(t => { ctx.lineTo(t.x, t.y); });
    ctx.stroke();
    line(sh, el, 4, BONE); line(el, wr, 3.2, BONE);
    tips.forEach((t, k) => { line(wr, t, 2.2 - k * 0.2, BONE); });
    [sh, el, wr].forEach(j => { ctx.fillStyle = BONE; ctx.beginPath(); ctx.arc(j.x, j.y, 3.6, 0, 7); ctx.fill(); });
  }

  function drawRibs() {
    for (let i = 4; i < 32; i++) {
      const t = (i - 4) / 28, len = 7 + 24 * Math.sin(Math.PI * Math.pow(t, 0.8));
      const a = ang[i];
      for (const s of [-1, 1]) {
        const c = polar(q[i], a + s * Math.PI / 2, len);
        const e = polar(c, a + s * Math.PI / 2 + s * 1.9, len * 0.7);
        ctx.strokeStyle = SHADE; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(q[i].x, q[i].y);
        ctx.quadraticCurveTo(c.x, c.y, e.x, e.y); ctx.stroke();
      }
    }
  }

  function drawSpine() {
    for (let i = N - 1; i >= 1; i--) {
      const r = rad(i);
      ctx.save(); ctx.translate(q[i].x, q[i].y); ctx.rotate(ang[i]);
      ctx.fillStyle = BONE; ctx.strokeStyle = DARK; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, SP * 0.58, r, 0, 0, 7); ctx.fill(); ctx.stroke();
      if (i > N - 26) { // tail spikes
        ctx.fillStyle = SHADE; ctx.beginPath();
        for (const s of [-1, 1]) { ctx.moveTo(-2, s * r); ctx.lineTo(-9, s * (r + 5)); ctx.lineTo(3, s * r); }
        ctx.fill();
      }
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.arc(0, 0, Math.max(1, r * 0.28), 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  function drawFlesh() {
    if (fleshAmt < 0.01) return;
    ctx.save(); ctx.globalAlpha = fleshAmt;
    for (let i = N - 1; i >= 1; i--) {
      const rb = rad(i) * 1.7 + 3;
      ctx.save(); ctx.translate(q[i].x, q[i].y); ctx.rotate(ang[i]);
      ctx.fillStyle = mix(SKIN, SKIN_DK, 0.15 + 0.6 * (i / N)); ctx.strokeStyle = 'rgb(16,36,32)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, SP * 0.95, rb, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = mix(SKIN_LT, SKIN, 0.4);
      ctx.beginPath(); ctx.ellipse(-1, 0, SP * 0.5, rb * 0.4, 0, 0, 7); ctx.fill();
      if (i % 2 === 0 && i > 3) {
        ctx.fillStyle = 'rgb(214,196,160)';
        ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(3, -2.4); ctx.lineTo(3, 2.4); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawHead(time) {
    const open = Math.max(0, Math.min(1, speed * 0.04 + 0.12 + Math.sin(time * 2) * 0.06 + (performance.now() < fireUntil ? 0.7 : 0)));
    ctx.save(); ctx.translate(q[0].x, q[0].y); ctx.rotate(ang[0]);
    ctx.lineJoin = 'round';
    // horns
    for (const s of [-1, 1]) {
      ctx.strokeStyle = SHADE; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, s * 10);
      ctx.quadraticCurveTo(-22, s * 14, -38, s * 30); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = BONE;
      ctx.beginPath(); ctx.moveTo(-4, s * 10);
      ctx.quadraticCurveTo(-22, s * 14, -38, s * 30); ctx.stroke();
    }
    // jaw bars
    for (const s of [-1, 1]) {
      ctx.strokeStyle = DARK; ctx.lineWidth = 6; ctx.beginPath();
      ctx.moveTo(-4, s * 9); ctx.lineTo(44 + open * 10, s * (6 + open * 12)); ctx.stroke();
      ctx.strokeStyle = SHADE; ctx.lineWidth = 3.4; ctx.beginPath();
      ctx.moveTo(-4, s * 9); ctx.lineTo(44 + open * 10, s * (6 + open * 12)); ctx.stroke();
    }
    // skull
    ctx.fillStyle = mix(BONE_RGB, SKIN, fleshAmt); ctx.strokeStyle = DARK; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.bezierCurveTo(-16, -15, 2, -16, 14, -11);
    ctx.lineTo(44, -6); ctx.quadraticCurveTo(50, 0, 44, 6); ctx.lineTo(14, 11);
    ctx.bezierCurveTo(2, 16, -16, 15, -16, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // brow ridge + crest line
    ctx.strokeStyle = SHADE; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(40, 0); ctx.stroke();
    // teeth
    ctx.fillStyle = BONE; ctx.strokeStyle = DARK; ctx.lineWidth = 0.8;
    for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
      const x = 20 + k * 5, y = s * (10 - k * 0.9);
      ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x, y + s * 5); ctx.lineTo(x + 2, y); ctx.fill(); ctx.stroke();
    }
    // nostrils
    ctx.fillStyle = DARK;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(38, s * 2.6, 2.6, 1.4, 0, 0, 7); ctx.fill(); }
    // eye sockets
    for (const s of [-1, 1]) {
      ctx.fillStyle = DARK; ctx.beginPath(); ctx.ellipse(8, s * 8, 6, 4.8, s * 0.25, 0, 7); ctx.fill();
      ctx.save(); ctx.shadowColor = fleshAmt > 0.5 ? '#ffb030' : GLOW; ctx.shadowBlur = 14;
      ctx.fillStyle = mix([143, 220, 255], [255, 176, 48], fleshAmt);
      ctx.beginPath(); ctx.arc(9, s * 8, 2 + 2.6 * fleshAmt, 0, 7); ctx.fill(); ctx.restore();
      if (fleshAmt > 0.01) {
        ctx.fillStyle = `rgba(11,12,20,${fleshAmt})`;
        ctx.beginPath(); ctx.ellipse(9.5, s * 8, 1, 3.2, 0, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  function frame(t) {
    const time = t / 1000;
    const idle = t - lastMove > 2500;
    let gx = tx, gy = ty;
    if (idle) { gx = W / 2 + Math.cos(time * 0.6) * W * 0.3; gy = H / 2 + Math.sin(time * 0.9) * H * 0.24; }
    const ox = p[0].x, oy = p[0].y;
    p[0].x += (gx - p[0].x) * 0.07; p[0].y += (gy - p[0].y) * 0.07;
    speed += (Math.hypot(p[0].x - ox, p[0].y - oy) - speed) * 0.1;
    for (let i = 1; i < N; i++) {
      const dx = p[i - 1].x - p[i].x, dy = p[i - 1].y - p[i].y, d = Math.hypot(dx, dy) || 1;
      p[i].x = p[i - 1].x - dx / d * SP; p[i].y = p[i - 1].y - dy / d * SP;
    }
    // gentle serpentine wave, stronger when moving
    const amp = 2 + Math.min(speed, 12) * 0.5;
    for (let i = 0; i < N; i++) {
      const a = i === 0 ? Math.atan2(p[0].y - p[1].y, p[0].x - p[1].x) : Math.atan2(p[i - 1].y - p[i].y, p[i - 1].x - p[i].x);
      const w = Math.sin(time * 5 - i * 0.4) * amp * Math.min(1, i / 8);
      q[i].x = p[i].x + Math.cos(a + Math.PI / 2) * w;
      q[i].y = p[i].y + Math.sin(a + Math.PI / 2) * w;
    }
    for (let i = 0; i < N; i++) {
      ang[i] = i === 0 ? Math.atan2(q[0].y - q[1].y, q[0].x - q[1].x)
                       : Math.atan2(q[i - 1].y - q[i].y, q[i - 1].x - q[i].x);
    }
    ctx.clearRect(0, 0, W, H);
    drawWing(-1, time); drawWing(1, time);
    fleshAmt += ((flesh ? 1 : 0) - fleshAmt) * 0.06;
    drawRibs(); drawSpine(); drawFlesh(); drawHead(time);
    if (performance.now() < fireUntil) {
      const a0 = ang[0], mx0 = q[0].x + Math.cos(a0) * 48, my0 = q[0].y + Math.sin(a0) * 48;
      for (let k = 0; k < 7; k++) {
        const a = a0 + (Math.random() - 0.5) * 0.45, v = 5 + Math.random() * 6;
        embers.push({ x: mx0, y: my0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, size: 3 + Math.random() * 4 });
      }
    }
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx; e.y += e.vy - 0.25 * (1 - e.life); e.vx *= 0.97; e.vy *= 0.97;
      e.life -= 0.02; e.size *= 1.025;
      if (e.life <= 0) { embers.splice(i, 1); continue; }
      const l = e.life, g = Math.round(50 + 190 * l), b = Math.round(160 * Math.max(0, l - 0.7) / 0.3);
      ctx.fillStyle = `rgba(255,${g},${b},${l * 0.22})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size * 1.8, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(255,${g},${b},${l * 0.5})`;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, 7); ctx.fill();
    }
    ctx.restore();
    if (performance.now() < zapUntil) {
      const fade = Math.min(1, (zapUntil - performance.now()) / 2500 * 3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (Math.random() < 0.08) { ctx.fillStyle = `rgba(120,180,255,${0.07 * fade})`; ctx.fillRect(0, 0, W, H); }
      ctx.shadowColor = '#7fc8ff'; ctx.shadowBlur = 16;
      ctx.strokeStyle = `rgba(110,190,255,${0.3 * fade})`; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(q[0].x, q[0].y);
      for (let i = 1; i < N; i++) ctx.lineTo(q[i].x, q[i].y);
      ctx.stroke();
      for (let k = 0; k < 7; k++) {
        const i0 = Math.floor(Math.random() * (N - 6)), i1 = Math.min(N - 1, i0 + 4 + Math.floor(Math.random() * 14));
        bolt(q[i0], q[i1], 6, 1.4, fade);
      }
      for (let k = 0; k < 5; k++) {
        const i = Math.floor(Math.random() * N), a = Math.random() * 6.283, l = 25 + Math.random() * 45;
        bolt(q[i], { x: q[i].x + Math.cos(a) * l, y: q[i].y + Math.sin(a) * l }, 8, 1.2, fade * 0.9);
      }
      for (let k = 0; k < 8; k++) {
        const c = q[Math.floor(Math.random() * N)];
        ctx.fillStyle = `rgba(255,255,255,${fade})`; ctx.beginPath(); ctx.arc(c.x, c.y, 2 + Math.random() * 3, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(frame);
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { lastMove = 1e12; }
  requestAnimationFrame(frame);
})();
