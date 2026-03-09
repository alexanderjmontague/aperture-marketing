const canvas = document.getElementById("aperture-scene");
const ctx = canvas.getContext("2d");

const TAU = Math.PI * 2;
const BLADE_COUNT = 12;

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  pointerX: window.innerWidth / 2,
  pointerY: window.innerHeight / 2,
  targetOpen: 0,
  open: 0,
  tiltX: 0,
  tiltY: 0,
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOut(value) {
  return 1 - Math.pow(1 - value, 1.85);
}

function pointOnCircle(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function drawCircle(x, y, radius, fillStyle) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeCircle(x, y, radius, strokeStyle, lineWidth) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function polygonPath(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index].x, points[index].y);
  }

  ctx.closePath();
}

function resize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.round(state.width * state.dpr);
  canvas.height = Math.round(state.height * state.dpr);
  canvas.style.width = `${state.width}px`;
  canvas.style.height = `${state.height}px`;

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
}

function updatePointer(clientX, clientY) {
  state.pointerX = clientX;
  state.pointerY = clientY;

  const centerX = state.width / 2;
  const centerY = state.height / 2;
  const distance = Math.hypot(clientX - centerX, clientY - centerY);
  const maxDistance = Math.hypot(centerX, centerY) * 0.98;

  state.tiltX = clamp((clientX - centerX) / centerX, -1, 1);
  state.tiltY = clamp((clientY - centerY) / centerY, -1, 1);
  state.targetOpen = easeOut(clamp(distance / maxDistance, 0, 1));
}

function resetPointer() {
  updatePointer(state.width / 2, state.height / 2);
}

function drawBackground(centerX, centerY, lensRadius) {
  const ambient = ctx.createRadialGradient(
    centerX + state.tiltX * lensRadius * 0.15,
    centerY + state.tiltY * lensRadius * 0.12,
    lensRadius * 0.18,
    centerX,
    centerY,
    Math.max(state.width, state.height) * 0.8
  );
  ambient.addColorStop(0, "#f8fbff");
  ambient.addColorStop(0.35, "#e3edf6");
  ambient.addColorStop(0.72, "#c9d8e5");
  ambient.addColorStop(1, "#b6c7d5");

  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, state.width, state.height);

  const halo = ctx.createRadialGradient(
    centerX,
    centerY,
    lensRadius * 0.18,
    centerX,
    centerY,
    lensRadius * 1.45
  );
  halo.addColorStop(0, "rgba(160, 194, 224, 0.36)");
  halo.addColorStop(0.34, "rgba(126, 156, 184, 0.14)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");

  drawCircle(centerX, centerY, lensRadius * 1.45, halo);

  const vignette = ctx.createRadialGradient(
    centerX,
    centerY,
    Math.min(state.width, state.height) * 0.16,
    centerX,
    centerY,
    Math.max(state.width, state.height) * 0.82
  );
  vignette.addColorStop(0.55, "rgba(255, 255, 255, 0)");
  vignette.addColorStop(1, "rgba(106, 126, 148, 0.18)");

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, state.width, state.height);
}

