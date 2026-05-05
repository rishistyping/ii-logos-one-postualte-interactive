/* ------------------------------------------------------------------
   Pinned-nav state
   ------------------------------------------------------------------ */
const nav = document.getElementById('nav');
const onScroll = () => {
  if (window.scrollY > 28) nav.classList.add('is-pinned');
  else nav.classList.remove('is-pinned');
};
window.addEventListener('scroll', onScroll, { passive:true });
onScroll();

/* ------------------------------------------------------------------
   Reveal-on-scroll
   ------------------------------------------------------------------ */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

/* ==================================================================
   κ-DIAL — Experiment 1
   Renders the spacetime diagram for the chosen sign of κ
   and a small readout of the algebraic consequences.
================================================================== */
const kStage = document.getElementById('kStage');
const kReadout = document.getElementById('kReadout');
const kBtns = document.querySelectorAll('.kappa-dial button');

const KAPPA_DATA = {
  '-1': {
    name: 'Euclidean',
    blurb: 'No causality. All four directions look alike. Velocity loops back to rest.',
    speed: 'imaginary',
    metric: 'Euclidean (++++)',
    causal: 'none — no past, no future',
    background: 'none',
    verdict: 'eliminated'
  },
  '0': {
    name: 'Galilean',
    blurb: 'Killing form blind on boosts. Time is absolute, but the algebra cannot fix the spatial scale.',
    speed: 'undefined (no ruler)',
    metric: 'dt² only — degenerate',
    causal: 'none — no lightcones',
    background: 'absolute time, absolute space',
    verdict: 'eliminated'
  },
  '1': {
    name: 'Lorentzian',
    blurb: 'The only universe that survives. Finite invariant speed, lightcones, unified spacetime.',
    speed: 'V = 1/√κ — finite, real',
    metric: 'Minkowski (+−−−)',
    causal: 'lightcones — past/future distinct',
    background: 'none — algebra supplies it all',
    verdict: 'survives ✓'
  }
};

