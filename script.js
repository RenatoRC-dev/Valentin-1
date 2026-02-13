// === Referencias de DOM principales ===
const sunflowerContainer = document.getElementById('sunflower-container');
const sunflowerCenter = document.getElementById('sunflowerCenter');
const panels = document.querySelectorAll('.panel');
const pollenContainer = document.getElementById('pollenContainer');
const memoriesSection = document.getElementById('memories');
const memoryStage = document.querySelector('.memory-stage');
const tripPhotos = Array.from({ length: 7 }, (_, i) => `fotos/fotos de la pareja/foto ${i + 1}.jpeg`);
const tripCaptions = [
  'Flor de fuego en tu mirada',
  'Respira hondo y sigue',
  'Descanso bajo el lienzo verde',
  'Simbiosis perfecta',
  'Simbiosis perfecta',
  'Guardabosques paciente',
  'Mapa de risas compartidas'
];
const seedsPanel = document.getElementById('seeds-panel');
const seedsField = document.getElementById('seedsField');
const seedsFlowers = document.getElementById('seedsFlowers');
const carpirPanel = document.getElementById('carpir-panel');
const carpirReveal = document.getElementById('carpirReveal');
const carpirCanvas = document.getElementById('carpirCanvas');
const carpirCursor = document.getElementById('carpirCursor');
const carpirCursorSrc = carpirCursor ? carpirCursor.getAttribute('src') : '';
const carpirMessage = document.getElementById('carpirMessage');
let seedsOpened = new Set();
let eggTriggered = false;
let saplingGrowCount = 0;
let saplingNode;
let finalStageOverlay;
let carpirCtx = null;
let carpirDpr = 1;
let carpirScratching = false;
let carpirCompleted = false;
let carpirMeasureRaf = null;
let carpirBound = false;
let carpirCursorPrepared = false;
let carpirCursorPreparing = false;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fireflyDensityBase = prefersReducedMotion ? 4 : (isCoarsePointer || isSmallViewport ? 10 : 25);
const fireflySpawnMsBase = prefersReducedMotion ? 2600 : (isCoarsePointer || isSmallViewport ? 1900 : 1200);

// === 1. GeneraciÃ³n de los 16 pÃ©talos ===
const petalLabels = ['', 'Semillas', 'Carpir', 'Galer\u00eda', '', '', '', ''];
const petalTargets = [null, 'seeds-panel', 'carpir-panel', 'memories', null, null, null, null];

function createPetal(index) {
  const petal = document.createElement('div');
  const isBack = index % 2 === 1;
  petal.className = `petal ${isBack ? 'petal-back' : 'petal-front'}`;

  const angle = index * 22.5; // 360 / 16
  petal.style.setProperty('--angle', `${angle}deg`);

  petal.innerHTML = `
    <svg viewBox="0 0 100 150" aria-hidden="true">
      <defs>
        <radialGradient id="petal-grad-${index}" cx="50%" cy="100%" r="90%">
          <stop offset="0%" stop-color="#d84315" />
          <stop offset="55%" stop-color="#fbc02d" />
          <stop offset="95%" stop-color="#fffde7" />
        </radialGradient>
      </defs>
      <path d="M50 150 C28 140 8 100 8 60 C8 30 34 10 50 6 C66 10 92 30 92 60 C92 100 72 140 50 150 Z" fill="url(#petal-grad-${index})" />
    </svg>
  `;

  if (!isBack) {
    const labelIndex = index / 2;
    const label = petalLabels[labelIndex] || '';
    const targetId = petalTargets[labelIndex];
    if (label) {
      const span = document.createElement('span');
      span.className = 'petal-label';
      span.textContent = label;
      petal.appendChild(span);
    }

    if (targetId) {
      petal.addEventListener('click', (e) => {
        e.stopPropagation();
        showPanel(targetId);
      });
    } else {
      petal.classList.add('petal-empty');
    }
  }

  return petal;
}

if (sunflowerContainer) {
  sunflowerContainer.querySelectorAll('.petal').forEach((p) => p.remove());
  for (let i = 0; i < 16; i++) {
    sunflowerContainer.appendChild(createPetal(i));
  }
}

// === 2. InteracciÃ³n principal del girasol ===
function toggleBloom() {
  if (!sunflowerContainer) return;
  sunflowerContainer.classList.toggle('florecer');
  const hint = document.querySelector('.click-hint');
  if (hint) hint.style.opacity = '0';
}

if (sunflowerCenter) {
  sunflowerCenter.addEventListener('click', toggleBloom);
}

