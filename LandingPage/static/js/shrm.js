(() => {
  "use strict";
  const page = document.getElementById("shrmPage");
  if (!page) return;
  const config = window.WMOL_SHRM_CONFIG || {};
  page.classList.add("hs-enhanced");
  const tour = page.querySelector(".hs-tour");
  const slides = [...page.querySelectorAll("[data-slide]")];
  const thumbs = [...page.querySelectorAll("[data-show]")];
  const counter = page.querySelector(".hs-count");
  let current = 0;
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    thumbs.forEach((button, i) => button.setAttribute("aria-pressed", String(i === current)));
    counter.textContent = `${current + 1} / ${slides.length}`;
  }
  page.querySelector(".hs-tour-controls").hidden = false;
  page.querySelector(".hs-thumbnails").hidden = false;
  page.querySelector("[data-prev]").addEventListener("click", () => show(current - 1));
  page.querySelector("[data-next]").addEventListener("click", () => show(current + 1));
  thumbs.forEach(button => button.addEventListener("click", () => show(Number(button.dataset.show))));
  tour.addEventListener("keydown", event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') show(0);
    else if (event.key === 'End') show(slides.length - 1);
    else show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  function safeURL(raw, allowLocal) {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    try {
      const url = new URL(raw, window.location.href);
      if (url.protocol === 'https:' || (allowLocal && url.origin === window.location.origin && url.protocol === 'http:')) return url.href;
    } catch (_) {}
    return null;
  }
  const assetBase = typeof config.assetBase === 'string' ? config.assetBase : '/static/img/shrm/';
  page.querySelectorAll('img[data-asset]').forEach(img => {
    const result = img.dataset.asset === 'result';
    if (!(result ? config.resultReady : config.screenshotsReady)) return;
    const url = safeURL(assetBase + (result ? config.resultFile : img.dataset.asset), true);
    if (!url) return;
    const fallback = img.nextElementSibling;
    img.addEventListener('load', () => {
      img.hidden = false;
      if (fallback) fallback.hidden = true;
    });
    img.addEventListener('error', () => {
      img.hidden = true;
      if (fallback) fallback.hidden = false;
    });
    img.decoding = 'async';
    img.src = url;
  });
  page.querySelectorAll('[data-platform]').forEach(link => {
    const platform = link.dataset.platform;
    const url = safeURL((config.downloads || {})[platform], true);
    if (!url) return;
    link.href = url;
    link.removeAttribute('aria-disabled');
    link.removeAttribute('role');
    link.querySelector('small').textContent = 'Download';
    link.setAttribute('aria-label', `Download WMOL HR Certification Prep for ${platform}`);
  });
  const footerLinks = [...page.querySelectorAll('[data-footer]')];
  const footerPanels = [...page.querySelectorAll('.hs-footer-panel')];
  function syncFooter() {
    footerLinks.forEach(link => {
      const panel = document.getElementById(link.getAttribute('aria-controls'));
      link.setAttribute('aria-expanded', String(panel.open));
    });
  }
  footerLinks.forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const panel = document.getElementById(link.getAttribute('aria-controls'));
    const open = !panel.open;
    footerPanels.forEach(other => { other.open = other === panel && open; });
    syncFooter();
    if (open) panel.querySelector('summary').focus({preventScroll:true});
    else link.focus({preventScroll:true});
  }));
  footerPanels.forEach(panel => panel.addEventListener('toggle', () => {
    syncFooter();
    if (!panel.open && panel.contains(document.activeElement)) {
      const link = footerLinks.find(item => item.getAttribute('aria-controls') === panel.id);
      if (link) link.focus({preventScroll:true});
    }
  }));
  function revealHash() {
    const target = footerPanels.find(panel => '#' + panel.id === window.location.hash);
    if (target) {
      footerPanels.forEach(panel => { panel.open = panel === target; });
      syncFooter();
      target.scrollIntoView({block:'start'});
    }
  }
  window.addEventListener('hashchange', revealHash);
  revealHash();
  const back = page.querySelector('.hs-back');
  back.addEventListener('click', event => {
    if (window.wmolPlainClick && window.wmolNavigate && window.wmolPlainClick(event)) {
      event.preventDefault();
      window.wmolNavigate(back.href);
    }
  });
})();