function renderKappaDiagram(kSign){
  // Returns SVG string for the chosen κ regime
  const accent = '#2F95A6', tertiary = '#83A1CC', secondary = '#516071', primary = '#0F233F';
  if (kSign === '1') {
    // Lorentzian: lightcones
    return `
      <svg viewBox="0 0 320 280" aria-hidden="true">
        <defs>
          <pattern id="kdg-l" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="rgba(15,35,63,.18)"/>
          </pattern>
        </defs>
        <rect width="320" height="280" fill="rgba(47,149,166,.04)"/>
        <rect width="320" height="280" fill="url(#kdg-l)"/>
        <polygon points="160,140 290,10 30,10" fill="rgba(47,149,166,.18)"/>
        <polygon points="160,140 290,270 30,270" fill="rgba(47,149,166,.18)"/>
        <line x1="30" y1="10" x2="160" y2="140" stroke="${accent}" stroke-width="2"/>
        <line x1="290" y1="10" x2="160" y2="140" stroke="${accent}" stroke-width="2"/>
        <line x1="30" y1="270" x2="160" y2="140" stroke="${accent}" stroke-width="2"/>
        <line x1="290" y1="270" x2="160" y2="140" stroke="${accent}" stroke-width="2"/>
        <line x1="160" y1="6" x2="160" y2="274" stroke="${primary}" stroke-width="1"/>
        <line x1="6" y1="140" x2="314" y2="140" stroke="${primary}" stroke-width="1"/>
        <text x="166" y="20"  font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">t</text>
        <text x="298" y="134" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">x</text>
        <text x="200" y="80"  font-family="Source Serif 4" font-size="11" font-style="italic" fill="${accent}">future</text>
        <text x="200" y="220" font-family="Source Serif 4" font-size="11" font-style="italic" fill="${accent}">past</text>
        <text x="60"  y="155" font-family="Source Serif 4" font-size="10" fill="${secondary}">elsewhere</text>
        <text x="245" y="155" font-family="Source Serif 4" font-size="10" fill="${secondary}">elsewhere</text>
      </svg>`;
  }
  if (kSign === '0') {
    // Galilean: absolute time slices
    let lines = '';
    for (let y = 24; y < 280; y += 24) {
      if (Math.abs(y - 140) < 6) continue;
      lines += `<line x1="6" y1="${y}" x2="314" y2="${y}" stroke="${secondary}" stroke-width="1" stroke-dasharray="3 5" opacity=".55"/>`;
    }
    return `
      <svg viewBox="0 0 320 280" aria-hidden="true">
        <rect width="320" height="280" fill="rgba(81,96,113,.05)"/>
        ${lines}
        <line x1="160" y1="6" x2="160" y2="274" stroke="${primary}" stroke-width="1"/>
        <line x1="6" y1="140" x2="314" y2="140" stroke="${primary}" stroke-width="1"/>
        <text x="166" y="20"  font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">t</text>
        <text x="298" y="134" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">x</text>
        <text x="20" y="42" font-family="Source Serif 4" font-size="10" font-style="italic" fill="${secondary}">absolute "now"</text>
        <text x="20" y="262" font-family="Source Serif 4" font-size="10" font-style="italic" fill="${secondary}">earlier "now"</text>
      </svg>`;
  }
  // κ < 0: closed orbits / Euclidean rotation in t-x
  return `
    <svg viewBox="0 0 320 280" aria-hidden="true">
      <rect width="320" height="280" fill="rgba(131,161,204,.07)"/>
      <line x1="160" y1="6" x2="160" y2="274" stroke="rgba(15,35,63,.4)" stroke-width="1"/>
      <line x1="6" y1="140" x2="314" y2="140" stroke="rgba(15,35,63,.4)" stroke-width="1"/>
      <circle cx="160" cy="140" r="92" fill="none" stroke="${tertiary}" stroke-width="2"/>
      <path d="M 252 140 A 92 92 0 0 0 198 60" fill="none" stroke="${primary}" stroke-width="2" marker-end="url(#kArr)"/>
      <path d="M 68 140 A 92 92 0 0 0 122 220" fill="none" stroke="${primary}" stroke-width="2" marker-end="url(#kArr)"/>
      <defs>
        <marker id="kArr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,0 L8,5 L0,10 z" fill="${primary}"/>
        </marker>
      </defs>
      <circle cx="160" cy="48"  r="4" fill="${primary}"/>
      <circle cx="252" cy="140" r="3" fill="${tertiary}"/>
      <circle cx="160" cy="232" r="3" fill="${tertiary}"/>
      <circle cx="68"  cy="140" r="3" fill="${tertiary}"/>
      <text x="166" y="20"  font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">t</text>
      <text x="298" y="134" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">x</text>
      <text x="170" y="44" font-family="Source Serif 4" font-size="10" font-style="italic" fill="${primary}">start</text>
      <text x="170" y="270" font-family="Source Serif 4" font-size="10" font-style="italic" fill="${secondary}">closed orbits — no past/future</text>
    </svg>`;
}

