(function () {
  'use strict';
  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* header turns solid once the page scrolls past the hero's top edge */
  var hdr = $('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('solid', window.scrollY > 40); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* mobile drawer */
  var burger = $('.burger'), drawer = $('#mnav');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    if (burger) { burger.setAttribute('aria-expanded', open ? 'true' : 'false'); burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
    if (drawer) { if (open) drawer.removeAttribute('inert'); else drawer.setAttribute('inert', ''); }
  }
  if (burger && drawer) {
    setNav(false);
    burger.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) setNav(false); });
  }

  /* branch chooser for Call / Directions */
  var sheet = $('#sheet'), data = {}, lastFocus = null;
  try { data = JSON.parse($('#branches').textContent); } catch (e) { data = {}; }
  function openSheet(kind, trigger) {
    if (!sheet || !data.branches) return;
    var call = kind === 'call';
    $('#sheet-t').textContent = call ? 'Call a branch' : 'Directions to a branch';
    $('.opts', sheet).innerHTML = data.branches.map(function (b) {
      var href = call ? 'tel:' + b.tel : b.maps;
      var sub = call ? b.telTxt : b.area;
      return '<a href="' + href + '"' + (call ? '' : ' target="_blank" rel="noopener"') + '><b>' + b.name + '</b><span>' + sub + '</span></a>';
    }).join('');
    lastFocus = trigger; sheet.removeAttribute('inert'); sheet.classList.add('open');
    var f = $('.opts a', sheet); if (f) f.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!sheet || !sheet.classList.contains('open')) return;
    sheet.classList.remove('open'); sheet.setAttribute('inert', '');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  if (sheet) {
    sheet.setAttribute('inert', '');
    $$('[data-sheet]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openSheet(a.getAttribute('data-sheet'), a); });
    });
    $$('[data-close]', sheet).forEach(function (b) { b.addEventListener('click', closeSheet); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('.opts a')) setTimeout(closeSheet, 150); });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (sheet && sheet.classList.contains('open')) closeSheet();
    else if (body.classList.contains('nav-open')) { setNav(false); if (burger) burger.focus(); }
    // keep Tab inside the sheet while it is open
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !sheet || !sheet.classList.contains('open')) return;
    var f = $$('a,button', sheet); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* scroll reveals */
  var rv = $$('.rv, .rv-c');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* hero: the Blooms half slowly alternates between bouquet and plants */
  var slides = $$('.pane-a .slide');
  if (slides.length > 1 && !reduce) {
    var k = 0;
    setInterval(function () {
      if (doc.hidden) return;
      slides[k].classList.remove('on'); k = (k + 1) % slides.length; slides[k].classList.add('on');
    }, 6500);
  }

  /* menu page: highlight the chip for the group in view */
  var chips = $$('.chips a[href^="#"]');
  if (chips.length && 'IntersectionObserver' in window) {
    var map = {}; chips.forEach(function (c) { map[c.getAttribute('href').slice(1)] = c; });
    var cur = null;
    function setOn(id) {
      if (cur === id || !map[id]) return; cur = id;
      chips.forEach(function (c) { c.classList.remove('on'); c.removeAttribute('aria-current'); });
      map[id].classList.add('on'); map[id].setAttribute('aria-current', 'true');
      var sc = map[id].parentNode, l = map[id].offsetLeft - sc.clientWidth / 2 + map[id].offsetWidth / 2;
      if (sc.scrollTo) sc.scrollTo({ left: l, behavior: reduce ? 'auto' : 'smooth' });
    }
    var targets = Object.keys(map).map(function (id) { return doc.getElementById(id); }).filter(Boolean);
    function spy() {
      var y = window.innerHeight * 0.32, best = null;
      targets.forEach(function (t) { if (t.getBoundingClientRect().top <= y) best = t; });
      if (best) setOn(best.id);
      else if (cur) { cur = null; chips.forEach(function (c) { c.classList.remove('on'); c.removeAttribute('aria-current'); }); }
    }
    window.addEventListener('scroll', spy, { passive: true }); window.addEventListener('resize', spy); spy();
  }
})();