// === 3. NavegaciÃ³n entre paneles ===
function showPanel(id) {
  panels.forEach((panel) => panel.classList.add('hidden'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (id === 'memories') rebuildIntroOverlay();
    if (id === 'seeds-panel') resetSeedsExperience();
    if (id === 'carpir-panel') resetCarpirPanel();
  }
}

document.querySelectorAll('[data-reset]').forEach((btn) => {
  btn.addEventListener('click', () => {
    panels.forEach((panel) => panel.classList.add('hidden'));
    if (sunflowerContainer) sunflowerContainer.classList.remove('florecer');
    const stage = document.getElementById('main-stage');
    if (stage) stage.scrollIntoView({ behavior: 'smooth' });
  });
});

// === 4. Sistema de luciÃ©rnagas mÃ¡gicas ===
let fireflyTimer;

function createFirefly(densityBoost = 0) {
  if (!pollenContainer) return;
  const firefly = document.createElement('div');
  firefly.className = 'pollen';
  firefly.style.left = `${Math.random() * 100}%`;
  firefly.style.top = `${Math.random() * 100}%`;
  firefly.style.animationDuration = `${4 + Math.random() * 4 - densityBoost * 0.5}s`;
  firefly.style.animationDelay = `${Math.random() * 2}s`;
  pollenContainer.appendChild(firefly);
  setTimeout(() => firefly.remove(), 12000);
}

function startFireflies(density = 25, spawnEvery = 1200) {
  if (!pollenContainer) return;
  pollenContainer.innerHTML = '';
  for (let i = 0; i < density; i++) createFirefly();
  clearInterval(fireflyTimer);
  fireflyTimer = setInterval(() => createFirefly(), spawnEvery);
}

startFireflies(fireflyDensityBase, fireflySpawnMsBase);

// === 5. GalerÃ­a de ExploraciÃ³n Forestal (linterna + margaritas) ===
const forestSeeds = [
  { x: 18, y: 30, depth: 0.55, rot: -8 },
  { x: 33, y: 56, depth: 0.82, rot: 10 },
  { x: 48, y: 38, depth: 1.05, rot: -4 },
  { x: 64, y: 60, depth: 0.9, rot: 6 },
  { x: 80, y: 27, depth: 1.12, rot: -12 },
  { x: 24, y: 78, depth: 0.65, rot: 14 },
  { x: 70, y: 82, depth: 0.78, rot: -2 }
];

function createLightbox() {
  const overlay = document.createElement('div');
  overlay.className = 'forest-lightbox';
  overlay.innerHTML = `
    <div class="lightbox-frame">
      <button class="lightbox-close" aria-label="Cerrar lightbox">&times;</button>
      <figure class="lightbox-figure">
        <img class="lightbox-photo" alt="Viaje destacado" loading="lazy" />
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
    </div>`;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.lightbox-photo');
  const caption = overlay.querySelector('.lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const close = () => overlay.classList.remove('open');

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return {
    open: (idx) => {
      overlay.classList.add('open');
      const safeSrc = tripPhotos[idx - 1] || tripPhotos[0];
      img.src = safeSrc;
      caption.textContent = tripCaptions[idx - 1] || '';
      img.onerror = () => {
        img.src = `https://placehold.co/900x1200/1b5e20/ffffff?text=Viaje+${idx}`;
      };
    }
  };
}

function createDaisy(seed, index, openLightbox) {
  const daisy = document.createElement('button');
  daisy.className = 'daisy';
  daisy.type = 'button';
  daisy.setAttribute('aria-label', `Margarita ${index + 1}`);
  daisy.style.left = `${seed.x}%`;
  daisy.style.top = `${seed.y}%`;
  daisy.dataset.depth = seed.depth;
  daisy.dataset.rot = seed.rot;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('role', 'presentation');
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(svgNS, 'defs');
  const gradId = `petalGrad-${index}-${Math.floor(Math.random() * 9999)}`;
  const centerGradId = `centerGrad-${index}-${Math.floor(Math.random() * 9999)}`;
  const noiseId = `petalNoise-${index}-${Math.floor(Math.random() * 9999)}`;

  const lin = document.createElementNS(svgNS, 'linearGradient');
  lin.id = gradId;
  lin.setAttribute('x1', '0%');
  lin.setAttribute('y1', '0%');
  lin.setAttribute('x2', '0%');
  lin.setAttribute('y2', '100%');
  [
    ['0%', '#ffffff'],
    ['45%', '#fffaf0'],
    ['80%', '#f6f0dd'],
    ['100%', '#e8dec5']
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    lin.appendChild(stop);
  });

  const rad = document.createElementNS(svgNS, 'radialGradient');
  rad.id = centerGradId;
  rad.setAttribute('cx', '50%');
  rad.setAttribute('cy', '50%');
  rad.setAttribute('r', '55%');
  [
    ['0%', '#ffebb3'],
    ['55%', '#fbc02d'],
    ['100%', '#d17a0f']
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    rad.appendChild(stop);
  });

  const filter = document.createElementNS(svgNS, 'filter');
  filter.id = noiseId;
  const turb = document.createElementNS(svgNS, 'feTurbulence');
  turb.setAttribute('type', 'fractalNoise');
  turb.setAttribute('baseFrequency', '0.9');
  turb.setAttribute('numOctaves', '2');
  turb.setAttribute('seed', `${index * 13}`);
  turb.setAttribute('result', 'noise');
  const disp = document.createElementNS(svgNS, 'feDisplacementMap');
  disp.setAttribute('in', 'SourceGraphic');
  disp.setAttribute('in2', 'noise');
  disp.setAttribute('scale', '0.7');
  disp.setAttribute('xChannelSelector', 'R');
  disp.setAttribute('yChannelSelector', 'G');
  filter.append(turb, disp);

  defs.append(lin, rad, filter);
  svg.appendChild(defs);

  const petalsGroup = document.createElementNS(svgNS, 'g');
  petalsGroup.setAttribute('class', 'petals');

  const petalCount = 16 + Math.floor(Math.random() * 7); // 16-22
  for (let i = 0; i < petalCount; i++) {
    const angle = (360 / petalCount) * i;
    const jitter = () => (Math.random() - 0.5) * 6;
    const lengthJitter = (Math.random() - 0.5) * 10;
    const widthJitter = (Math.random() - 0.5) * 6;
    const path = document.createElementNS(svgNS, 'path');
    const d = [
      `M 60 ${10 + jitter()}`,
      `C ${45 + widthJitter} ${40 + jitter()} ${42 + widthJitter} ${70 + jitter()} 60 ${96 + lengthJitter}`,
      `C ${78 - widthJitter} ${70 + jitter()} ${75 - widthJitter} ${40 + jitter()} 60 ${10 + jitter()}`,
      'Z'
    ].join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', `url(#${gradId})`);
    path.setAttribute('stroke', 'rgba(255,255,255,0.55)');
    path.setAttribute('stroke-width', '0.6');
    path.setAttribute('opacity', `${0.8 + Math.random() * 0.2}`);
    const rot = angle + (Math.random() - 0.5) * 5;
    const scale = 0.95 + Math.random() * 0.12;
    path.setAttribute('transform', `translate(0, ${Math.random() * 2}) rotate(${rot} 60 60) scale(${scale})`);
    path.setAttribute('filter', `url(#${noiseId})`);
    petalsGroup.appendChild(path);
  }

  const center = document.createElementNS(svgNS, 'circle');
  center.setAttribute('class', 'daisy-center');
  center.setAttribute('cx', '60');
  center.setAttribute('cy', '60');
  center.setAttribute('r', '14');
  center.setAttribute('fill', `url(#${centerGradId})`);

  svg.append(petalsGroup, center);
  daisy.appendChild(svg);
  daisy.addEventListener('click', () => openLightbox(index + 1));
  return daisy;
}

