// FOUC prevention: sync theme before first paint
// Extracted from inline <script> for CSP compliance (no unsafe-inline for scripts)
(function() {
  // Read from Zustand settings store (panda-desk:settings JSON blob)
  var theme = 'system';
  try {
    var raw = localStorage.getItem('panda-desk:settings');
    if (raw) { theme = JSON.parse(raw).theme || 'system'; }
  } catch(e) {}
  // Fallback: legacy pd-theme key
  if (theme === 'system') {
    var legacy = localStorage.getItem('pd-theme');
    if (legacy && legacy !== 'system') theme = legacy;
  }
  var resolved = theme;
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-pd-theme', resolved);
  // Matrix variant
  var variant = localStorage.getItem('pd-variant') || '';
  if (variant) document.documentElement.setAttribute('data-pd-variant', variant);
})();
