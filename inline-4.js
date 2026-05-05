(function(){
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.getElementById('cursor-dot');
  if (!dot) return;

  let mx = -300, my = -300;  /* raw mouse */
  let cx = -300, cy = -300;  /* current dot position (lerp) */
  let curState = '';

  const LERP = 0.72;

  /* [selector, state] — first match wins */
  const STATES = [
    ['.btn--gold',                                         'gold'  ],
    ['.btn, .nb-runall__btn, .cell__btn',                  'btn'   ],
    ['.kappa-dial button',                                 'kappa' ],
    ['input[type="range"], .vadd__slider, .l-slider',      'grab'  ],
    ['.k-stage, .minkowski, .universe__diagram, .kgrid',   'lab'   ],
    ['.universe, a[href]',                                 'link'  ],
    ['.prose p, .abstract__body, .verdict__body, .s-head__sub, .hero__lede, .pullquote__text', 'text'],
  ];

  const ALL = ['s-link','s-btn','s-gold','s-text','s-grab','s-lab','s-kappa','s-down'];

  function detectState(el) {
    for (const [sel, st] of STATES) {
      try { if (el.closest(sel)) return st; } catch(_){}
    }
    return '';
  }

  function applyState(st) {
    if (st === curState) return;
    curState = st;
    dot.classList.remove(...ALL);
    if (st) dot.classList.add('s-' + st);
  }

  /* RAF loop — lerp position */
  function tick() {
    requestAnimationFrame(tick);
    cx += (mx - cx) * LERP;
    cy += (my - cy) * LERP;
    dot.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
  }
  requestAnimationFrame(tick);

  /* Mouse move */
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (dot.classList.contains('cur-hidden')) {
      dot.classList.remove('cur-hidden');
    }
    applyState(detectState(e.target));
  }, { passive: true });

  /* Leave / enter window */
  document.addEventListener('mouseleave', () => dot.classList.add('cur-hidden'));
  document.addEventListener('mouseenter', () => dot.classList.remove('cur-hidden'));

  /* Press feedback */
  document.addEventListener('mousedown', () => dot.classList.add('s-down'));
  document.addEventListener('mouseup',   () => {
    dot.classList.remove('s-down');
    applyState(curState);
  });

  /* Reveal on first move */
  dot.style.opacity = '0';
  document.addEventListener('mousemove', () => { dot.style.opacity = ''; }, { once: true });
})();