function selectKappa(kSign){
  // Visual state
  kBtns.forEach(b => {
    const active = b.dataset.k === kSign;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  // Diagram
  kStage.innerHTML = renderKappaDiagram(kSign);
  // Readout
  const d = KAPPA_DATA[kSign];
  const winClass = kSign === '1' ? 'win' : '';
  kReadout.innerHTML = `
    <div>
      <dt>Killing form on boosts</dt>
      <dd class="${winClass}">${kSign === '1' ? '4κ > 0 — non-degenerate' : kSign === '0' ? '0 — degenerate' : '4κ < 0 — periodic'}</dd>
    </div>
    <div>
      <dt>Invariant speed</dt>
      <dd class="${winClass}">${d.speed}</dd>
    </div>
    <div>
      <dt>Spacetime metric</dt>
      <dd class="${winClass}">${d.metric}</dd>
    </div>
    <div>
      <dt>Causal structure</dt>
      <dd class="${winClass}">${d.causal}</dd>
    </div>
    <div style="grid-column: 1 / -1;">
      <dt>Verdict</dt>
      <dd class="${winClass}" style="font-family:var(--serif-display); font-size:18px;">${d.verdict}</dd>
    </div>
  `;
}

kBtns.forEach(b => b.addEventListener('click', () => selectKappa(b.dataset.k)));
selectKappa('1'); // default to the surviving universe

/* ==================================================================
   LORENTZ EXPLORER — Experiment 2
================================================================== */
const vSlider = document.getElementById('vSlider');
const vVal    = document.getElementById('vVal');
const gammaVal = document.getElementById('gammaVal');
const tiltVal  = document.getElementById('tiltVal');
const dilStat  = document.getElementById('dilStat');
const moveRuler = document.getElementById('moveRuler');
const minkStage = document.getElementById('minkStage');

function renderMinkowski(v){
  // Build axes that tilt by atan(v) in c=1 units.
  // SVG y is inverted, so "up" = future = -y direction.
  const w = 320, h = 280, cx = w/2, cy = h/2;
  const span = 130;

  // Rest-frame axes are vertical (t) and horizontal (x).
  // Moving-frame (primed) axes tilt by angle θ = atan(v) toward the lightcone.
  // t'-axis direction: (v, 1)  → endpoints at  (cx ± span*v, cy ∓ span)
  // x'-axis direction: (1, v)  → endpoints at  (cx ± span, cy ∓ span*v)
  const tpx = span * v, tpy = span;       // t' axis half-extent
  const xpx = span,     xpy = span * v;   // x' axis half-extent

  const accent = '#2F95A6';
  const primary = '#0F233F';
  const secondary = '#516071';
  const gold = '#C9A96E';

  return `
    <svg viewBox="0 0 ${w} ${h}" aria-label="Minkowski spacetime diagram with v=${v.toFixed(2)}c">
      <defs>
        <pattern id="mink-g" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.6" fill="rgba(15,35,63,.16)"/>
        </pattern>
      </defs>
      <rect width="${w}" height="${h}" fill="rgba(47,149,166,.04)"/>
      <rect width="${w}" height="${h}" fill="url(#mink-g)"/>

      <!-- light cones (45°) -->
      <line x1="${cx-span}" y1="${cy+span}" x2="${cx+span}" y2="${cy-span}" stroke="${gold}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".75"/>
      <line x1="${cx-span}" y1="${cy-span}" x2="${cx+span}" y2="${cy+span}" stroke="${gold}" stroke-width="1.4" stroke-dasharray="4 4" opacity=".75"/>

      <!-- rest-frame axes -->
      <line x1="${cx}" y1="${cy-span-12}" x2="${cx}" y2="${cy+span+12}" stroke="${primary}" stroke-width="1.2"/>
      <line x1="${cx-span-12}" y1="${cy}" x2="${cx+span+12}" y2="${cy}" stroke="${primary}" stroke-width="1.2"/>

      <!-- moving-frame t' axis (tilts toward upper right) -->
      <line x1="${cx-tpx}" y1="${cy+tpy}" x2="${cx+tpx}" y2="${cy-tpy}" stroke="${accent}" stroke-width="1.8"/>
      <!-- moving-frame x' axis (tilts toward upper right at lower angle) -->
      <line x1="${cx-xpx}" y1="${cy+xpy}" x2="${cx+xpx}" y2="${cy-xpy}" stroke="${accent}" stroke-width="1.8"/>

      <!-- worldline highlight: a moving observer's path = the t' axis -->
      <circle cx="${cx+tpx*0.55}" cy="${cy-tpy*0.55}" r="3.5" fill="${accent}"/>

      <!-- labels -->
      <text x="${cx+5}"    y="${cy-span-2}" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">ct</text>
      <text x="${cx+span+2}" y="${cy-4}"     font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${primary}">x</text>
      <text x="${cx+tpx+6}" y="${cy-tpy-4}" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${accent}">ct'</text>
      <text x="${cx+xpx+4}" y="${cy-xpy-6}" font-family="Cormorant Garamond" font-size="16" font-style="italic" fill="${accent}">x'</text>

      <!-- caption -->
      <text x="${cx}" y="${h - 10}" text-anchor="middle" font-family="Source Serif 4" font-size="11" font-style="italic" fill="${secondary}">
        moving frame at v = ${v.toFixed(2)}c — axes tilt toward the lightcone
      </text>
    </svg>`;
}

function updateLorentz(){
  const v = parseFloat(vSlider.value);
  vVal.textContent = v.toFixed(2);
  vSlider.style.setProperty('--p', (v / 0.99 * 100) + '%');

  const gamma = 1 / Math.sqrt(1 - v*v);
  const inv   = 1 / gamma;
  const tilt  = Math.atan(v) * 180 / Math.PI;

  gammaVal.textContent = gamma.toFixed(4);
  tiltVal.textContent  = tilt.toFixed(1) + '°';
  dilStat.textContent  = inv.toFixed(4) + ' ×';
  moveRuler.style.width = (inv * 100) + '%';

  minkStage.innerHTML = renderMinkowski(v);
}
vSlider.addEventListener('input', updateLorentz);
updateLorentz();

/* ==================================================================
   VELOCITY ADDITION — Experiment 3
   Compares Newton (v1+v2) and Einstein ((v1+v2)/(1+v1*v2/c²))
================================================================== */
const va1 = document.getElementById('va1');
const va2 = document.getElementById('va2');
const va1Val = document.getElementById('va1Val');
const va2Val = document.getElementById('va2Val');
const vaNewton = document.getElementById('vaNewton');
const vaNewtonNote = document.getElementById('vaNewtonNote');
const vaEinstein = document.getElementById('vaEinstein');
const vaEinsteinNote = document.getElementById('vaEinsteinNote');
const vaDiff = document.getElementById('vaDiff');

function updateVadd(){
  const v1 = parseFloat(va1.value);
  const v2 = parseFloat(va2.value);
  va1Val.textContent = v1.toFixed(2);
  va2Val.textContent = v2.toFixed(2);

  const newton = v1 + v2;
  const einstein = (v1 + v2) / (1 + v1 * v2);

  vaNewton.textContent = newton.toFixed(4);
  vaEinstein.textContent = einstein.toFixed(4);
  vaDiff.textContent = Math.abs(newton - einstein).toFixed(4);

  // Style Newton's number — flag when it goes super-luminal
  if (newton > 1) {
    vaNewton.classList.add('warn');
    vaNewton.classList.remove('win');
    vaNewtonNote.textContent = '→ exceeds c — impossible';
    vaNewtonNote.style.color = 'var(--gold)';
  } else {
    vaNewton.classList.remove('warn');
    vaNewtonNote.textContent = '→ within c — sub-luminal';
    vaNewtonNote.style.color = 'var(--secondary)';
  }

  // Einstein result is always sub-luminal for v1, v2 < c
  if (einstein > 0.99) {
    vaEinsteinNote.textContent = `→ approaches c (still ${einstein.toFixed(4)}c)`;
  } else {
    vaEinsteinNote.textContent = '→ stays sub-luminal · always';
  }
}
va1.addEventListener('input', updateVadd);
va2.addEventListener('input', updateVadd);
updateVadd();

/* ==================================================================
   ANIMATED KILLING-FORM COMPUTATION
================================================================== */
const kgrid = document.getElementById('kgrid');
const kfRun = document.getElementById('kfRun');
const kfReset = document.getElementById('kfReset');
const kfStatus = document.getElementById('kfStatus');

const KGEN = ['J₁','J₂','J₃','K₁','K₂','K₃'];

function buildKgrid(){
  kgrid.innerHTML = '';
  // Top-left corner
  const corner = document.createElement('div');
  corner.className = 'lbl';
  corner.textContent = 'B';
  corner.style.fontStyle = 'italic';
  corner.style.color = 'var(--secondary)';
  kgrid.appendChild(corner);

  // Header row
  for (let j = 0; j < 6; j++){
    const h = document.createElement('div');
    h.className = 'lbl ' + (j < 3 ? 'lbl-J' : 'lbl-K');
    h.textContent = KGEN[j];
    kgrid.appendChild(h);
  }
  // Data rows
  for (let i = 0; i < 6; i++){
    const row = document.createElement('div');
    row.className = 'lbl ' + (i < 3 ? 'lbl-J' : 'lbl-K');
    row.textContent = KGEN[i];
    kgrid.appendChild(row);
    for (let j = 0; j < 6; j++){
      const c = document.createElement('div');
      c.className = 'cell-k' + (i===j ? ' diag' : '');
      c.id = `kc-${i}-${j}`;
      c.textContent = '·';
      kgrid.appendChild(c);
    }
  }
}
buildKgrid();

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function runKillingAnim(){
  kfRun.disabled = true; kfReset.disabled = true;
  // Reset all
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++){
      const c = document.getElementById(`kc-${i}-${j}`);
      c.className = 'cell-k' + (i===j ? ' diag' : '');
      c.textContent = '·';
    }

  // Step 1 — diagonals on rotations
  kfStatus.innerHTML = 'Computing $B(J_i, J_i) = \\mathrm{tr}(\\mathrm{ad}_{J_i}^2)$ — the rotation diagonals.';
  if (window.renderMathInElement) renderMathInElement(kfStatus, window._katexOpts);
  for (let i = 0; i < 3; i++){
    const c = document.getElementById(`kc-${i}-${i}`);
    c.classList.add('computing'); c.textContent = '?';
    await sleep(420);
    c.classList.remove('computing'); c.classList.add('filled','rot');
    c.textContent = '−4';
    await sleep(160);
  }

  await sleep(220);
  kfStatus.innerHTML = 'Now $B(K_i, K_i) = \\mathrm{tr}(\\mathrm{ad}_{K_i}^2)$ — and here κ enters the proof.';
  if (window.renderMathInElement) renderMathInElement(kfStatus, window._katexOpts);

  // Step 2 — diagonals on boosts
  for (let i = 3; i < 6; i++){
    const c = document.getElementById(`kc-${i}-${i}`);
    c.classList.add('computing'); c.textContent = '?';
    await sleep(420);
    c.classList.remove('computing'); c.classList.add('filled','boost');
    c.textContent = '4κ';
    await sleep(180);
  }

  await sleep(260);
  kfStatus.innerHTML = 'Off-diagonals: by rotational + boost symmetry, all of these vanish.';

  // Step 3 — fill all off-diagonals with 0
  const offDiagOrder = [];
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 6; j++)
      if (i !== j) offDiagOrder.push([i, j]);

  for (const [i, j] of offDiagOrder){
    const c = document.getElementById(`kc-${i}-${j}`);
    c.classList.add('filled','zero');
    c.textContent = '0';
    await sleep(15);
  }

  await sleep(300);
  kfStatus.innerHTML = '<strong style="color:var(--accent)">Done.</strong> $B = \\mathrm{diag}(-4,-4,-4,\\,4\\kappa,4\\kappa,4\\kappa)$. The verdict reads off the sign of κ.';
  if (window.renderMathInElement) renderMathInElement(kfStatus, window._katexOpts);

  kfRun.disabled = false; kfReset.disabled = false;
}
function resetKillingAnim(){
  buildKgrid();
  kfStatus.textContent = 'Idle. Click Compute B to begin.';
}
kfRun.addEventListener('click', runKillingAnim);
kfReset.addEventListener('click', resetKillingAnim);

