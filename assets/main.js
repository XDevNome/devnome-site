// DevNome: scroll-driven animation.
// Each pinned section ([data-pin]) is taller than the screen; while you scroll through it its stage
// stays put and its progress (0 → 1) drives the animation below. With a mouse, the page itself
// scrolls smoothly (the wheel sets where to go, each frame moves part of the way there), and the
// animations follow the scroll exactly.
(() => {
  // Where "Start a project" and "Contact" go. Put the studio's email here when it exists,
  // e.g. "mailto:hello@devnome.com"; until then they open DevNome's GitHub.
  const CONTACT = "";
  if (CONTACT) document.querySelectorAll("[data-contact]").forEach(a => { a.href = CONTACT; a.removeAttribute("target"); });

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // ease in-out
  const out = t => 1 - Math.pow(1 - t, 3);                                       // ease out
  const span = (p, a, b) => clamp((p - a) / (b - a));                            // 0 → 1 between a and b
  const $ = id => document.getElementById(id);
  let vw = innerWidth, vh = innerHeight;

  // ---------- 1. hero: the panel shrinks into a card and the copy leaves ----------
  const heroPanel = $("heroPanel"), heroCopy = $("heroCopy"), cluster = $("cluster"), heroBottom = $("heroBottom");
  function hero(p) {
    const e = ease(span(p, 0.05, 0.95));
    heroPanel.style.transform = `translateY(${-e * vh * 0.06}px) scale(${1 - e * 0.34})`;
    heroPanel.style.borderRadius = 30 + e * 26 + "px";
    const c = span(p, 0, 0.55);
    heroCopy.style.opacity = 1 - c * 1.3;
    heroCopy.style.transform = `translateY(${-c * 70}px)`;
    cluster.style.transform = `translate(${-e * vw * 0.2}px, calc(-50% + ${e * vh * 0.04}px)) scale(${1 + e * 0.12})`;
    heroBottom.style.opacity = 1 - span(p, 0, 0.3);
    return true;
  }

  // ---------- 2. services: the words slide left, the cards cross the screen in 3D ----------
  const marquee = $("marquee"), cards = [...document.querySelectorAll(".c3")];
  function services(p) {
    const mw = marquee.scrollWidth;
    marquee.style.transform = `translate(${vw * 0.15 - p * (mw - vw * 0.7)}px, -50%)`;
    const n = cards.length;
    cards.forEach((el, i) => {
      const centre = 0.1 + i * (0.8 / (n - 1));
      const q = (p - centre) / 0.24;                       // -1 entering on the right … 1 leaving on the left
      if (Math.abs(q) > 1.6) { el.style.opacity = 0; return; }
      const x = -q * vw * 0.5;
      const y = (i % 2 ? 1 : -1) * vh * 0.04 + q * q * vh * 0.03;
      const z = -Math.abs(q) * 340;
      const ry = q * 38, rz = q * -4;
      el.style.opacity = clamp(1.5 - Math.abs(q) * 0.9);
      el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg) rotateZ(${rz}deg)`;
      el.style.zIndex = 100 - Math.round(Math.abs(q) * 50);
    });
    return true;
  }

  // ---------- 3. approach: "From idea" / "to release" part around a growing star ----------
  const w1 = $("w1"), w2 = $("w2"), star = $("starWrap"), approachText = $("approachText"), stats = [...document.querySelectorAll("#stats div")];
  function approach(p) {
    const a = out(span(p, 0.02, 0.4)), b = out(span(p, 0.12, 0.5));
    w1.style.transform = `translateX(${(1 - a) * -45}vw)`; w1.style.opacity = a;
    w2.style.transform = `translateX(${(1 - b) * 45}vw)`; w2.style.opacity = b;
    const s = out(span(p, 0.1, 0.55));
    star.style.transform = `scale(${0.15 + s * 0.85}) rotate(${p * 200}deg)`;
    star.style.opacity = s;
    const t = out(span(p, 0.4, 0.62));
    approachText.style.opacity = t; approachText.style.transform = `translateY(${(1 - t) * 40}px)`;
    stats.forEach((el, i) => {
      const k = out(span(p, 0.5 + i * 0.08, 0.7 + i * 0.08));
      el.style.opacity = k; el.style.transform = `translateY(${(1 - k) * 30}px)`;
    });
    return false;
  }

  // ---------- 4. work: the row moves sideways; the card in the middle comes forward ----------
  const track = $("workTrack"), wks = [...track.children], workBar = $("workBar"), workCount = $("workCount");
  function work(p) {
    const travel = Math.max(0, track.scrollWidth - vw);
    const x = -ease(p) * travel;
    track.style.transform = `translateX(${x}px)`;
    let best = 0, bestD = 1e9;
    wks.forEach((el, i) => {
      const r = el.offsetLeft + x + el.offsetWidth / 2 - vw / 2;
      if (Math.abs(r) < bestD) { bestD = Math.abs(r); best = i; }
    });
    wks.forEach((el, i) => el.classList.toggle("on", i === best));
    workBar.style.width = p * 100 + "%";
    workCount.textContent = String(Math.min(best + 1, 6)).padStart(2, "0") + " / 06";
    return false;
  }

  // ---------- 6. tools: tiles fly in from all around and settle in a ring ----------
  const tiles = [...document.querySelectorAll("#tiles span")], stackTitle = $("stackTitle");
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tileFrom = tiles.map(() => ({ x: (rnd() - 0.5) * 2.4, y: (rnd() - 0.5) * 2.2, z: 400 + rnd() * 900, r: (rnd() - 0.5) * 70 }));
  function stack(p) {
    const e = ease(span(p, 0, 0.8));
    const n = tiles.length;
    tiles.forEach((el, i) => {
      const f = tileFrom[i];
      const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      const ex = Math.cos(ang) * Math.min(vw * 0.38, 560), ey = Math.sin(ang) * Math.min(vh * 0.36, 330);
      const sx = f.x * vw, sy = f.y * vh;
      const x = sx + (ex - sx) * e, y = sy + (ey - sy) * e, z = f.z * (1 - e), r = f.r * (1 - e);
      el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotate(${r}deg)`;
      el.style.opacity = clamp(e * 1.6);
    });
    const t = out(span(p, 0.45, 0.85));
    stackTitle.style.opacity = t;
    stackTitle.style.transform = `translate(-50%, -50%) scale(${0.9 + t * 0.1})`;
    return false;
  }

  const handlers = { hero, services, approach, work, stack };
  const pins = [...document.querySelectorAll("[data-pin]")].map(el => ({ el, fn: handlers[el.dataset.pin], p: 0, shown: -1 }));

  // ---------- the process line and other small things ----------
  const stepLine = $("stepLine"), steps = $("steps"), ring = $("ring");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
  $("year").textContent = new Date().getFullYear();

  // ---------- smooth scrolling with a mouse wheel ----------
  const smooth = !reduce && matchMedia("(pointer: fine)").matches;
  const maxScroll = () => document.documentElement.scrollHeight - innerHeight;
  let sTarget = scrollY, sCur = scrollY, sOn = false;
  if (smooth) {
    document.documentElement.style.scrollBehavior = "auto";
    addEventListener("wheel", e => {
      if (e.ctrlKey) return;                     // pinch / ctrl+wheel zoom stays the browser's
      e.preventDefault();
      if (!sOn) sTarget = sCur = scrollY;
      const d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      sTarget = clamp(sTarget + d, 0, maxScroll());
      sOn = true;
    }, { passive: false });
    // keys, the scrollbar or find-in-page take over at once
    const stop = () => { sOn = false; sTarget = sCur = scrollY; };
    addEventListener("keydown", stop); addEventListener("mousedown", e => { if (e.button === 0 && e.clientX > document.documentElement.clientWidth - 4) stop(); });
    // links inside the page glide there too
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      if (!sOn) sTarget = sCur = scrollY;
      sTarget = clamp(t.getBoundingClientRect().top + scrollY, 0, maxScroll());
      sOn = true;
      history.replaceState(null, "", a.getAttribute("href") === "#top" ? location.pathname : a.getAttribute("href"));
    }));
  }
  function frame() {
    if (sOn) {
      sCur += (sTarget - sCur) * 0.09;
      if (Math.abs(sTarget - sCur) < 0.4) { sCur = sTarget; sOn = false; }
      scrollTo(0, sCur);
    }
    for (const pin of pins) {
      const r = pin.el.getBoundingClientRect();
      pin.p = clamp(-r.top / Math.max(1, r.height - vh));
      // only sections near the screen are drawn, and only when they've moved
      const visible = r.bottom > -vh * 0.2 && r.top < vh * 1.2;
      if (visible && Math.abs(pin.shown - pin.p) > 0.00005) { pin.shown = pin.p; pin.fn(pin.p); }
    }
    // process: the line follows the steps up the screen
    const sr = steps.getBoundingClientRect();
    stepLine.style.height = clamp((vh * 0.65 - sr.top) / sr.height) * 100 + "%";
    // the ring around the back-to-top button
    const doc = document.documentElement;
    ring.style.strokeDashoffset = 125.7 * (1 - clamp(scrollY / Math.max(1, doc.scrollHeight - vh)));
    requestAnimationFrame(frame);
  }
  addEventListener("resize", () => { vw = innerWidth; vh = innerHeight; pins.forEach(p => p.shown = -1); });
  requestAnimationFrame(frame);
})();