function setupForestGallery() {
  if (!memoryStage) return;

  // Oculta tÃ­tulos tÃ©cnicos para una entrada mÃ¡s narrativa
  const header = memoriesSection?.querySelector('.panel-header');
  if (header) header.classList.add('soft-hidden');

  memoryStage.innerHTML = '';
  memoryStage.classList.add('forest-layout');

  const forestPanel = document.createElement('div');
  forestPanel.id = 'forestPanel';
  forestPanel.className = 'forest-panel';
  forestPanel.setAttribute('aria-label', 'Explora el bosque con tu cursor o dedo');

  const forestMeadow = document.createElement('div');
  forestMeadow.id = 'forestMeadow';
  forestMeadow.className = 'forest-meadow';
  forestPanel.appendChild(forestMeadow);

  const copy = document.createElement('div');
  copy.className = 'forest-copy';
  copy.innerHTML = `
    <h3>Entre luci&eacute;rnagas y margaritas</h3>
    <p>Deja que la luz recorra el bosque; cada flor guarda una escena nuestra.</p>
    <p>Cuando la linterna roza una margarita, despierta y brilla. Al tocarla, el recuerdo se abre en la caja de madera.</p>`;

  memoryStage.append(forestPanel, copy);

  const lightbox = createLightbox();

  forestSeeds.forEach((seed, idx) => {
    forestMeadow.appendChild(createDaisy(seed, idx, lightbox.open));
  });

  const updateFromPointer = (clientX, clientY) => {
    const rect = forestPanel.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    forestPanel.style.setProperty('--light-x', `${x}px`);
    forestPanel.style.setProperty('--light-y', `${y}px`);

    const panX = ((x / rect.width) - 0.5) * 16;
    const panY = ((y / rect.height) - 0.5) * 12;
    forestPanel.style.setProperty('--bg-x', `${50 + panX}%`);
    forestPanel.style.setProperty('--bg-y', `${50 + panY}%`);

    forestMeadow.querySelectorAll('.daisy').forEach((daisy) => {
      const depth = parseFloat(daisy.dataset.depth || '1');
      const rot = parseFloat(daisy.dataset.rot || '0');
      const bounds = daisy.getBoundingClientRect();
      const cx = bounds.left + bounds.width / 2 - rect.left;
      const cy = bounds.top + bounds.height / 2 - rect.top;
      const dist = Math.hypot(cx - x, cy - y);
      const strength = Math.max(0, 1 - dist / 220);
      const scale = 0.5 + strength * 0.7;
      const parallaxX = ((x / rect.width) - 0.5) * 12 * (depth - 0.5);
      const parallaxY = ((y / rect.height) - 0.5) * 10 * (depth - 0.5);
      daisy.style.transform = `translate(-50%, -50%) translate(${parallaxX}px, ${parallaxY}px) scale(${scale}) rotate(${rot}deg)`;
      daisy.style.filter = `drop-shadow(0 0 ${6 + strength * 12}px rgba(255,255,255,${0.18 + strength * 0.45}))`;
    });
  };

  forestPanel.addEventListener('mousemove', (e) => updateFromPointer(e.clientX, e.clientY));
  forestPanel.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    updateFromPointer(t.clientX, t.clientY);
  }, { passive: true });

  forestPanel.addEventListener('mouseleave', () => {
    const rect = forestPanel.getBoundingClientRect();
    updateFromPointer(rect.width / 2 + rect.left, rect.height / 2 + rect.top);
  });

  const rect = forestPanel.getBoundingClientRect();
  updateFromPointer(rect.width / 2 + rect.left, rect.height / 2 + rect.top);

  buildIntroOverlay(memoriesSection, forestPanel);
}