/* ==================================================================
   SYMPY NOTEBOOK — executable cells via Pyodide
================================================================== */
const nbStatus = document.getElementById('nbStatus');
const nbVersion = document.getElementById('nbVersion');

function setNbStatus(state, msg, version){
  nbStatus.classList.remove('is-loading','is-ready','is-error');
  if (state) nbStatus.classList.add('is-' + state);
  nbStatus.querySelector('.grow').innerHTML = msg;
  if (version) nbVersion.innerHTML = `<code>${version}</code>`;
}

async function ensurePyodide(){
  if (window.__pyodideReady) return window.__pyodideReady;
  setNbStatus('loading', 'Loading Pyodide + SymPy in your browser… one-time, ~10 MB.');
  let py;
  try {
    py = await window.loadPyodideLazily();
  } catch (e) {
    setNbStatus('error', 'Could not load Pyodide. Check your network connection or any content blocker, then refresh.');
    throw e;
  }
  // Read the version safely. Using a triple-quoted block avoids whatever
  // single-line semicolon-expression quirks runPython() returns on some
  // Pyodide versions, and ensures we always get a real JS string back.
  let ver = '';
  try {
    const raw = py.runPython([
      'import sys, sympy',
      'f"Python {sys.version_info.major}.{sys.version_info.minor} \\u00b7 sympy {sympy.__version__}"'
    ].join('\n'));
    ver = (raw && typeof raw.toString === 'function') ? String(raw) : '';
    if (raw && typeof raw.destroy === 'function') raw.destroy();
  } catch(_) { ver = ''; }
  setNbStatus('ready', '<strong style="color:var(--primary)">Ready.</strong> Edit any cell and re-run. SymPy is live in the browser.', ver);
  return py;
}

