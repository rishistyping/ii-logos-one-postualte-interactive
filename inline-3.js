(function(){

/* ── 1. GRAIN — handled entirely by CSS (SVG feTurbulence + keyframes). No JS needed. ── */

/* ── 2. TEXT SCRAMBLE on section headings ── */
(function(){
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#∂∇κ∞⊕◎∈';
  const DURATION = 900; /* ms total scramble */
  const INTERVAL = 40;  /* ms between frame updates */

  function scramble(el) {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = '1';

    /* Store original HTML (may contain KaTeX / em tags) — work char by char on text nodes only */
    const original = el.innerHTML;

    /* Extract plain text chars + their positions */
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push({ node, text: node.nodeValue });
    }
    if (!textNodes.length) return;

    /* RAF loop — syncs with display refresh, no timer drift */
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / DURATION, 1);
      textNodes.forEach(({ node, text }) => {
        let out = '';
        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ' || text[i] === '\n') { out += text[i]; continue; }
          if (i / text.length < progress) {
            out += text[i];
          } else {
            out += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        node.nodeValue = out;
      });
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        el.innerHTML = original; /* restore KaTeX/em tags */
      }
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        scramble(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.s-head__title').forEach(el => io.observe(el));
})();

/* ── 3. SECTION WATERMARKS ── */
(function(){
  const labels = {
    'abstract'  : 'A',
    'postulate' : 'I',
    'determines': 'II',
    'killing'   : 'III',
    'verdicts'  : 'IV',
    'lab'       : 'V',
    'proof'     : 'VI',
    'references': 'VII',
  };
  document.querySelectorAll('.s-head').forEach(el => {
    const section = el.closest('section');
    if (!section) return;
    const key = section.id;
    const label = labels[key];
    if (!label) return;
    const wm = document.createElement('span');
    wm.className = 'section-wm';
    wm.textContent = label;
    wm.setAttribute('aria-hidden', 'true');
    el.appendChild(wm);
  });
})();

/* ── 4. GHOST HOVER TERM CARDS ── */
(function(){
  const GLOSSARY = {
    'κ':         { term: 'Kappa (κ)', def: 'The single free parameter that indexes all inertial-frame transformation families. Its sign determines spacetime geometry.' },
    'kappa':     { term: 'Kappa (κ)', def: 'The single free parameter governing the family of relativity transformations. κ>0 gives Lorentz, κ=0 Galilean, κ<0 hyperbolic.' },
    'spacetime': { term: 'Spacetime', def: 'The 4-dimensional continuum unifying space and time. Its Lorentzian signature emerges from symmetry alone when κ>0.' },
    'lorentz':   { term: 'Lorentz Transform', def: 'The κ>0 member of the transformation family. Encodes time dilation, length contraction, and the invariant speed c.' },
    'galilean':  { term: 'Galilean Transform', def: 'The κ=0 limit: velocities add linearly, time is absolute. Newton\'s framework.' },
    'killing':   { term: 'Killing Form', def: 'A bilinear form on a Lie algebra that classifies its structure. Negative-definite for compact (SO(n)), indefinite for Lorentz.' },
    'inertial':  { term: 'Inertial Frame', def: 'A reference frame in uniform motion — no acceleration. The relativity principle demands physics looks the same in all of them.' },
    'symmetry':  { term: 'Symmetry Principle', def: 'The requirement that physical laws have the same form in all inertial frames — the single postulate from which SR is derived.' },
  };

  /* Create ghost card element */
  const card = document.createElement('div');
  card.className = 'ghost-card';
  card.innerHTML = '<div class="ghost-card__term"></div><div class="ghost-card__def"></div>';
  document.body.appendChild(card);
  const termEl = card.querySelector('.ghost-card__term');
  const defEl  = card.querySelector('.ghost-card__def');

  let activeEl = null;
  let mx = 0, my = 0;
  let rafPending = false;
  /* Cache card dimensions — read once on first show, not on every mousemove */
  let cardW = 240, cardH = 80;

  /* Batch position writes via RAF — never read layout in mousemove handler */
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (card.classList.contains('is-visible') && !rafPending) {
      rafPending = true;
      requestAnimationFrame(() => { positionCard(); rafPending = false; });
    }
  }, { passive: true });

  function positionCard() {
    /* Use cached dims — no offsetWidth/offsetHeight read in hot path */
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = mx + 18, y = my - cardH / 2;
    if (x + cardW > vw - 12) x = mx - cardW - 18;
    if (y < 12) y = 12;
    if (y + cardH > vh - 12) y = vh - cardH - 12;
    /* Use transform — compositor thread, no layout */
    card.style.transform = `translate(${x}px,${y}px)`;
  }

  function showCard(entry) {
    termEl.textContent = entry.term;
    defEl.textContent  = entry.def;
    card.classList.add('is-visible');
    /* Read dims once after content is set (deferred to next frame) */
    requestAnimationFrame(() => {
      cardW = card.offsetWidth  || 240;
      cardH = card.offsetHeight || 80;
      positionCard();
    });
  }
  function hideCard() { card.classList.remove('is-visible'); }

  /* Tag matching text nodes */
  function wrapTerms(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      /* Skip scripts, styles, code, KaTeX, existing gterms */
      if (!parent || parent.closest('script,style,.katex,.gterm,nav,code,pre')) continue;
      targets.push(node);
    }
    targets.forEach(textNode => {
      const text = textNode.nodeValue;
      const keys = Object.keys(GLOSSARY);
      const pattern = new RegExp('\\b(' + keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')\\b', 'gi');
      if (!pattern.test(text)) return;
      pattern.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let last = 0, match;
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) frag.appendChild(document.createTextNode(text.slice(last, match.index)));
        const span = document.createElement('span');
        span.className = 'gterm';
        span.textContent = match[0];
        span.dataset.gkey = match[0].toLowerCase();
        frag.appendChild(span);
        last = pattern.lastIndex;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  /* Only wrap prose sections (not interactive lab) */
  document.querySelectorAll('.prose, .abstract__body, .verdict__body, .s-head__sub').forEach(wrapTerms);

  /* Event delegation */
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('.gterm');
    if (!t) return;
    const entry = GLOSSARY[t.dataset.gkey];
    if (!entry) return;
    activeEl = t;
    showCard(entry);
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('.gterm');
    if (t && t === activeEl) { activeEl = null; hideCard(); }
  });
})();

})(); /* end outer IIFE */
