// Lite mode: on low-cost phones the glass blur and the liquid motion are swapped for cheap look-alikes,
// so the app stays quick. It is chosen automatically, and can be forced in Settings or with ?lite=1 / ?lite=0.
(() => {
  const root = document.documentElement, KEY = 'bridgeai:lite';
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const write = (v) => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch {} };
  const q = new URLSearchParams(location.search);
  if (q.has('lite')) write(q.get('lite') === '0' ? 'off' : 'on');

  const c = navigator.connection || {};
  const phone = matchMedia('(pointer: coarse)').matches;
  const noBlur = !(window.CSS && (CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)')));
  // little memory, few processor cores, data saver switched on, a very slow network, or a browser with no blur at all
  const weak = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (phone && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    || c.saveData === true || /(^|-)2g$/.test(c.effectiveType || '') || noBlur;

  const apply = (on) => { root.classList.toggle('lite', on); Perf.lite = on; };
  const Perf = (window.Perf = {
    lite: false,
    auto: !!weak,
    set(on) { write(on ? 'on' : 'off'); apply(on); },
  });
  const saved = read();
  apply(saved ? saved === 'on' : Perf.auto);

  // Last check: if the full look cannot hold about 30 pictures a second on this device, switch by itself.
  if (!saved && !Perf.lite) addEventListener('load', () => setTimeout(() => {
    if (document.hidden) return;
    const gaps = []; let last = 0;
    const step = (now) => {
      if (document.hidden) return;
      if (last) gaps.push(now - last);
      last = now;
      if (gaps.length < 40) return requestAnimationFrame(step);
      gaps.sort((a, b) => a - b);
      if (gaps[20] > 34 && !read()) { apply(true); Perf.auto = true; }
    };
    requestAnimationFrame(step);
  }, 900));
})();
