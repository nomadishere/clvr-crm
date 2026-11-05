/* CLVR site: reveals, counters, measure demo, proposal timeline, Clover chat demo, sticky CTA, signup form */
(function () {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm) document.documentElement.classList.add('calm');
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const track = (name, data) => { try { (window.dataLayer = window.dataLayer || []).push({ event: name, ...data }); } catch (e) {} };

  // Already signed in on this device? Say "Open CRM" instead of "Log in".
  try { if (localStorage.getItem('jcrm_session')) $$('a[href="/login/"]').forEach(a => { if (a.textContent.trim() === 'Log in') a.textContent = 'Open CRM'; }); } catch (e) {}

  // nav goes solid after the hero starts scrolling
  const nav = $('#nav'), mbar = $('#mbar'), start = $('#start');
  let startVisible = false;
  const onScroll = () => {
    nav.classList.toggle('solid', scrollY > 20);
    mbar.classList.toggle('on', scrollY > innerHeight * .7 && !startVisible);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(es => { startVisible = es[0].isIntersecting; onScroll(); }, { threshold: .15 }).observe(start);

  // count-up helper
  const countUp = (el, to, fmt, dur = 1400) => {
    if (calm) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  const fmts = { int: v => Math.round(v).toLocaleString('en-US'), 1: v => v.toFixed(1) };

  // reveal on scroll + one-shot triggers
  const once = new Map();
  once.set('race', () => $$('#race .bar i').forEach(i => i.style.width = i.dataset.w + '%'));
  once.set('roofbox', () => {
    const box = $('#roofbox'); box.classList.add('on');
    const edges = $$('#roofbox .edge');
    edges.forEach((p, i) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = calm ? 0 : L;
      if (!calm) { p.style.transition = `stroke-dashoffset 1.1s cubic-bezier(.4,.1,.2,1) ${.5 + i * .28}s`; requestAnimationFrame(() => requestAnimationFrame(() => p.style.strokeDashoffset = 0)); } });
    setTimeout(() => $$('#roofbox [data-to]').forEach(b => countUp(b, +b.dataset.to, fmts[b.dataset.fmt] || fmts.int, 1600)), calm ? 0 : 1600);
    track('measure_demo_viewed');
  });
  once.set('tl', () => { const i = $('#tl'); i.style.transition = calm ? 'none' : 'width 3.2s cubic-bezier(.3,.6,.2,1)'; i.style.width = '72%'; });
  once.set('chat', () => runChat());

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; el.classList.add('in'); io.unobserve(el);
    if (el.dataset.count) countUp(el, +el.dataset.count, fmts.int, 1200);
    const fn = once.get(el.id); if (fn) { once.delete(el.id); fn(); }
    if (el.id === 'roofbox') {}
  }), { threshold: .25, rootMargin: '0px 0px -8% 0px' });
  $$('.rv, [data-count], #race, #roofbox, #tl, #chat').forEach(el => io.observe(el));

  // sections reached (for analytics)
  const seen = new Set();
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !seen.has(e.target.id)) { seen.add(e.target.id); track('section_view', { section: e.target.id }); } }), { threshold: .4 });
  $$('main section[id]').forEach(s => sio.observe(s));
  $$('[data-cta]').forEach(a => a.addEventListener('click', () => track('cta_click', { where: a.dataset.cta })));
  $$('a[href="/login/"]').forEach(a => a.addEventListener('click', () => track('login_click')));

  // live countdown on the hero chip + the yellow demo orb
  const heroClock = $('#heroClock'), orbY = $('#orbY'), orbYt = $('#orbYt');
  let left = 59 * 60 + 59, yLeft = 18 * 60 + 40;
  const pad = n => String(n).padStart(2, '0');
  setInterval(() => {
    left = left > 0 ? left - 1 : 3599; heroClock.textContent = pad(Math.floor(left / 60)) + ':' + pad(left % 60);
    yLeft = yLeft > 0 ? yLeft - 1 : 1800;
    if (orbY) { orbY.style.strokeDashoffset = 283 * (yLeft / 3600) + 40; orbYt.firstChild.nodeValue = pad(Math.floor(yLeft / 60)) + ':' + pad(yLeft % 60); }
  }, 1000);

  // Clover chat demo (scripted; the real Clover answers live inside the app)
  const SCRIPT = [
    ['me', 'What should I do first today?'],
    ['ai', 'The Kessler proposal is 12 minutes late. Send it now: the Better option at $18,940 is the one they asked about. Then call Whitfield back before 2.'],
    ['me', 'She said "I need to think about it."'],
    ['ai', 'Ask what part she wants to think over: the price, the timing or the roofer. Then solve that one thing. Offer to hold today\'s price through Friday.']
  ];
  function runChat() {
    const box = $('#msgs');
    if (calm) { SCRIPT.forEach(([w, t]) => { const m = document.createElement('div'); m.className = 'msg show ' + w; m.textContent = t; box.appendChild(m); }); return; }
    let i = 0;
    const next = () => {
      if (i >= SCRIPT.length) return;
      const [who, text] = SCRIPT[i++];
      const m = document.createElement('div'); m.className = 'msg ' + who;
      if (who === 'ai') { m.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>'; box.appendChild(m); requestAnimationFrame(() => m.classList.add('show'));
        setTimeout(() => { m.textContent = text; setTimeout(next, 1500); }, 1300);
      } else { m.textContent = text; box.appendChild(m); requestAnimationFrame(() => m.classList.add('show')); setTimeout(next, 800); }
    };
    next();
  }

  // signup form → Supabase (insert-only function, no keys beyond the public one)
  const SB = 'https://wwqjoagdnclaylllzcut.supabase.co', KEY = 'sb_publishable_AVIpI00DFiYwugP16-wMWQ_qENLObrc';
  const form = $('#signup'), msg = $('#fmsg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    msg.className = 'fmsg';
    if (!d.name.trim()) { msg.className = 'fmsg err'; msg.textContent = 'Please add your name.'; $('#fn').focus(); return; }
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim()) && d.phone.replace(/\D/g, '').length < 10) { msg.className = 'fmsg err'; msg.textContent = 'Add an email or a mobile number so we can reach you.'; $('#fe').focus(); return; }
    const btn = form.querySelector('button'); btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await fetch(SB + '/rest/v1/rpc/clvr_signup', { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p: { ...d, source: 'clvrcrm.com', page: location.href, ua: navigator.userAgent } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.ok === false) throw new Error(j.error || j.message || 'error');
      form.querySelectorAll('input,select,textarea').forEach(x => x.disabled = true);
      btn.textContent = "You're in ✓"; msg.className = 'fmsg ok'; msg.textContent = "Thanks! We'll reach out within one business day to set up your demo.";
      track('signup', { crew: d.crew_size, crm: d.current_crm });
    } catch (err) {
      btn.disabled = false; btn.textContent = 'Get early access';
      msg.className = 'fmsg err'; msg.textContent = "That didn't send. Check your connection and try again.";
    }
  });
})();