function drawScrews(centerX, centerY, radius, size) {
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * TAU + Math.PI / 12;
    const point = pointOnCircle(centerX, centerY, radius, angle);
    const screwGradient = ctx.createRadialGradient(
      point.x - size * 0.3,
      point.y - size * 0.35,
      size * 0.18,
      point.x,
      point.y,
      size
    );

    screwGradient.addColorStop(0, "#ffffff");
    screwGradient.addColorStop(0.45, "#bcc6d0");
    screwGradient.addColorStop(1, "#7c8895");

    drawCircle(point.x, point.y, size, screwGradient);
    strokeCircle(point.x, point.y, size, "rgba(255, 255, 255, 0.55)", 1.2);
    strokeCircle(point.x, point.y, size, "rgba(97, 112, 128, 0.22)", 2.2);

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.strokeStyle = "rgba(74, 86, 100, 0.72)";
    ctx.lineWidth = Math.max(1, size * 0.2);
    ctx.beginPath();
    ctx.moveTo(-size * 0.48, 0);
    ctx.lineTo(size * 0.48, 0);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBezelMarks(centerX, centerY, outerRadius) {
  ctx.save();
  ctx.translate(centerX, centerY);

  for (let index = 0; index < 72; index += 1) {
    const angle = (index / 72) * TAU;
    const isMajor = index % 6 === 0;
    const inner = outerRadius * (isMajor ? 0.803 : 0.82);
    const outer = outerRadius * (isMajor ? 0.877 : 0.862);
    const alpha = isMajor ? 0.32 : 0.16;

    ctx.strokeStyle = `rgba(87, 104, 122, ${alpha})`;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.restore();
}

function drawShell(centerX, centerY, lensRadius) {
  ctx.save();
  ctx.filter = "blur(16px)";
  ctx.fillStyle = "rgba(121, 144, 166, 0.12)";
  ctx.beginPath();
  ctx.ellipse(
    centerX,
    centerY + lensRadius * 0.08,
    lensRadius * 0.94,
    lensRadius * 0.88,
    0,
    0,
    TAU
  );
  ctx.fill();
  ctx.restore();

  const shellGradient = ctx.createRadialGradient(
    centerX - lensRadius * 0.3 + state.tiltX * lensRadius * 0.05,
    centerY - lensRadius * 0.34 + state.tiltY * lensRadius * 0.05,
    lensRadius * 0.05,
    centerX,
    centerY,
    lensRadius
  );
  shellGradient.addColorStop(0, "#ffffff");
  shellGradient.addColorStop(0.2, "#dde5ed");
  shellGradient.addColorStop(0.58, "#b3bdc8");
  shellGradient.addColorStop(1, "#8794a2");

  drawCircle(centerX, centerY, lensRadius, shellGradient);
  strokeCircle(
    centerX,
    centerY,
    lensRadius * 0.992,
    "rgba(255, 255, 255, 0.62)",
    lensRadius * 0.014
  );
  strokeCircle(
    centerX,
    centerY,
    lensRadius * 0.988,
    "rgba(116, 130, 146, 0.16)",
    lensRadius * 0.018
  );

  const outerWell = ctx.createRadialGradient(
    centerX - lensRadius * 0.22,
    centerY - lensRadius * 0.24,
    lensRadius * 0.04,
    centerX,
    centerY,
    lensRadius * 0.93
  );
  outerWell.addColorStop(0, "#f5f9fc");
  outerWell.addColorStop(0.7, "#dce4ec");
  outerWell.addColorStop(1, "#b9c4cf");
  drawCircle(centerX, centerY, lensRadius * 0.928, outerWell);

  const bezelGradient = ctx.createRadialGradient(
    centerX - lensRadius * 0.26,
    centerY - lensRadius * 0.3,
    lensRadius * 0.06,
    centerX,
    centerY,
    lensRadius * 0.89
  );
  bezelGradient.addColorStop(0, "#fdfefe");
  bezelGradient.addColorStop(0.28, "#d5dde6");
  bezelGradient.addColorStop(0.7, "#adb8c4");
  bezelGradient.addColorStop(1, "#8f9ba8");
  drawCircle(centerX, centerY, lensRadius * 0.89, bezelGradient);

  drawBezelMarks(centerX, centerY, lensRadius);
  drawScrews(centerX, centerY, lensRadius * 0.84, lensRadius * 0.034);

  const innerBaffle = ctx.createRadialGradient(
    centerX - lensRadius * 0.12,
    centerY - lensRadius * 0.18,
    lensRadius * 0.03,
    centerX,
    centerY,
    lensRadius * 0.78
  );
  innerBaffle.addColorStop(0, "#eef4f9");
  innerBaffle.addColorStop(0.7, "#d8e1e9");
  innerBaffle.addColorStop(1, "#b4bec9");
  drawCircle(centerX, centerY, lensRadius * 0.78, innerBaffle);

  const chamberLip = ctx.createRadialGradient(
    centerX - lensRadius * 0.18,
    centerY - lensRadius * 0.2,
    lensRadius * 0.05,
    centerX,
    centerY,
    lensRadius * 0.72
  );
  chamberLip.addColorStop(0, "#fdfefe");
  chamberLip.addColorStop(0.28, "#d7dee6");
  chamberLip.addColorStop(0.72, "#b1bcc7");
  chamberLip.addColorStop(1, "#939eab");
  drawCircle(centerX, centerY, lensRadius * 0.72, chamberLip);

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
  ctx.lineWidth = lensRadius * 0.012;
  ctx.beginPath();
  ctx.arc(centerX, centerY, lensRadius * 0.938, -2.3, -0.54);
  ctx.stroke();

  ctx.strokeStyle = "rgba(122, 138, 155, 0.18)";
  ctx.lineWidth = lensRadius * 0.014;
  ctx.beginPath();
  ctx.arc(centerX, centerY, lensRadius * 0.916, 0.78, 2.35);
  ctx.stroke();
  ctx.restore();
}

function drawGlassReflections(centerX, centerY, irisRadius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, irisRadius * 0.995, 0, TAU);
  ctx.clip();
  ctx.globalCompositeOperation = "screen";

  const highlightX = centerX - irisRadius * 0.28 - state.tiltX * irisRadius * 0.08;
  const highlightY = centerY - irisRadius * 0.36 - state.tiltY * irisRadius * 0.08;
  const highlight = ctx.createRadialGradient(
    highlightX,
    highlightY,
    irisRadius * 0.04,
    highlightX,
    highlightY,
    irisRadius * 0.6
  );
  highlight.addColorStop(0, "rgba(255, 255, 255, 0.34)");
  highlight.addColorStop(0.38, "rgba(180, 214, 247, 0.12)");
  highlight.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = highlight;
  ctx.beginPath();
  ctx.ellipse(
    highlightX + irisRadius * 0.06,
    highlightY + irisRadius * 0.08,
    irisRadius * 0.74,
    irisRadius * 0.46,
    -0.42,
    0,
    TAU
  );
  ctx.fill();

  const ghostX = centerX + irisRadius * 0.18 + state.tiltX * irisRadius * 0.05;
  const ghostY = centerY + irisRadius * 0.28 + state.tiltY * irisRadius * 0.05;
  const ghost = ctx.createRadialGradient(
    ghostX,
    ghostY,
    irisRadius * 0.02,
    ghostX,
    ghostY,
    irisRadius * 0.26
  );
  ghost.addColorStop(0, "rgba(255, 210, 146, 0.12)");
  ghost.addColorStop(1, "rgba(255, 196, 116, 0)");

  ctx.fillStyle = ghost;
  ctx.beginPath();
  ctx.ellipse(
    ghostX,
    ghostY,
    irisRadius * 0.24,
    irisRadius * 0.18,
    0.18,
    0,
    TAU
  );
  ctx.fill();

  ctx.restore();
}

function drawAperture(centerX, centerY, lensRadius) {
  const irisRadius = lensRadius * 0.632;
  const step = TAU / BLADE_COUNT;
  const openness = state.open;
  const opennessBoost = openness * openness;
  const chamberGradient = ctx.createRadialGradient(
    centerX - irisRadius * 0.22,
    centerY - irisRadius * 0.24,
    irisRadius * 0.02,
    centerX,
    centerY,
    irisRadius
  );
  chamberGradient.addColorStop(0, "#f7fbff");
  chamberGradient.addColorStop(0.55, "#d9e2ea");
  chamberGradient.addColorStop(1, "#b2beca");

  drawCircle(centerX, centerY, irisRadius, chamberGradient);

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, irisRadius * 0.995, 0, TAU);
  ctx.clip();

  const irisPlate = ctx.createLinearGradient(
    centerX - irisRadius * 0.95,
    centerY - irisRadius * 0.72,
    centerX + irisRadius * 0.84,
    centerY + irisRadius * 0.96
  );
  irisPlate.addColorStop(0, "#ffffff");
  irisPlate.addColorStop(0.26, "#e3eaf2");
  irisPlate.addColorStop(0.58, "#c4cdd7");
  irisPlate.addColorStop(1, "#a5b0bc");
  drawCircle(centerX, centerY, irisRadius, irisPlate);

  const chamberShadow = ctx.createRadialGradient(
    centerX,
    centerY,
    irisRadius * 0.08,
    centerX,
    centerY,
    irisRadius
  );
  chamberShadow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  chamberShadow.addColorStop(0.44, "rgba(130, 146, 162, 0.06)");
  chamberShadow.addColorStop(1, "rgba(92, 109, 127, 0.12)");
  drawCircle(centerX, centerY, irisRadius, chamberShadow);

  const bladeOuterRadius = irisRadius * 1.46;
  const bladeShoulderRadius =
    irisRadius * (0.9 + 0.07 * openness + 0.02 * opennessBoost);
  const bladeInnerRadius =
    irisRadius * (0.1 + 0.41 * openness + 0.09 * opennessBoost);
  const twist = lerp(step * 0.54, step * 0.14, openness);
  const startAngle = -Math.PI / 2 - step * 0.2;

  for (let index = 0; index < BLADE_COUNT; index += 1) {
    const base = startAngle + index * step;
    const blade = [
      pointOnCircle(centerX, centerY, bladeOuterRadius, base - step * 1.14),
      pointOnCircle(centerX, centerY, bladeOuterRadius, base - step * 0.42),
      pointOnCircle(centerX, centerY, bladeOuterRadius * 0.99, base + step * 0.5),
      pointOnCircle(centerX, centerY, bladeShoulderRadius, base + step * 0.82),
      pointOnCircle(
        centerX,
        centerY,
        bladeInnerRadius * 0.9275,
        base + step * 1.03 + twist
      ),
      pointOnCircle(
        centerX,
        centerY,
        bladeInnerRadius * 0.9,
        base - step * 0.05 + twist * 0.82
      ),
      pointOnCircle(
        centerX,
        centerY,
        irisRadius * (0.78 + 0.1 * openness),
        base - step * 0.2
      ),
    ];

    const bladeTone =
      55 + 4 * Math.cos(base - 0.85) + (index % 2 === 0 ? 1.5 : -1.5);
    const bladeGradient = ctx.createLinearGradient(
      blade[1].x,
      blade[1].y,
      blade[4].x,
      blade[4].y
    );
    bladeGradient.addColorStop(0, `hsl(210 18% ${bladeTone + 18}%)`);
    bladeGradient.addColorStop(0.42, `hsl(212 16% ${bladeTone + 6}%)`);
    bladeGradient.addColorStop(1, `hsl(216 14% ${Math.max(48, bladeTone - 2)}%)`);

    ctx.save();
    ctx.shadowColor = "rgba(118, 132, 148, 0.08)";
    ctx.shadowBlur = lensRadius * 0.018;
    ctx.shadowOffsetX = lensRadius * 0.003;
    ctx.shadowOffsetY = lensRadius * 0.004;
    polygonPath(blade);
    ctx.fillStyle = bladeGradient;
    ctx.fill();
    ctx.restore();

    polygonPath(blade);
    ctx.lineWidth = lensRadius * 0.0026;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(blade[6].x, blade[6].y);
    ctx.lineTo(blade[5].x, blade[5].y);
    ctx.lineWidth = lensRadius * 0.008;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(blade[3].x, blade[3].y);
    ctx.lineTo(blade[4].x, blade[4].y);
    ctx.lineWidth = lensRadius * 0.012;
    ctx.strokeStyle = "rgba(136, 151, 168, 0.18)";
    ctx.stroke();
  }

  drawGlassReflections(centerX, centerY, irisRadius);
  ctx.restore();

  strokeCircle(
    centerX,
    centerY,
    irisRadius * 1.003,
    "rgba(255, 255, 255, 0.56)",
    lensRadius * 0.01
  );
  strokeCircle(
    centerX,
    centerY,
    irisRadius * 0.995,
    "rgba(131, 146, 163, 0.16)",
    lensRadius * 0.014
  );
}

function render() {
  const centerX = state.width / 2;
  const centerY = state.height / 2;
  const lensRadius =
    Math.min(state.width, state.height) *
    (state.width < 700 ? 0.44 : state.width < 1100 ? 0.39 : 0.34);

  ctx.clearRect(0, 0, state.width, state.height);
  drawBackground(centerX, centerY, lensRadius);
  drawShell(centerX, centerY, lensRadius);
  drawAperture(centerX, centerY, lensRadius);
}

function tick() {
  const easing = reduceMotion.matches ? 0.22 : 0.085;
  state.open += (state.targetOpen - state.open) * easing;
  render();
  window.requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  updatePointer(event.clientX, event.clientY);
});
window.addEventListener("pointerdown", (event) => {
  updatePointer(event.clientX, event.clientY);
});
window.addEventListener("pointerleave", resetPointer);
window.addEventListener("blur", resetPointer);

resize();
resetPointer();
window.requestAnimationFrame(tick);
