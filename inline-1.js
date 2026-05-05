// We do NOT load Pyodide eagerly — it's ~10MB. Instead, we lazy-load on first user interaction.
  window.__pyodideReady = null;
  window.__pyodideIndex = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/';
  window.loadPyodideLazily = function() {
    if (window.__pyodideReady) return window.__pyodideReady;
    window.__pyodideReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = window.__pyodideIndex + 'pyodide.js';
      s.onload = async () => {
        try {
          // Pass indexURL explicitly so Pyodide can locate its WASM and stdlib bundles.
          const py = await window.loadPyodide({ indexURL: window.__pyodideIndex });
          await py.loadPackage(['sympy']);
          // Set up the helper that captures structured output from cells.
          // The setup script is wrapped in a single multi-line string —
          // the trailing newline is required so Python parses it cleanly.
          py.runPython([
            'from sympy import latex, init_printing',
            'init_printing()',
            '',
            '_outputs = []',
            '',
            'def show(label, value, mode="auto"):',
            '    """Capture a labelled value for rendering. mode: tex | text | auto."""',
            '    if mode == "text":',
            '        _outputs.append({"kind":"text","label":str(label),"value":str(value)})',
            '        return',
            '    try:',
            '        s = latex(value)',
            '        _outputs.append({"kind":"tex","label":str(label),"value":s})',
            '    except Exception as e:',
            '        _outputs.append({"kind":"text","label":str(label),"value":str(value)})',
            '',
            'def reset_outputs():',
            '    global _outputs',
            '    _outputs = []',
            ''
          ].join('\n'));
          resolve(py);
        } catch (e) { reject(e); }
      };
      s.onerror = () => reject(new Error('Failed to load Pyodide. Check your network connection or content blockers.'));
      document.head.appendChild(s);
    });
    return window.__pyodideReady;
  };
