/* Social icon row in every footer: one list, one look, day and night. */
(function () {
  var S = [
    ['YouTube', 'https://www.youtube.com/@GoldTriEngine', '<path fill="currentColor" stroke="none" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.500 0-9.400.5A3 3 0 0 0 .5 6.200C0 8.100 0 12 0 12s0 3.900.5 5.800a3 3 0 0 0 2.100 2.100c1.900.5 9.400.5 9.400.5s7.500 0 9.400-.5a3 3 0 0 0 2.100-2.100C24 15.900 24 12 24 12s0-3.900-.5-5.800zM9.600 15.600V8.400l6.200 3.600z"/>'],
    ['TikTok', 'https://www.tiktok.com/@goldtriengine', '<path d="M14 3v11.5a3.500 3.500 0 1 1-3.500-3.500"/><path d="M14 3c.4 2.600 2.100 4.300 5 4.500"/>'],
    ['Instagram', 'https://www.instagram.com/goldtriengine', '<rect x="3.500" y="3.500" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.200" cy="6.800" r="1" fill="currentColor" stroke="none"/>'],
    ['Facebook', 'https://www.facebook.com/1511619445357751', '<path d="M17.500 3.500h-2.800A4.200 4.200 0 0 0 10.500 7.700v2.600H7.500v4h3v6.200h4v-6.200h3l.8-4h-3.800V8a1 1 0 0 1 1-1h2z"/>'],
    ['Telegram', 'https://t.me/+l7QyD_fRy25mNWJl', '<path d="M21 4 3 11l5.500 2L10 19l3.200-3.600L18 19z"/><path d="M8.500 13 21 4"/>'],
    ['Myfxbook', 'https://www.myfxbook.com/portfolio/goldtriengine/12235544', '<path d="M3 17l5-6 4 3 8-9"/><path d="M14 5h6v6"/>']
  ];
  function build() {
    var foot = document.querySelector('footer .foot');
    if (!foot || foot.querySelector('.soc')) return;
    var d = document.createElement('div'); d.className = 'soc'; d.setAttribute('aria-label', 'GoldTriEngine on social media');
    d.innerHTML = S.map(function (x) {
      return '<a href="' + x[1] + '" target="_blank" rel="noopener me" aria-label="' + x[0] + '" title="' + x[0] + '"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + x[2] + '</svg></a>';
    }).join('');
    foot.appendChild(d);
    if (document.getElementById('soc-css')) return;
    var s = document.createElement('style'); s.id = 'soc-css';
    s.textContent = '.soc{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px;padding-top:4px}.soc a{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;border:1px solid color-mix(in srgb,currentColor 20%,transparent);color:inherit;opacity:.82;transition:transform .2s,opacity .2s,border-color .2s,background .2s}.soc a:hover,.soc a:focus-visible{opacity:1;transform:translateY(-2px);border-color:color-mix(in srgb,currentColor 55%,transparent);background:color-mix(in srgb,currentColor 8%,transparent)}.soc svg{display:block}';
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
