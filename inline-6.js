(function () {
  var opts = {
    delimiters: [
      { left: '$$', right: '$$', display: true  },
      { left: '\\[', right: '\\]', display: true  },
      { left: '\\(', right: '\\)', display: false },
      { left: '$',  right: '$',  display: false }
    ],
    throwOnError: false,
    strict: false
  };
  window._katexOpts = opts;

  function renderAll() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, opts);
    }
  }

  /* DOMContentLoaded fires after all defer scripts execute,
     so KaTeX + auto-render are both guaranteed to be ready. */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  } else {
    renderAll();
  }

  /* Belt-and-suspenders: re-run on window load in case
     content-visibility:auto sections weren't reachable earlier. */
  window.addEventListener('load', renderAll);
})();
