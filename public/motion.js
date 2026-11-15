/* Motion for BridgeAI: springy, liquid-feeling animation in the style of Apple's glass interface.
   Everything here is decoration. If the viewer asks for reduced motion, none of it runs. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const off = () => RM.matches;
  // Lite mode (low-cost phones): keep only motion the phone can draw without re-measuring or blurring anything.
  const lite = () => document.documentElement.classList.contains('lite');
  // A spring with a little bounce. Browsers without linear() get a close curve instead.
  const SPRING = CSS.supports('transition-timing-function', 'linear(0, 1)')
    ? 'linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, 0.991, 0.977 51%, 0.974 53.8%, 0.975 57.1%, 0.997 69.8%, 1.003 76.9%, 1.004 83.8%, 1)'
    : 'cubic-bezier(0.2, 1.3, 0.3, 1)';
  const GLIDE = 'cubic-bezier(0.2, 0.9, 0.25, 1)';
  document.documentElement.style.setProperty('--spring', SPRING);
  const play = (el, frames, opts) => { try { return el.animate(frames, opts); } catch { return null; } };

  // ----- press: the surface dips, and a soft highlight spreads from the finger like a drop in liquid -----
  const SURFACE = '.btn,.navb,.hbtn,.tile,.row,.persona,.chipb,.cta,.storycard,.rb,.tick,.xb,.seg button,.card[data-act],.sugg button,.pill[data-act],.link';
  document.addEventListener('pointerdown', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a || a.disabled || off()) return;
    let el = a.closest(SURFACE) || a;
    if (el.classList.contains('row') && el.parentElement.classList.contains('rowbox')) el = el.parentElement;
    pressed = { find: finder(a), at: performance.now() };
    el.classList.add('is-pressed');
    const up = () => { el.classList.remove('is-pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
    addEventListener('pointerup', up);
    addEventListener('pointercancel', up);
    if (lite()) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.3;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('lq-host');
    const drop = document.createElement('span');
    drop.className = 'lq';
    drop.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.append(drop);
    const anim = play(drop, [{ transform: 'scale(0.12)', opacity: 0.95 }, { transform: 'scale(1)', opacity: 0 }], { duration: 720, easing: GLIDE });
    if (anim) anim.onfinish = () => drop.remove(); else drop.remove();
  }, { passive: true });

  // Most taps redraw the screen, which replaces the pressed element. These helpers find its replacement so the
  // press can finish its spring-back there, the way a real button would.
  let pressed = null;
  const finder = (a) => `[data-act="${a.dataset.act}"]` + ['id', 'tab', 'role', 'lang', 'd'].filter((k) => a.dataset[k] !== undefined).map((k) => `[data-${k}="${CSS.escape(a.dataset[k])}"]`).join('');
  function release() {
    if (!pressed || off() || lite() || performance.now() - pressed.at > 900) { pressed = null; return; }
    const a = document.querySelector('#app ' + pressed.find);
    pressed = null;
    if (!a) return;
    let el = a.closest(SURFACE) || a;
    if (el.classList.contains('row') && el.parentElement.classList.contains('rowbox')) el = el.parentElement;
    if (el.classList.contains('navb') || el.closest('.seg')) return; // these already flow with their lozenge
    play(el, [{ transform: `scale(${/row|card|cta|persona/.test(el.className) ? 0.97 : 0.94})` }, { transform: 'none' }], { duration: 640, easing: SPRING });
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const glow = document.createElement('span');
    glow.className = 'lq glow';
    el.classList.add('lq-host');
    el.append(glow);
    const g = play(glow, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' });
    if (g) g.onfinish = () => glow.remove(); else glow.remove();
  }

  // ----- when a redraw changes sizes, boxes grow or shrink smoothly and their neighbours glide along -----
  const BLOCKS = '#app .in > *, #app .tiles, #app .banner';
  const keyOf = (el, i) => el.dataset.k || `${el.className.split(' ')[0]}:${i}`;
  function before() {
    if (off() || lite()) return null;
    const snap = {};
    document.querySelectorAll(BLOCKS).forEach((el, i) => { const r = el.getBoundingClientRect(); snap[keyOf(el, i)] = { top: r.top, h: r.height }; });
    return snap;
  }
  function after(snap) {
    if (off() || !snap) return;
    const els = [...document.querySelectorAll(BLOCKS)];
    // first the boxes whose height changed: they animate their real height, so everything below follows naturally
    els.forEach((el, i) => {
      const was = snap[keyOf(el, i)], h = el.getBoundingClientRect().height;
      if (!was || Math.abs(was.h - h) < 2) return;
      el.style.overflow = 'hidden';
      const a = play(el, [{ height: was.h + 'px' }, { height: h + 'px' }], { duration: 560, easing: 'cubic-bezier(0.25, 1.18, 0.35, 1)' });
      const done = () => (el.style.overflow = '');
      if (a) a.onfinish = a.oncancel = done; else done();
    });
    // then anything that still ended up somewhere new glides there
    els.forEach((el, i) => {
      const was = snap[keyOf(el, i)];
      if (!was) return;
      const dy = was.top - el.getBoundingClientRect().top;
      if (Math.abs(dy) > 2 && Math.abs(dy) < 700) play(el, [{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 620, easing: SPRING, composite: 'add' });
    });
  }

  // ----- the selected lozenge in the tab bar and in segmented controls flows to its new place -----
  let lastSpots = {};
  function lozenges(scope) {
    const spots = {};
    document.querySelectorAll('#app .nav, #app .seg').forEach((group, i) => {
      const on = group.querySelector(':scope > .on');
      if (!on) return;
      const id = group.classList.contains('nav') ? 'nav' : `${scope}#${i}`;
      const spot = { x: on.offsetLeft, y: on.offsetTop, w: on.offsetWidth, h: on.offsetHeight };
      const ind = document.createElement('i');
      ind.className = 'ind';
      Object.assign(ind.style, { left: spot.x + 'px', top: spot.y + 'px', width: spot.w + 'px', height: spot.h + 'px' });
      group.prepend(ind);
      group.classList.add('has-ind');
      const was = lastSpots[id];
      if (was && was.x !== spot.x && !off()) {
        const dx = was.x - spot.x, sx = was.w / spot.w;
        play(ind, [
          { transform: `translateX(${dx}px) scale(${sx}, 1)` },
          { transform: `translateX(${dx * 0.42}px) scale(${Math.max(sx, 1) * 1.28}, 0.86)`, offset: 0.34 },
          { transform: 'none' },
        ], { duration: 620, easing: SPRING });
        play(on, [{ transform: 'scale(0.86)' }, { transform: 'none' }], { duration: 620, easing: SPRING });
      }
      spots[id] = spot;
    });
    lastSpots = spots;
  }

  // ----- screens arrive the way they do on an iPhone -----
  const ARRIVE = {
    push: [{ transform: 'translateX(34%)', opacity: 0, filter: 'blur(8px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
    pop: [{ transform: 'translateX(-26%)', opacity: 0, filter: 'blur(8px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
    tab: [{ transform: 'scale(0.955)', opacity: 0, filter: 'blur(12px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
    role: [{ transform: 'scale(1.12)', opacity: 0, filter: 'blur(20px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }],
  };
  function arrive(kind) {
    const screen = document.querySelector('#app > :first-child');
    if (!screen || off() || !ARRIVE[kind]) return;
    if (lite()) { play(screen, [{ opacity: 0, transform: kind === 'push' ? 'translateX(24px)' : kind === 'pop' ? 'translateX(-24px)' : 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' }); return; }
    play(screen, ARRIVE[kind], { duration: kind === 'role' ? 640 : 480, easing: GLIDE });
    if (kind === 'push' || kind === 'pop') return;
    const parts = screen.querySelectorAll('.greet, .tiles > *, .banner, .in > *, .reader > *, .hello > *, .chips > *, .ask, .duo2 > *, .big, .tagline, .sheet0');
    [...parts].slice(0, 16).forEach((el, i) => play(el, [{ transform: 'translateY(22px) scale(0.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 760, delay: 40 + i * 34, easing: SPRING, fill: 'backwards' }));
    const nav = document.querySelector('#app .nav');
    if (nav && kind === 'role') play(nav, [{ transform: 'translateY(90px) scale(0.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 800, delay: 180, easing: SPRING, fill: 'backwards' });
  }

  // ----- small moments -----
  function tick(id) {
    const el = document.querySelector(`#app .tick.on[data-id="${CSS.escape(id)}"]`);
    if (!el) return false;
    if (off()) return true;
    play(el, [{ transform: 'scale(0.5)' }, { transform: 'scale(1.28)', offset: 0.4 }, { transform: 'none' }], { duration: 560, easing: GLIDE });
    const mark = el.querySelector('svg');
    if (mark) play(mark, [{ transform: 'scale(0) rotate(-40deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 60, easing: SPRING, fill: 'backwards' });
    const ring = document.createElement('span');
    ring.className = 'burst';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.append(ring);
    const a = play(ring, [{ transform: 'scale(0.6)', opacity: 0.9 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 700, easing: GLIDE });
    if (a) a.onfinish = () => ring.remove(); else ring.remove();
    const row = el.closest('.rowbox');
    document.querySelectorAll('#app .banner .segbar i.on').forEach((s, i, all) => i === all.length - 1 && play(s, [{ transform: 'scaleX(0.2)', opacity: 0.3 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: SPRING }));
    return true;
  }
  function unfold(id) {
    const row = document.querySelector(`#app [data-act="open"][data-id="${CSS.escape(id)}"]`)?.closest('.rowbox');
    if (!row || off() || lite()) return;
    row.querySelectorAll('.steps > li, .stepfoot').forEach((el, i) => play(el, [{ transform: 'translateY(-10px) scale(0.97)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 620, delay: i * 45, easing: SPRING, fill: 'backwards' }));
  }
  function turnPage(dir) {
    if (off()) return;
    if (lite()) { const pic = document.querySelector('#app .reader .pic'); if (pic) play(pic, [{ transform: `translateX(${dir * 30}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' }); return; }
    const pic = document.querySelector('#app .reader .pic'), words = document.querySelector('#app .reader .words');
    if (pic) play(pic, [{ transform: `translateX(${dir * 70}px) scale(0.9) rotate(${dir * 3}deg)`, opacity: 0, filter: 'blur(10px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 640, easing: SPRING });
    if (words) play(words, [{ transform: 'translateY(14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 90, easing: GLIDE, fill: 'backwards' });
  }

  window.Motion = { lozenges, arrive, tick, unfold, turnPage, before, after, release, off };
})();