function clearOutput(outEl){ outEl.innerHTML = ''; }

// Escape characters that could break our innerHTML interpolations.
function htmlEscape(s){
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function appendOutputRow(outEl, kind, label, value){
  const row = document.createElement('div');
  row.className = 'out-row';
  const lab = document.createElement('div');
  lab.className = 'out-label';
  lab.textContent = label;
  const val = document.createElement('div');
  val.className = 'out-value';
  if (kind === 'tex' && typeof katex !== 'undefined'){
    try {
      katex.render(String(value), val, { displayMode: true, throwOnError: false });
    } catch(e){
      const pre = document.createElement('pre');
      pre.className = 'text';
      pre.textContent = String(value);
      val.appendChild(pre);
    }
  } else {
    const pre = document.createElement('pre');
    pre.className = 'text';
    pre.textContent = String(value);
    val.appendChild(pre);
  }
  row.appendChild(lab);
  row.appendChild(val);
  outEl.appendChild(row);
}

function appendOutputError(outEl, msg){
  const row = document.createElement('div');
  row.className = 'out-row';
  // Build with DOM nodes (not innerHTML) so error text containing
  // <, >, or & cannot break the page or hijack interpolation.
  const lab = document.createElement('div');
  lab.className = 'out-label';
  lab.style.color = '#a4453a';
  lab.textContent = 'Error';
  const val = document.createElement('div');
  val.className = 'out-value';
  const pre = document.createElement('pre');
  pre.className = 'text';
  pre.style.color = '#a4453a';
  pre.style.whiteSpace = 'pre-wrap';
  pre.textContent = String(msg);
  val.appendChild(pre);
  row.appendChild(lab);
  row.appendChild(val);
  outEl.appendChild(row);
}

// Strip our syntax-highlight spans so we get clean Python source.
// contenteditable browsers may insert <br> or wrap lines in <div> on edit;
// turn those into newlines before reading the text so Python still parses.
function extractCode(preEl){
  const clone = preEl.cloneNode(true);
  // Replace <br> with a real newline node
  clone.querySelectorAll('br').forEach(br => {
    br.replaceWith(document.createTextNode('\n'));
  });
  // For each <div> child a browser may have injected during editing,
  // prepend a newline and inline its children in place.
  clone.querySelectorAll('div').forEach(div => {
    const nl = document.createTextNode('\n');
    div.parentNode.insertBefore(nl, div);
    while (div.firstChild) div.parentNode.insertBefore(div.firstChild, div);
    div.remove();
  });
  // textContent over innerText: browser-independent, preserves source whitespace.
  return clone.textContent;
}

async function runCell(cellEl){
  const codeEl = cellEl.querySelector('.cell__code pre');
  const outEl  = cellEl.querySelector('.cell__output');
  const runBtn = cellEl.querySelector('.cell__btn--run');
  clearOutput(outEl);

  // Pending row built with DOM nodes (no innerHTML interpolation)
  const pendingRow = document.createElement('div');
  pendingRow.className = 'out-row';
  const pLab = document.createElement('div');
  pLab.className = 'out-label';
  pLab.textContent = 'Status';
  const pVal = document.createElement('div');
  pVal.className = 'out-value out-pending';
  pVal.textContent = 'Loading SymPy and executing…';
  pendingRow.appendChild(pLab);
  pendingRow.appendChild(pVal);
  outEl.appendChild(pendingRow);

  const oldLabel = runBtn.innerHTML;
  runBtn.disabled = true;
  runBtn.innerHTML = '<span class="spin">◜</span> Running';

  try {
    const py = await ensurePyodide();
    const code = extractCode(codeEl);

    // Run user code. Any Python exception becomes a JS PythonError.
    py.runPython(code);

    // Pull structured outputs. Defend against _outputs being missing
    // (e.g. setup script didn't run) by recreating it on demand.
    const outputsJson = py.runPython([
      'import json',
      'try:',
      '    _outs_payload = json.dumps(_outputs)',
      'except NameError:',
      '    _outputs = []',
      '    _outs_payload = json.dumps(_outputs)',
      '_outs_payload'
    ].join('\n'));

    const outputsStr = (outputsJson && typeof outputsJson === 'object' && typeof outputsJson.toString === 'function')
      ? outputsJson.toString()
      : String(outputsJson || '[]');
    if (outputsJson && typeof outputsJson.destroy === 'function') outputsJson.destroy();

    let outputs;
    try {
      outputs = JSON.parse(outputsStr);
    } catch (parseErr) {
      throw new Error('Could not parse cell outputs: ' + parseErr.message);
    }

    clearOutput(outEl);
    if (!Array.isArray(outputs) || outputs.length === 0){
      appendOutputRow(outEl, 'text', 'Result', '(no output — cell ran without calling show())');
    } else {
      for (const o of outputs){
        appendOutputRow(outEl, o && o.kind, o && o.label, o && o.value);
      }
    }
  } catch (err) {
    clearOutput(outEl);
    appendOutputError(outEl, (err && err.message) ? err.message : String(err));
    setNbStatus('error', 'A cell threw an error — see output.');
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = oldLabel;
  }
}

// Wire up cell buttons — and decorate cells with status badges
document.querySelectorAll('.cell').forEach(cell => {
  // Stash the original code so Reset can restore it
  const pre = cell.querySelector('.cell__code pre');
  cell.dataset.originalHtml = pre.innerHTML;

  cell.querySelectorAll('.cell__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      if (act === 'run') runCellWithStatus(cell);
      else if (act === 'reset'){
        pre.innerHTML = cell.dataset.originalHtml;
        const out = cell.querySelector('.cell__output');
        clearOutput(out);
        cell.classList.remove('is-ok','is-fail','is-running');
      }
    });
  });
});

