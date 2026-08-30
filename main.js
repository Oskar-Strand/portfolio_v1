// Solar system background simulation
// Drop this into your page with a <canvas id="solar-system-bg"></canvas>,
// or it will create a fullscreen fixed canvas automatically if none exists.

(function () {
  let canvas = document.getElementById('solar-system-bg');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'solar-system-bg';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.background = '#05070f';
    document.body.prepend(canvas);
  }
  const ctx = canvas.getContext('2d');

  let width, height, centerX, centerY;
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Background stars (static, twinkling) ---
  const STAR_COUNT = 180;
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.3 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.02 + 0.005,
  }));

  // --- Planet data ---
  // semiMajor/semiMinor are in px (scaled for visual balance, not real ratios).
  // period is in "seconds" for one full orbit at simSpeed = 1.
  // Periods roughly follow Kepler's 3rd law (T^2 ∝ a^3) relative to Mercury,
  // just compressed so outer planets don't take forever to complete a lap.
  const planets = [
    { name: 'Mercury', semiMajor: 45,  ecc: 0.10, size: 2.2, color: '#b5b0a8', period: 6 },
    { name: 'Venus',   semiMajor: 65,  ecc: 0.02, size: 3.4, color: '#e0c16c', period: 10 },
    { name: 'Earth',   semiMajor: 88,  ecc: 0.03, size: 3.6, color: '#5b9bd5', period: 16 },
    { name: 'Mars',    semiMajor: 112, ecc: 0.08, size: 2.6, color: '#c16b4a', period: 24 },
    { name: 'Jupiter', semiMajor: 150, ecc: 0.04, size: 8.5, color: '#d9a86c', period: 62 },
    { name: 'Saturn',  semiMajor: 190, ecc: 0.05, size: 7.2, color: '#e5d3a1', period: 96, hasRing: true },
    { name: 'Uranus',  semiMajor: 225, ecc: 0.04, size: 5.4, color: '#8fd0e0', period: 140 },
    { name: 'Neptune', semiMajor: 258, ecc: 0.01, size: 5.2, color: '#4d6fd1', period: 190 },
  ];

  // Random starting angle and orbital tilt (slight ellipse rotation) per planet
  planets.forEach((p) => {
    p.semiMinor = p.semiMajor * Math.sqrt(1 - p.ecc * p.ecc);
    p.angle = Math.random() * Math.PI * 2;
    p.tilt = (Math.random() - 0.5) * 0.4; // radians, subtle
    p.trail = [];
  });

  const simSpeed = 1;
  let lastTime = performance.now();

  function drawStars(dt) {
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, width, height);
    for (const s of stars) {
      s.phase += s.speed * dt;
      const twinkle = 0.5 + 0.5 * Math.sin(s.phase);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.3 + twinkle * 0.7})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSun() {
    const grad = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 26);
    grad.addColorStop(0, '#fff7d6');
    grad.addColorStop(0.4, '#ffd05a');
    grad.addColorStop(1, 'rgba(255,140,0,0)');
    ctx.beginPath();
    ctx.fillStyle = grad;
    ctx.arc(centerX, centerY, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#ffe37a';
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawOrbitPath(p) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(p.tilt);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.semiMajor, p.semiMinor, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function planetPosition(p) {
    // Position on the ellipse (focus at origin, sun-like foreshortening skipped
    // for simplicity — this traces a centered ellipse, which still reads as a
    // convincing orbit at this scale).
    const x = Math.cos(p.angle) * p.semiMajor;
    const y = Math.sin(p.angle) * p.semiMinor;
    const cosT = Math.cos(p.tilt);
    const sinT = Math.sin(p.tilt);
    return {
      x: centerX + (x * cosT - y * sinT),
      y: centerY + (x * sinT + y * cosT),
    };
  }

  function drawPlanet(p) {
    const pos = planetPosition(p);

    // trail
    p.trail.push(pos);
    if (p.trail.length > 40) p.trail.shift();
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const alpha = (i / p.trail.length) * 0.25;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(t.x, t.y, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (p.hasRing) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(0.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.9, p.size * 0.6, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(229,211,161,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    ctx.beginPath();
    ctx.fillStyle = p.color;
    ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // subtle glow
    ctx.beginPath();
    ctx.fillStyle = `${p.color}33`;
    ctx.arc(pos.x, pos.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    drawStars(dt);
    drawSun();

    for (const p of planets) {
      drawOrbitPath(p);
    }
    for (const p of planets) {
      p.angle += ((Math.PI * 2) / p.period) * simSpeed * dt;
      drawPlanet(p);
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();