// ===== 5-benefit reel =====
(() => {
  const reel = document.getElementById('reel'); if (!reel) return;
  const slides = [...reel.querySelectorAll('.slide')], segs = [...reel.querySelectorAll('.segs button')];
  const n = document.getElementById('reelN'), pp = document.getElementById('reelPP');
  let cur = 0, userPaused = false, hover = false;
  const go = i => {
    i = (i + slides.length) % slides.length; if (i === cur && segs[i].classList.contains('run')) return;
    slides[cur].classList.remove('on'); slides[cur].classList.add('out');
    const prev = slides[cur]; setTimeout(() => prev.classList.remove('out'), 650);
    cur = i; slides[cur].classList.add('on'); n.textContent = cur + 1;
    segs.forEach((b, k) => { b.classList.toggle('done', k < cur); b.classList.remove('run'); b.removeAttribute('aria-current'); });
    void segs[cur].offsetWidth; segs[cur].classList.add('run'); segs[cur].setAttribute('aria-current', 'true');
  };
  segs.forEach((b, k) => {
    b.querySelector('i').addEventListener('animationend', () => go(cur + 1));
    b.addEventListener('click', () => go(k));
  });
  const sync = () => reel.classList.toggle('paused', userPaused || hover);
  pp.addEventListener('click', () => { userPaused = !userPaused; pp.setAttribute('aria-label', userPaused ? 'Play' : 'Pause'); sync(); });
  if (matchMedia('(hover:hover)').matches) {
    reel.addEventListener('mouseenter', () => { hover = true; sync(); });
    reel.addEventListener('mouseleave', () => { hover = false; sync(); });
  }
  // pause when the hero is off screen or the tab is hidden
  let vis = true;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; reel.classList.toggle('offscreen', !vis); }).observe(reel);
  document.addEventListener('visibilitychange', () => reel.classList.toggle('offscreen', document.hidden));
})();