/* ==================================================================
   STATUS-AWARE runCell wrapper + Killing-form mini visual on Cell 3
   (runCell already swallows its own errors and renders them inline,
    so we infer status from the rendered output rather than try/catch.)
================================================================== */
async function runCellWithStatus(cellEl){
  cellEl.classList.remove('is-ok','is-fail');
  cellEl.classList.add('is-running');
  await runCell(cellEl);
  cellEl.classList.remove('is-running');

  const out = cellEl.querySelector('.cell__output');
  const hasErr = out && Array.from(out.querySelectorAll('.out-label'))
    .some(el => el.textContent.trim() === 'Error');

  if (hasErr){
    cellEl.classList.add('is-fail');
  } else {
    cellEl.classList.add('is-ok');
    // Decorate Cell 3 with the colored mini-grid (the Killing form B)
    if (cellEl.dataset.cell === '3') addKillingFormMini(cellEl);
  }
}
function addKillingFormMini(cellEl){
  const out = cellEl.querySelector('.cell__output');
  if (!out || out.querySelector('.kf-mini')) return;

  const wrap = document.createElement('div');
  wrap.style.gridColumn = '1 / -1';
  wrap.innerHTML = `
    <div style="display:flex; gap:24px; align-items:flex-end; flex-wrap:wrap;">
      <div>
        <div class="kf-mini" aria-label="Killing form visualised">
          ${buildKfMiniCells()}
        </div>
        <div class="kf-mini__caption">Visual · J-block in navy, K-block carries 4κ</div>
      </div>
      <div style="font-family:var(--serif-display); font-style:italic; font-size:18px; line-height:1.4; color:var(--secondary); max-width:32ch;">
        Diagonal. Block-decomposed. Rotation block <span style="color:var(--primary)">−4 I₃</span>, boost block <span style="color:var(--accent)">4κ I₃</span>. The whole branch decision is now the sign of one number.
      </div>
    </div>
  `;
  const row = document.createElement('div');
  row.className = 'out-row';
  row.style.gridTemplateColumns = '1fr';
  row.appendChild(wrap);
  out.appendChild(row);
}
function buildKfMiniCells(){
  let html = '';
  for (let i = 0; i < 6; i++){
    for (let j = 0; j < 6; j++){
      let cls = 'kf-mini__cell';
      let txt = '0';
      if (i === j){
        if (i < 3){ cls += ' rot'; txt = '−4'; }
        else { cls += ' boost'; txt = '4κ'; }
      }
      html += `<div class="${cls}">${txt}</div>`;
    }
  }
  return html;
}