setupForestGallery();
setupSeedsField();
setupCarpirPanel();

function prepareCarpirCursorImage() {
  if (!carpirCursor || !carpirCursorSrc || carpirCursorPrepared || carpirCursorPreparing) return;
  if (/sin_fondo/i.test(carpirCursorSrc)) {
    carpirCursorPrepared = true;
    return;
  }
  carpirCursorPreparing = true;

  const cursorImg = new Image();
  cursorImg.onload = () => {
    try {
      const baseCanvas = document.createElement('canvas');
      baseCanvas.width = cursorImg.naturalWidth;
      baseCanvas.height = cursorImg.naturalHeight;
      const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
      if (!baseCtx) {
        carpirCursorPreparing = false;
        return;
      }

      baseCtx.drawImage(cursorImg, 0, 0);
      const imageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
      const px = imageData.data;
      const width = baseCanvas.width;
      const height = baseCanvas.height;

      const cornerSamples = [
        0,
        (width - 1) * 4,
        ((height - 1) * width) * 4,
        ((height - 1) * width + (width - 1)) * 4
      ];
      let bgR = 0;
      let bgG = 0;
      let bgB = 0;
      cornerSamples.forEach((idx) => {
        bgR += px[idx];
        bgG += px[idx + 1];
        bgB += px[idx + 2];
      });
      bgR /= cornerSamples.length;
      bgG /= cornerSamples.length;
      bgB /= cornerSamples.length;

      for (let i = 0; i < px.length; i += 4) {
        const dr = px[i] - bgR;
        const dg = px[i + 1] - bgG;
        const db = px[i + 2] - bgB;
        const dist = Math.hypot(dr, dg, db);

        if (dist < 48) {
          px[i + 3] = 0;
        } else if (dist < 80) {
          const t = (dist - 48) / 32;
          px[i + 3] = Math.round(px[i + 3] * t);
        }
      }

      baseCtx.putImageData(imageData, 0, 0);

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const alpha = px[((y * width) + x) * 4 + 3];
          if (alpha > 20) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      let finalDataUrl = baseCanvas.toDataURL('image/png');
      if (maxX >= minX && maxY >= minY) {
        const pad = 10;
        const trimW = maxX - minX + 1;
        const trimH = maxY - minY + 1;
        const trimCanvas = document.createElement('canvas');
        trimCanvas.width = trimW + (pad * 2);
        trimCanvas.height = trimH + (pad * 2);
        const trimCtx = trimCanvas.getContext('2d');
        if (trimCtx) {
          trimCtx.drawImage(baseCanvas, minX, minY, trimW, trimH, pad, pad, trimW, trimH);
          finalDataUrl = trimCanvas.toDataURL('image/png');
        }
      }

      carpirCursor.src = finalDataUrl;
      carpirCursorPrepared = true;
    } finally {
      carpirCursorPreparing = false;
    }
  };
  cursorImg.onerror = () => {
    carpirCursorPreparing = false;
  };
  cursorImg.src = carpirCursorSrc;
}

