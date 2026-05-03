# Extracted source for web-polish-studio

Source URL: [https://web-polish-studio--rishresearch000.replit.app](https://rishistyping.github.io/ii-logos-one-postualte-interactive/)

This folder contains the public browser source that the deployed site exposes.

- `index.html` is the full downloaded HTML response.
- `one_postulate_enhanced.html` is the decompressed source from `/Users/rish/Downloads/one_postulate_enhanced.html-2.gz`.
- `web-polish-studio-single.html` is a direct single-file copy of `one_postulate_enhanced.html`.
- `web-polish-studio-self-contained.html` inlines the linked CSS/JS CDN tags from `one_postulate_enhanced.html` into the HTML where practical.
- `headers.txt` contains the HTTP response headers from the fetch.
- `inline-1.css`, `inline-2.css`, and `inline-3.css` are the three inline `<style>` blocks split out from `index.html`.
- `inline-1.js` through `inline-6.js` are the six inline `<script>` blocks split out from `index.html`.
- `external-assets.txt` lists external linked assets and CDN scripts/styles.

Notes:

- No first-party external JavaScript or CSS bundles were linked by the page.
- The page references Google Fonts, KaTeX, and Pyodide from CDNs.
- The self-contained variant removes linked `<script src>` and `<link href>` tags, but font files referenced inside Google Fonts CSS and Pyodide's dynamic WASM/package downloads still require network access.
- This extraction cannot include private server-side Replit files unless those files are publicly served by the deployed app.