/* ==================================================================
   ENHANCEMENTS — micro-interactions & animation polish
================================================================== */

/* ---- Reading progress bar ---- */
(function(){
  const bar = document.getElementById('read-progress');
  if (!bar) return;
  function updateProgress(){
    const doc  = document.documentElement;
    const scrolled = doc.scrollTop || document.body.scrollTop;
    const total    = doc.scrollHeight - doc.clientHeight;
    const pct = total > 0 ? scrolled / total : 0;
    bar.style.transform = `scaleX(${pct})`;
  }
  window.addEventListener('scroll', updateProgress, { passive:true });
  updateProgress();
})();

/* ---- Active-section nav highlighting ---- */
(function(){
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  const sections = [];
  navLinks.forEach(a => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ el, a });
  });
  if (!sections.length) return;

  const OFFSET = 120;
  function updateActive(){
    const scrollY = window.scrollY;
    let current = sections[0];
    for (const s of sections){
      if (s.el.getBoundingClientRect().top + scrollY - OFFSET <= scrollY){
        current = s;
      }
    }
    navLinks.forEach(a => a.classList.remove('is-active'));
    if (current) current.a.classList.add('is-active');
  }
  window.addEventListener('scroll', updateActive, { passive:true });
  updateActive();
})();

/* ---- Button ripple effect ---- */
(function(){
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e){
      const rect   = btn.getBoundingClientRect();
      const size   = Math.max(rect.width, rect.height) * 1.8;
      const x      = e.clientX - rect.left - size / 2;
      const y      = e.clientY - rect.top  - size / 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple-wave';
      Object.assign(ripple.style, {
        width:  size + 'px',
        height: size + 'px',
        left:   x    + 'px',
        top:    y    + 'px',
        position:'absolute'
      });
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
})();