function setupCarpirPanel() {
  if (!carpirPanel || !carpirReveal || !carpirCanvas) return;
  prepareCarpirCursorImage();

  const setCursorVisible = (show) => {
    if (!carpirReveal || !carpirCursor) return;
    carpirReveal.classList.toggle('cursor-active', show && !carpirCompleted);
  };

  const moveCursor = (clientX, clientY) => {
    if (!carpirReveal || !carpirCursor) return;
    const rect = carpirReveal.getBoundingClientRect();
    carpirCursor.style.left = `${clientX - rect.left}px`;
    carpirCursor.style.top = `${clientY - rect.top}px`;
  };

  const resizeAndPaint = () => {
    const rect = carpirReveal.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    carpirDpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    carpirCanvas.width = Math.floor(width * carpirDpr);
    carpirCanvas.height = Math.floor(height * carpirDpr);
    carpirCanvas.style.width = `${width}px`;
    carpirCanvas.style.height = `${height}px`;

    carpirCtx = carpirCanvas.getContext('2d', { willReadFrequently: true });
    if (!carpirCtx) return;
    carpirCtx.setTransform(carpirDpr, 0, 0, carpirDpr, 0, 0);

    // Capa de tierra oscura con textura para "carpir".
    const soilGrad = carpirCtx.createLinearGradient(0, 0, 0, height);
    soilGrad.addColorStop(0, 'rgb(12, 8, 6)');
    soilGrad.addColorStop(0.45, 'rgb(18, 12, 9)');
    soilGrad.addColorStop(1, 'rgb(8, 5, 4)');
    carpirCtx.globalCompositeOperation = 'source-over';
    carpirCtx.fillStyle = soilGrad;
    carpirCtx.fillRect(0, 0, width, height);

    for (let i = 0; i < 1450; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const r = 0.5 + Math.random() * 2.4;
      carpirCtx.fillStyle = Math.random() > 0.55 ? 'rgba(96, 63, 35, 0.26)' : 'rgba(0, 0, 0, 0.2)';
      carpirCtx.beginPath();
      carpirCtx.arc(x, y, r, 0, Math.PI * 2);
      carpirCtx.fill();
    }

    for (let i = 0; i < 260; i += 1) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const len = 8 + Math.random() * 24;
      const angle = Math.random() * Math.PI * 2;
      carpirCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(120, 82, 44, 0.16)' : 'rgba(40, 24, 16, 0.24)';
      carpirCtx.lineWidth = 0.7 + Math.random() * 1.3;
      carpirCtx.beginPath();
      carpirCtx.moveTo(x, y);
      carpirCtx.lineTo(x + (Math.cos(angle) * len), y + (Math.sin(angle) * len));
      carpirCtx.stroke();
    }

    for (let i = 0; i < 26; i += 1) {
      const cx = Math.random() * width;
      const cy = Math.random() * height;
      const rw = 22 + Math.random() * 50;
      const rh = 10 + Math.random() * 26;
      carpirCtx.fillStyle = 'rgba(88, 58, 32, 0.12)';
      carpirCtx.beginPath();
      carpirCtx.ellipse(cx, cy, rw, rh, Math.random() * Math.PI, 0, Math.PI * 2);
      carpirCtx.fill();
    }

    const edgeShadow = carpirCtx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.28, width / 2, height / 2, Math.max(width, height) * 0.78);
    edgeShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
    edgeShadow.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    carpirCtx.fillStyle = edgeShadow;
    carpirCtx.fillRect(0, 0, width, height);
  };

  const updateProgress = () => {
    if (!carpirCtx || !carpirCanvas || carpirCompleted) return;
    const data = carpirCtx.getImageData(0, 0, carpirCanvas.width, carpirCanvas.height).data;
    let cleared = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 16) {
      total += 1;
      if (data[i] < 35) cleared += 1;
    }
    const pct = Math.min(100, Math.round((cleared / Math.max(1, total)) * 100));

    if (pct >= 70) {
      carpirCompleted = true;
      carpirCanvas.classList.add('cleared');
      carpirCanvas.style.pointerEvents = 'none';
      setCursorVisible(false);
      if (carpirMessage) carpirMessage.classList.add('show');
    }
  };

  const scheduleProgressCheck = () => {
    if (carpirMeasureRaf) return;
    carpirMeasureRaf = requestAnimationFrame(() => {
      carpirMeasureRaf = null;
      updateProgress();
    });
  };

  const scratchAt = (clientX, clientY) => {
    if (!carpirCtx || !carpirCanvas || carpirCompleted) return;
    const rect = carpirCanvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const radius = 34;

    carpirCtx.save();
    carpirCtx.globalCompositeOperation = 'destination-out';
    const g = carpirCtx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    g.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    carpirCtx.fillStyle = g;
    carpirCtx.beginPath();
    carpirCtx.arc(x, y, radius, 0, Math.PI * 2);
    carpirCtx.fill();
    carpirCtx.restore();

    scheduleProgressCheck();
  };

  if (!carpirBound) {
    carpirCanvas.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch') return;
      moveCursor(e.clientX, e.clientY);
      setCursorVisible(true);
    });
    carpirCanvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') {
        moveCursor(e.clientX, e.clientY);
        setCursorVisible(true);
      }
      carpirScratching = true;
      scratchAt(e.clientX, e.clientY);
    });
    carpirCanvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') {
        moveCursor(e.clientX, e.clientY);
        setCursorVisible(true);
      }
      if (!carpirScratching) return;
      scratchAt(e.clientX, e.clientY);
    });
    carpirCanvas.addEventListener('pointerleave', () => {
      carpirScratching = false;
      setCursorVisible(false);
    });
    window.addEventListener('pointerup', () => {
      carpirScratching = false;
    });
    carpirCanvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    window.addEventListener('resize', () => {
      if (carpirPanel.classList.contains('hidden')) return;
      resetCarpirPanel();
    });
    carpirBound = true;
  }

  resizeAndPaint();
}

function resetCarpirPanel() {
  if (!carpirCanvas || !carpirPanel) return;
  carpirCompleted = false;
  carpirScratching = false;
  carpirCanvas.classList.remove('cleared');
  carpirCanvas.style.pointerEvents = 'auto';
  if (carpirReveal) carpirReveal.classList.remove('cursor-active');
  if (carpirMessage) carpirMessage.classList.remove('show');
  requestAnimationFrame(setupCarpirPanel);
}

