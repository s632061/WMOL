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
  const viewer = page.querySelector('#hsViewer');
  const viewport = viewer.querySelector('.hs-viewer-viewport');
  const canvas = viewer.querySelector('.hs-viewer-canvas');
  const viewerImage = viewer.querySelector('.hs-viewer-image');
  const viewerTitle = viewer.querySelector('#hsViewerTitle');
  const viewerCaption = viewer.querySelector('#hsViewerCaption');
  const zoomIn = viewer.querySelector('[data-zoom-in]');
  const zoomOut = viewer.querySelector('[data-zoom-out]');
  const zoomFit = viewer.querySelector('[data-zoom-fit]');
  const closePreview = viewer.querySelector('[data-close-preview]');
  let zoom = 1;
  let opener = null;
  let savedScroll = {x:0,y:0};
  let pan = null;
  function sizePreview(nextZoom = zoom) {
    if (!viewer.open || !viewerImage.naturalWidth || !viewport.clientWidth || !viewport.clientHeight) return;
    const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / Math.max(1, viewport.scrollWidth);
    const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / Math.max(1, viewport.scrollHeight);
    zoom = Math.max(1, Math.min(4, nextZoom));
    const fit = Math.min((viewport.clientWidth - 16) / viewerImage.naturalWidth,
      (viewport.clientHeight - 16) / viewerImage.naturalHeight, 1);
    viewerImage.style.width = `${Math.max(1, viewerImage.naturalWidth * fit * zoom)}px`;
    viewerImage.style.height = `${Math.max(1, viewerImage.naturalHeight * fit * zoom)}px`;
    viewer.classList.toggle('is-zoomed', zoom > 1);
    zoomOut.disabled = zoom <= 1;
    zoomIn.disabled = zoom >= 4;
    zoomFit.textContent = zoom === 1 ? 'Fit' : `${Math.round(zoom * 100)}%`;
    viewport.scrollLeft = zoom === 1 ? 0 : centerX * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollTop = zoom === 1 ? 0 : centerY * viewport.scrollHeight - viewport.clientHeight / 2;
  }
  function openPreview(button) {
    const img = button.querySelector('img');
    if (!img || img.hidden || !img.naturalWidth) return;
    if (typeof viewer.showModal !== 'function') {
      window.open(img.currentSrc || img.src, '_blank', 'noopener');
      return;
    }
    const caption = button.closest('.hs-slide').querySelector('.hs-caption');
    opener = button;
    savedScroll = {x:window.scrollX,y:window.scrollY};
    zoom = 1;
    viewerImage.style.width = '1px';
    viewerImage.style.height = '1px';
    viewerImage.alt = img.alt;
    viewerTitle.textContent = caption.querySelector('h2').textContent;
    viewerCaption.textContent = caption.querySelector('p').textContent;
    viewerImage.src = img.currentSrc || img.src;
    viewer.showModal();
    document.documentElement.classList.add('hs-viewer-open');
    closePreview.focus({preventScroll:true});
    viewport.scrollLeft = viewport.scrollTop = 0;
    requestAnimationFrame(() => sizePreview(1));
  }
  page.querySelectorAll('[data-open-preview]').forEach(button => {
    button.addEventListener('click', () => openPreview(button));
  });
  viewerImage.addEventListener('load', () => sizePreview());
  closePreview.addEventListener('click', () => viewer.close());
  // Native dialog handles Escape, focus containment, and background inertness.
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('hs-viewer-open');
    viewer.classList.remove('is-panning');
    pan = null;
    window.scrollTo({left:savedScroll.x,top:savedScroll.y,behavior:'instant'});
    if (opener && opener.isConnected) opener.focus({preventScroll:true});
  });
  let backdropStart = false;
  viewer.addEventListener('pointerdown', event => {
    backdropStart = event.target === viewer || event.target === viewport || event.target === canvas;
  });
  viewer.addEventListener('click', event => {
    if (backdropStart && zoom === 1 && (event.target === viewer || event.target === viewport || event.target === canvas)) viewer.close();
    backdropStart = false;
  });
  zoomIn.addEventListener('click', () => sizePreview(zoom + .5));
  zoomOut.addEventListener('click', () => sizePreview(zoom - .5));
  zoomFit.addEventListener('click', () => sizePreview(1));
  viewerImage.addEventListener('dblclick', () => sizePreview(zoom > 1 ? 1 : 2));
  viewer.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (!['+', '=', '-', '0'].includes(event.key)) return;
    event.preventDefault();
    sizePreview(event.key === '0' ? 1 : zoom + (event.key === '-' ? -.5 : .5));
  });
  // Touch uses native scrolling and pinch zoom; mouse users can drag to pan.
  viewport.addEventListener('pointerdown', event => {
    if (zoom <= 1 || event.pointerType !== 'mouse' || event.button !== 0) return;
    event.preventDefault();
    pan = {id:event.pointerId,x:event.clientX,y:event.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
    viewport.setPointerCapture(event.pointerId);
    viewer.classList.add('is-panning');
  });
  viewport.addEventListener('pointermove', event => {
    if (!pan || pan.id !== event.pointerId) return;
    viewport.scrollLeft = pan.left - (event.clientX - pan.x);
    viewport.scrollTop = pan.top - (event.clientY - pan.y);
  });
  function stopPan() {pan = null; viewer.classList.remove('is-panning');}
  viewport.addEventListener('pointerup', stopPan);
  viewport.addEventListener('pointercancel', stopPan);
  viewport.addEventListener('lostpointercapture', stopPan);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => sizePreview()).observe(viewport);
  else window.addEventListener('resize', () => sizePreview());
  const assetBase = typeof config.assetBase === 'string' ? config.assetBase : '/static/img/shrm/';
  page.querySelectorAll('img[data-asset]').forEach(img => {
    const result = img.dataset.asset === 'result';
    if (!(result ? config.resultReady : config.screenshotsReady)) return;
    const url = safeURL(assetBase + (result ? config.resultFile : img.dataset.asset), true);
    if (!url) return;
    const fallback = img.nextElementSibling;
    const evidence = result ? img.closest('[data-evidence-slot]') : null;
    const previewButton = img.closest('[data-open-preview]');
    img.addEventListener('load', () => {
      img.hidden = false;
      if (fallback) fallback.hidden = true;
      if (evidence) evidence.hidden = false;
      if (previewButton) previewButton.disabled = false;
    });
    img.addEventListener('error', () => {
      img.hidden = true;
      if (fallback) fallback.hidden = false;
      if (evidence) evidence.hidden = true;
      if (previewButton) previewButton.disabled = true;
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
  const footerNav = page.querySelector('.hs-footer-nav');
  footerNav.setAttribute('role', 'tablist');
  footerNav.setAttribute('aria-orientation', 'horizontal');
  footerLinks.forEach(link => link.setAttribute('role', 'tab'));
  footerPanels.forEach(panel => {
    panel.setAttribute('role', 'tabpanel');
    panel.tabIndex = 0;
  });
  function selectFooter(id, focusTab = false) {
    footerLinks.forEach(link => {
      const selected = link.getAttribute('aria-controls') === id;
      link.setAttribute('aria-selected', String(selected));
      link.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) link.focus({preventScroll:true});
    });
    footerPanels.forEach(panel => { panel.hidden = panel.id !== id; });
    if (focusTab) {
      try { window.history.replaceState(window.history.state, '', '#' + id); } catch (_) {}
    }
  }
  footerLinks.forEach((link, index) => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      selectFooter(link.getAttribute('aria-controls'), true);
    });
    link.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % footerLinks.length;
      else if (event.key === 'ArrowLeft') next = (index + footerLinks.length - 1) % footerLinks.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = footerLinks.length - 1;
      else if (event.key === ' ') next = index;
      else return;
      event.preventDefault();
      selectFooter(footerLinks[next].getAttribute('aria-controls'), true);
    });
  });
  function revealHash(scroll = true) {
    const target = footerPanels.find(panel => '#' + panel.id === window.location.hash);
    if (target) {
      selectFooter(target.id);
      if (scroll) target.scrollIntoView({block:'start'});
    }
  }
  selectFooter('hs-contact');
  window.addEventListener('hashchange', () => revealHash());
  revealHash();
  const back = page.querySelector('.hs-back');
  back.addEventListener('click', event => {
    if (window.wmolPlainClick && window.wmolNavigate && window.wmolPlainClick(event)) {
      event.preventDefault();
      window.wmolNavigate(back.href);
    }
  });
})();