/* ---- Hero folio parallax ---- */
(function(){
  const folio = document.querySelector('.folio');
  if (!folio) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        folio.style.transform = `translateY(${sy * 0.18}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive:true });
})();

/* ---- Postulate border animate-in on scroll ---- */
(function(){
  const postulates = document.querySelectorAll('.postulate');
  if (!postulates.length) return;
  const pio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('kp-visible');
        pio.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  postulates.forEach(p => pio.observe(p));
})();

/* ---- Pullquote flanking lines + mark animate-in ---- */
(function(){
  const pqs = document.querySelectorAll('.pullquote');
  if (!pqs.length) return;
  const pqo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('pq-visible');
        pqo.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  pqs.forEach(p => pqo.observe(p));
})();

/* ---- Ornament line animate-in ---- */
(function(){
  const orns = document.querySelectorAll('.ornament');
  if (!orns.length) return;
  const oo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('orn-visible');
        oo.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  orns.forEach(o => oo.observe(o));
})();

/* ---- Verdict entrance (sliding sigil) ---- */
(function(){
  const verdicts = document.querySelectorAll('.verdict');
  if (!verdicts.length) return;
  const vo = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        vo.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  verdicts.forEach(v => vo.observe(v));
})();

/* ---- Aside border grow on reveal ---- */
(function(){
  const asides = document.querySelectorAll('.aside');
  if (!asides.length) return;
  const ao = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        ao.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  asides.forEach(a => ao.observe(a));
})();

/* ---- Section border reveal ---- */
(function(){
  const secs = document.querySelectorAll('section + section');
  if (!secs.length) return;
  const so = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        so.unobserve(e.target);
      }
    });
  }, { threshold: 0.05 });
  secs.forEach(s => so.observe(s));
})();

/* ---- Smooth lab number transitions ---- */
(function(){
  const labNums = document.querySelectorAll('#gammaVal, #tiltVal, #dilStat, #vVal, #vaNewton, #vaEinstein, #vaDiff');
  // Wrap original updateLorentz and updateVadd to flash numbers
  function flashEl(el){
    if (!el) return;
    el.classList.remove('lab-num-flash');
    void el.offsetWidth; // reflow
    el.classList.add('lab-num-flash');
    el.addEventListener('animationend', () => el.classList.remove('lab-num-flash'), { once:true });
  }

  const origUpdateLorentz = window.updateLorentz || null;

  // Observe value changes via MutationObserver and flash
  labNums.forEach(el => {
    if (!el) return;
    new MutationObserver(() => flashEl(el)).observe(el, { childList:true, characterData:true, subtree:true });
  });
})();

/* ---- Universe cards — perspective tilt on mouse move ---- */
(function(){
  document.querySelectorAll('.universe').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `translateY(-4px) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ==================================================================
   RUN-ALL button — execute all cells sequentially with progress
================================================================== */
(function wireRunAll(){
  const btn   = document.getElementById('runAllBtn');
  const bar   = document.getElementById('runAllBar');
  const stat  = document.getElementById('runAllStatus');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const cells = Array.from(document.querySelectorAll('.notebook .cell'));
    const total = cells.length;
    btn.disabled = true;
    btn.textContent = '◜ Running…';
    bar.style.width = '0%';
    bar.style.background = 'linear-gradient(90deg, var(--accent), var(--gold))';

    for (let i = 0; i < total; i++){
      const cell = cells[i];
      const num  = cell.dataset.cell || (i+1);
      stat.textContent = `Executing cell ${num} of ${total}…`;
      await runCellWithStatus(cell);
      bar.style.width = ((i+1)/total*100) + '%';
      if (cell.classList.contains('is-fail')){
        stat.textContent = `Cell ${num} threw an error — see its output.`;
        bar.style.background = 'linear-gradient(90deg, #a4453a, #C9A96E)';
        btn.disabled = false;
        btn.textContent = '▶ Re-run all 7 cells';
        return;
      }
    }

    stat.textContent = `All ${total} cells executed. The proof spine is live in your browser.`;
    btn.textContent = '✓ Re-run all 7 cells';
    btn.disabled = false;
  });
})();