// === 6. Campo de Margaritas (Semillas) ===
function setupSeedsField(rebuild = false) {
  if (!seedsPanel || !seedsFlowers) return;

  const messages = [
    'A veces me quedo mir\u00e1ndote y me pregunto c\u00f3mo tuve la suerte de que nuestros caminos se cruzaran aquel d\u00eda.',
    'Despu\u00e9s de casi tres a\u00f1os, sigo encontrando razones nuevas para elegirte cada ma\u00f1ana.',
    'Me encanta la paz que me das sin decir una sola palabra; eres mi lugar seguro en el mundo.',
    'Gracias por ser la persona que me motiva a ser mejor, sin pedirme nunca que deje de ser yo mismo.',
    'No es solo el tiempo que llevamos, es lo que hemos construido en cada peque\u00f1o detalle cotidiano.',
    'Me haces sentir que cualquier tormenta es pasajera si al final del d\u00eda vuelvo a ti.',
    'Eres la combinaci\u00f3n perfecta de fuerza y ternura; admiro cada parte de quien eres.',
    'Contigo aprend\u00ed que el amor no es solo una emoci\u00f3n, sino la decisi\u00f3n de cuidar y crecer al lado.',
    'No importa el idioma, lo que tenemos es esa forma en la que nos entendemos solo con miradas.',
    'Mi faro favorito siempre ser\u00e1 verte sonre\u00edr y saber que soy parte de ese brillo.',
    'Eres el hogar que no sab\u00eda que estaba buscando hasta que te encontr\u00e9.',
    'Si pudiera volver atr\u00e1s, te buscar\u00eda de nuevo solo para tener el placer de volver a conocerte.'
  ];

  const baseSlots = [
    [18, 58], [32, 62], [46, 58], [60, 62],
    [22, 74], [38, 76], [54, 73], [70, 76],
    [26, 88], [42, 90], [58, 88], [74, 90]
  ];

  const seedsData = baseSlots.map((pos, i) => {
    const jitter = () => (Math.random() - 0.5) * 4; // pequeÃ±a variaciÃ³n para naturalidad
    return {
      id: i,
      x: pos[0] + jitter(),
      y: pos[1] + jitter(),
      depth: 0.65 + Math.random() * 0.5,
      rot: (Math.random() - 0.5) * 10,
      message: messages[i]
    };
  });

  if (rebuild) {
    seedsPanel.querySelector('.love-note')?.remove();
  }

  let modal = seedsPanel.querySelector('.love-note');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'love-note';
    modal.innerHTML = `
      <div class="note-card">
        <button class="note-close" aria-label="Cerrar mensaje">&times;</button>
        <p class="note-text"></p>
      </div>`;
    seedsPanel.appendChild(modal);
  }
  const noteText = modal.querySelector('.note-text');
  const closeNote = () => modal.classList.remove('open');
  modal.addEventListener('click', (e) => { if (e.target === modal) closeNote(); });
  modal.querySelector('.note-close')?.addEventListener('click', closeNote);

  seedsFlowers.innerHTML = '';
  const openNote = (id, txt) => {
    noteText.textContent = txt;
    modal.classList.add('open');
    seedsOpened.add(id);
    if (!eggTriggered && seedsOpened.size >= messages.length) {
      setTimeout(triggerFinalSequence, 5000); // deja leer la Ãºltima carta ~5s
    }
  };

  seedsData.forEach((seed, idx) => {
    const flower = createOrganicDaisy(seed, idx, openNote);
    seedsFlowers.appendChild(flower);
  });

  function triggerFinalSequence() {
    eggTriggered = true;
    modal.classList.remove('open');
    if (seedsFlowers) seedsFlowers.classList.add('disabled');
    if (seedsPanel) seedsPanel.classList.add('seeds-panel-hidden');
    document.body.classList.add('final-sequence-lighting');
    document.body.classList.remove('final-bloomed');

    finalStageOverlay = document.createElement('div');
    finalStageOverlay.className = 'final-stage';
    finalStageOverlay.innerHTML = `<div class="final-canvas"></div>`;
    document.body.appendChild(finalStageOverlay);
    createFinalFirefly();
  }

  function createFinalFirefly() {
    if (!finalStageOverlay) return;
    const canvas = finalStageOverlay.querySelector('.final-canvas');
    const fly = document.createElement('div');
    fly.className = 'firefly-final';
    canvas.appendChild(fly);
    fly.addEventListener('animationend', () => {
      fly.remove();
      spawnSapling();
    });
  }

  function spawnSapling() {
    saplingGrowCount = 0;
    if (!finalStageOverlay) return;
    const canvas = finalStageOverlay.querySelector('.final-canvas');
    saplingNode = document.createElement('div');
    saplingNode.className = 'sapling';
    saplingNode.style.setProperty('--growth', '1');

    const saplingTemplate = document.getElementById('final-sapling-template');
    if (saplingTemplate instanceof HTMLTemplateElement) {
      saplingNode.appendChild(saplingTemplate.content.cloneNode(true));
    }

    const petals = Array.from(saplingNode.querySelectorAll('#final-sapling-container .petal'));
    const pairJitter = Array.from({ length: 6 }, () => (Math.random() - 0.5) * 2.2);
    petals.forEach((petal, index) => {
      const finalAngle = parseFloat(petal.style.getPropertyValue('--final-angle')) || index * 30;
      const initialAngle = parseFloat(petal.style.getPropertyValue('--initial-angle')) || -60 + (index * 10);
      const jitter = pairJitter[index % 6];
      const depth = 0.86 + Math.random() * 0.12;
      const shadowX = -1.2 + Math.random() * 2.4;
      const shadowY = 3 + Math.random() * 2.1;
      petal.style.setProperty('--final-angle', `${(finalAngle + jitter).toFixed(2)}deg`);
      petal.style.setProperty('--initial-angle', `${(initialAngle + (jitter * 0.5)).toFixed(2)}deg`);
      petal.style.setProperty('--petal-alpha', depth.toFixed(2));
      petal.style.setProperty('--shadow-x', `${shadowX.toFixed(2)}px`);
      petal.style.setProperty('--shadow-y', `${shadowY.toFixed(2)}px`);
    });

    saplingNode.style.left = '50%';
    saplingNode.style.top = '70%';
    canvas.appendChild(saplingNode);
    saplingNode.addEventListener('click', growSapling);
  }

  function growSapling() {
    if (!saplingNode) return;
    if (saplingNode.classList.contains('final-bloomed')) return;

    saplingGrowCount += 1;
    const clampedGrowth = Math.min(saplingGrowCount, 4);
    const growthValue = 1 + (clampedGrowth * 0.12);
    saplingNode.style.setProperty('--growth', growthValue.toFixed(2));

    if (saplingGrowCount === 5) bloomTree();
  }

  function bloomTree() {
    if (!saplingNode) return;
    const container = saplingNode.querySelector('#final-sapling-container');
    if (container) container.classList.add('blooming');
    saplingNode.classList.add('final-bloomed');
    document.body.classList.add('final-bloomed');
    launchFinalPollen();
    setTimeout(showFinalMessage, 2400);
  }

  function launchFinalPollen() {
    if (!finalStageOverlay) return;
    const canvas = finalStageOverlay.querySelector('.final-canvas');
    if (!canvas) return;

    for (let i = 0; i < 20; i += 1) {
      const particle = document.createElement('span');
      particle.className = 'final-pollen';
      particle.style.left = '50%';
      particle.style.top = '42%';
      particle.style.setProperty('--orbit', `${48 + Math.random() * 85}px`);
      particle.style.setProperty('--spin-start', `${Math.random() * 360}deg`);
      particle.style.setProperty('--spin-turn', `${360 + Math.random() * 540}deg`);
      particle.style.setProperty('--rise', `${-26 - Math.random() * 80}px`);
      particle.style.animationDelay = `${Math.random() * 0.35}s`;
      canvas.appendChild(particle);
      setTimeout(() => particle.remove(), 3000);
    }
  }

  function showFinalMessage() {
    const panel = document.createElement('div');
    panel.className = 'final-message';
    panel.innerHTML = `
      <div class="final-card">
        <p class="final-pre">Casi 3 a&ntilde;os</p>
        <h3>Un bosque no se crea de la noche a la ma&ntilde;ana; se cultiva con paciencia, ra&iacute;ces fuertes y amor que resiste todas las estaciones. Gracias por estos casi 3 a&ntilde;os de crecimiento mutuo. Lo mejor est&aacute; por florecer.</h3>
      </div>`;
    (finalStageOverlay || document.body).appendChild(panel);
    panel.addEventListener('click', () => {
      panel.remove();
      finalStageOverlay?.remove();
      finalStageOverlay = null;
      document.body.classList.remove('final-sequence-lighting', 'final-bloomed');
    });
  }
}

