/* ================================================================
   UX LAYER — hamburger, back-to-top, citation tooltips, keyboard nav
   ================================================================ */

/* ---- Mobile hamburger nav ---- */
(function(){
  const hamburger = document.getElementById('nav-hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const closeBtn  = document.getElementById('mobile-nav-close');
  if (!hamburger || !mobileNav) return;

  function openNav(){
    hamburger.setAttribute('aria-expanded','true');
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeBtn && closeBtn.focus(), 50);
  }
  function closeNav(){
    hamburger.setAttribute('aria-expanded','false');
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () =>
    mobileNav.classList.contains('is-open') ? closeNav() : openNav()
  );
  closeBtn && closeBtn.addEventListener('click', closeNav);

  /* Close when any link is clicked */
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));

  /* Escape to close */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) closeNav();
  });

  /* Basic focus trap */
  mobileNav.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(mobileNav.querySelectorAll('a[href], button:not([disabled])'));
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first){
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last){
      e.preventDefault(); first.focus();
    }
  });
})();

/* ---- Back-to-top button ---- */
(function(){
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  let vis = false;
  window.addEventListener('scroll', () => {
    const should = window.scrollY > window.innerHeight * 0.4;
    if (should !== vis){
      vis = should;
      btn.classList.toggle('is-visible', vis);
    }
  }, { passive:true });
  btn.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
})();

/* ---- Citation tooltips ---- */
(function(){
  const tooltip = document.createElement('div');
  tooltip.className = 'cite-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  document.body.appendChild(tooltip);

  let hideTimer = null;

  document.querySelectorAll('sup.cite').forEach(sup => {
    sup.style.cursor = 'help';

    sup.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      const links = sup.querySelectorAll('a[href^="#ref-"]');
      if (!links.length) return;

      let html = '';
      links.forEach(link => {
        const refId = link.getAttribute('href').slice(1);
        const refEl = document.getElementById(refId);
        if (!refEl) return;

        const numEl = refEl.querySelector('.num');
        const num   = numEl ? numEl.textContent.trim() : '';

        /* Clone and strip the number span so tooltip text is clean */
        const clone = refEl.cloneNode(true);
        clone.querySelector('.num')?.remove();

        html += `<div class="cite-tooltip__item">
          <span class="cite-tooltip__num">Ref ${num}</span>
          <div class="cite-tooltip__text">${clone.innerHTML.trim()}</div>
        </div>`;
      });
      if (!html) return;

      tooltip.innerHTML = html;
      tooltip.classList.remove('below');

      /* Position */
      tooltip.style.opacity = '0';
      tooltip.classList.add('is-visible');

      requestAnimationFrame(() => {
        const rect = sup.getBoundingClientRect();
        const tw   = tooltip.offsetWidth  || 280;
        const th   = tooltip.offsetHeight || 80;
        let left   = rect.left + window.scrollX + rect.width / 2 - tw / 2;
        let top    = rect.top  + window.scrollY - th - 12;

        /* If tooltip would go above viewport, flip below */
        if (rect.top - th - 12 < 8){
          top = rect.bottom + window.scrollY + 8;
          tooltip.classList.add('below');
        }

        /* Clamp within horizontal viewport */
        left = Math.max(12, Math.min(left, window.innerWidth + window.scrollX - tw - 12));

        tooltip.style.left = left + 'px';
        tooltip.style.top  = top  + 'px';
        tooltip.style.opacity = '';
      });
    });

    sup.addEventListener('mouseleave', () => {
      hideTimer = setTimeout(() => tooltip.classList.remove('is-visible'), 140);
    });
  });

  /* Keep tooltip open when hovering it */
  tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => tooltip.classList.remove('is-visible'), 140);
  });
})();

/* ---- Keyboard navigation — j / k to move between sections ---- */
(function(){
  const IDS = ['abstract','postulate','determines','killing','verdicts','lab','proof','references'];
  const sections = IDS.map(id => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  const toast = document.getElementById('kbd-toast');

  function showToast(msg){
    if (!toast) return;
    clearTimeout(showToast._t);
    toast.textContent = msg;
    toast.classList.add('is-visible');
    showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  function currentIdx(){
    /* The section whose top is closest to (but above) the viewport midpoint */
    let idx = 0;
    for (let i = 0; i < sections.length; i++){
      if (sections[i].getBoundingClientRect().top < window.innerHeight * 0.4) idx = i;
    }
    return idx;
  }

  function labelOf(sec){
    const hid = sec.getAttribute('aria-labelledby');
    if (hid){
      const h = document.getElementById(hid);
      if (h) return h.textContent.trim().replace(/\s+/g,' ').slice(0, 48);
    }
    return sec.id;
  }

  document.addEventListener('keydown', e => {
    /* Don't fire when user is typing */
    const active = document.activeElement;
    const tag = active ? active.tagName.toLowerCase() : '';
    if (['input','textarea','select'].includes(tag)) return;
    if (active && active.isContentEditable) return;
    /* Don't fire if any modifier except shift is held */
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'j'){
      const next = sections[Math.min(currentIdx() + 1, sections.length - 1)];
      next.scrollIntoView({ behavior:'smooth', block:'start' });
      showToast('▼  ' + labelOf(next));
    } else if (e.key === 'k'){
      const prev = sections[Math.max(currentIdx() - 1, 0)];
      prev.scrollIntoView({ behavior:'smooth', block:'start' });
      showToast('▲  ' + labelOf(prev));
    }
  });
})();

/* ---- Table overflow indicator (show fade-right when scrollable) ---- */
(function(){
  const wrap = document.querySelector('.compare-wrap');
  if (!wrap) return;
  function update(){
    const canScroll = wrap.scrollWidth > wrap.clientWidth + 2;
    const atEnd     = wrap.scrollLeft >= wrap.scrollWidth - wrap.clientWidth - 2;
    wrap.classList.toggle('has-overflow', canScroll && !atEnd);
  }
  wrap.addEventListener('scroll', update, { passive:true });
  window.addEventListener('resize', update, { passive:true });
  update();
})();