function resetSeedsExperience() {
  seedsOpened = new Set();
  eggTriggered = false;
  saplingGrowCount = 0;
  saplingNode = null;
  finalStageOverlay?.remove();
  finalStageOverlay = null;
  document.body.classList.remove('final-sequence-lighting', 'final-bloomed');
  seedsPanel?.classList.remove('seeds-panel-hidden');
  seedsField?.classList.remove('final-dim');
  seedsFlowers?.classList.remove('disabled');
  const modal = seedsPanel?.querySelector('.love-note');
  if (modal) modal.classList.remove('open');
  setupSeedsField(true);
}

function createOrganicDaisy(seed, index, openNote) {
  const daisy = document.createElement('button');
  daisy.className = 'seed-daisy';
  daisy.type = 'button';
  daisy.style.left = `${seed.x}%`;
  daisy.style.top = `${seed.y}%`;
  daisy.dataset.depth = seed.depth;
  daisy.dataset.rot = seed.rot;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('aria-hidden', 'true');

  const defs = document.createElementNS(svgNS, 'defs');
  const gradId = `seedGrad-${index}-${Math.floor(Math.random() * 9999)}`;
  const centerGradId = `seedCenter-${index}-${Math.floor(Math.random() * 9999)}`;

  const lin = document.createElementNS(svgNS, 'linearGradient');
  lin.id = gradId;
  lin.setAttribute('x1', '0%');
  lin.setAttribute('y1', '0%');
  lin.setAttribute('x2', '0%');
  lin.setAttribute('y2', '100%');
  [
    ['0%', '#ffffff'],
    ['40%', '#fffaf3'],
    ['85%', '#f3e8d0'],
    ['100%', '#eadbb5']
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    lin.appendChild(stop);
  });

  const rad = document.createElementNS(svgNS, 'radialGradient');
  rad.id = centerGradId;
  rad.setAttribute('cx', '50%');
  rad.setAttribute('cy', '50%');
  rad.setAttribute('r', '55%');
  [
    ['0%', '#ffeea8'],
    ['55%', '#f7c74a'],
    ['100%', '#c9891a']
  ].forEach(([offset, color]) => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    rad.appendChild(stop);
  });

  defs.append(lin, rad);
  svg.appendChild(defs);

  const petalsGroup = document.createElementNS(svgNS, 'g');
  const petalCount = 18 + Math.floor(Math.random() * 7); // 18-24
  for (let i = 0; i < petalCount; i++) {
    const angle = (360 / petalCount) * i;
    const jitter = () => (Math.random() - 0.5) * 5;
    const path = document.createElementNS(svgNS, 'path');
    const d = [
      `M 60 ${8 + jitter()}`,
      `C ${44 + jitter()} ${36 + jitter()} ${43 + jitter()} ${70 + jitter()} 60 ${98 + jitter()}`,
      `C ${77 + jitter()} ${70 + jitter()} ${76 + jitter()} ${36 + jitter()} 60 ${8 + jitter()}`,
      'Z'
    ].join(' ');
    path.setAttribute('d', d);
    path.setAttribute('fill', `url(#${gradId})`);
    path.setAttribute('stroke', 'rgba(255,255,255,0.6)');
    path.setAttribute('stroke-width', '0.5');
    const rot = angle + (Math.random() - 0.5) * 6;
    const scale = 0.92 + Math.random() * 0.14;
    path.setAttribute('transform', `rotate(${rot} 60 60) scale(${scale}) translate(0 ${Math.random() * 1.5})`);
    path.setAttribute('opacity', `${0.82 + Math.random() * 0.18}`);
    petalsGroup.appendChild(path);
  }

  const center = document.createElementNS(svgNS, 'circle');
  center.setAttribute('cx', '60');
  center.setAttribute('cy', '60');
  center.setAttribute('r', '14');
  center.setAttribute('fill', `url(#${centerGradId})`);
  center.setAttribute('filter', 'drop-shadow(0 0 8px rgba(255, 215, 80, 0.55))');

  svg.append(petalsGroup, center);
  daisy.appendChild(svg);

  const bloom = (strength) => {
    const scale = 0.7 + strength * 0.6;
    daisy.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${seed.rot}deg)`;
    daisy.style.filter = `drop-shadow(0 0 ${4 + strength * 14}px rgba(255, 215, 80, ${0.15 + strength * 0.45}))`;
  };

  daisy.addEventListener('mousemove', () => bloom(1));
  daisy.addEventListener('mouseleave', () => bloom(0.4));
  daisy.addEventListener('click', () => openNote(seed.id, seed.message));

  bloom(0.4);
  return daisy;
}

function buildIntroOverlay(section, anchor) {
  if (!section || !anchor) return;
  const intro = document.createElement('div');
  intro.className = 'intro-forest';
  intro.innerHTML = `
    <div class="intro-inner">
      <p class="intro-pre">Umbral de memorias</p>
      <h3 class="intro-title">A continuaci&oacute;n encontrar&aacute;s muchas fotos que est&aacute;n en mi memoria... cada una es un brote de lo que hemos cultivado.</h3>
      <button class="intro-btn" type="button">Entrar al Bosque</button>
    </div>`;

  section.appendChild(intro);

  const fadeOut = () => {
    if (!intro.isConnected) return;
    intro.classList.add('fade-out');
    setTimeout(() => intro.remove(), 800);
    window.removeEventListener('scroll', onScroll);
    clearTimeout(autoFadeTimer);
  };

  let allowFade = false;
  const autoFadeTimer = setTimeout(() => {
    allowFade = true;
    fadeOut();
  }, 5200); // permanece visible ~5s para ser leÃ­do

  intro.querySelector('.intro-btn')?.addEventListener('click', () => {
    allowFade = true; // permite que el botÃ³n omita la espera
    fadeOut();
  });

  const onScroll = () => {
    if (!allowFade || !intro.isConnected) return;
    const top = intro.getBoundingClientRect().top;
    if (top < window.innerHeight * 0.35) fadeOut();
  };

  window.addEventListener('scroll', onScroll);
}

function rebuildIntroOverlay() {
  if (!memoriesSection) return;
  memoriesSection.querySelector('.intro-forest')?.remove();
  const anchor = document.getElementById('forestPanel');
  buildIntroOverlay(memoriesSection, anchor);
}


