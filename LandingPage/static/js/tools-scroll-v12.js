/* WMOL Tools v12 — reversible, scroll-driven intro + brown card-only rail.
   Back and heading stay in place; existing intro paragraphs are moved rather
   than rewritten or duplicated. The original v11 layout is a JS-free fallback.
   Original 3-column desktop/portrait card dimensions are not modified. */
(() => {
  'use strict';
  function init() {
    const layout = document.getElementById('wmol-tools');
    const hub = layout?.querySelector('.tools-hub');
    const surface = hub?.querySelector('.tools-hub-density-surface');
    const hero = surface?.querySelector(':scope > .tools-hub-hero');
    const grid = surface?.querySelector(':scope > .tools-grid');
    const subtitle = hero?.querySelector('.tools-hub-subtitle');
    const description = hero?.querySelector('.tools-hub-description');
    if (!layout || !hub || !hero || !grid || !subtitle || !description) return;

    if (!grid.id) grid.id = 'wmol-tools-card-list';
    const intro = document.createElement('div');
    intro.className = 'tools-scroll-v12-intro';
    intro.setAttribute('aria-label', 'About the WMOL learning systems');
    grid.prepend(intro);

    const rail = document.createElement('div');
    rail.className = 'tools-scroll-v11-rail';
    rail.setAttribute('role', 'scrollbar');
    rail.setAttribute('aria-label', 'Scroll available learning systems');
    rail.setAttribute('aria-orientation', 'vertical');
    rail.setAttribute('aria-controls', grid.id);
    rail.setAttribute('aria-valuemin', '0');
    rail.setAttribute('tabindex', '0');
    const thumb = document.createElement('span');
    thumb.className = 'tools-scroll-v11-thumb';
    rail.appendChild(thumb);
    hub.appendChild(rail);
    layout.classList.add('tools-scroll-v11-ready');

    const max = (v, low, high) => Math.min(high, Math.max(low, v));
    let request = 0;
    let isActive = false;
    let railHeight = 0;
    let thumbHeight = 0;
    let scrollLimit = 0;
    let dragging = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)');
    const legacyScroll = window.matchMedia('(min-width:701px) and (min-height:601px)');
    const firstCard = grid.querySelector('.tool-icon-card');

    function eligible() {
      const w = window.innerWidth, h = window.innerHeight;
      const phone = document.documentElement.classList.contains('wmol-phone-device');
      // Portrait desktops are already approved at 100% zoom: do not rearrange.
      if (!phone && w > 900 && h > w) return false;
      // Very short desktop windows keep v10's accessible ordinary scrolling.
      if (w > 700 && h <= 600) return false;
      // Avoid trapping scrolling on tiny landscape phone windows.
      if (w <= 700 && h < 480) return false;
      return true;
    }

    function applyLayout() {
      const wanted = eligible();
      if (wanted !== isActive) {
        isActive = wanted;
        if (wanted) {
          intro.append(subtitle, description);
          layout.classList.add('tools-scroll-v12-active');
        } else {
          hero.append(subtitle, description);
          layout.classList.remove('tools-scroll-v12-active');
          grid.style.removeProperty('--tools-v12-intro-opacity');
        }
      }
      schedule();
    }

    function refresh() {
      request = 0;
      const enabled = (legacyScroll.matches && !document.documentElement.classList.contains('wmol-phone-device')) ||
        (isActive && window.innerWidth <= 700);
      const overflow = getComputedStyle(grid).overflowY;
      scrollLimit = Math.max(0, grid.scrollHeight - grid.clientHeight);
      if (!enabled || scrollLimit < 2 || (overflow !== 'auto' && overflow !== 'scroll')) {
        rail.style.display = 'none';
        return;
      }
      const hubBox = hub.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      const gridTop = gridBox.top - hubBox.top - hub.clientTop;
      // Move the TOP of the brown track up as the introduction naturally
      // scrolls away; stop it exactly beneath the persistent title/underline.
      const firstCardTop = firstCard
        ? firstCard.getBoundingClientRect().top - hubBox.top - hub.clientTop
        : gridTop;
      const railTop = isActive ? Math.max(gridTop, firstCardTop) : gridTop;
      railHeight = Math.max(0, gridBox.bottom - hubBox.top - hub.clientTop - railTop - 12);
      if (railHeight < 48) { rail.style.display = 'none'; return; }
      rail.style.display = 'block';
      rail.style.top = `${Math.round(railTop)}px`;
      rail.style.height = `${Math.round(railHeight)}px`;
      thumbHeight = max(railHeight * grid.clientHeight / grid.scrollHeight, isActive && window.innerWidth <= 700 ? 28 : 35, railHeight);
      thumb.style.height = `${Math.round(thumbHeight)}px`;
      // The thumb follows the cards after the intro has moved out of view.
      // Before then, its position stays near the top as the rail rises.
      const introDistance = isActive && firstCard
        ? Math.max(0, firstCardTop - gridTop + grid.scrollTop)
        : 0;
      const cardDistance = Math.max(1, scrollLimit - Math.min(introDistance, scrollLimit));
      const cardProgress = isActive
        ? max((grid.scrollTop - introDistance) / cardDistance, 0, 1)
        : max(grid.scrollTop / Math.max(1, scrollLimit), 0, 1);
      const travel = Math.max(0, railHeight - thumbHeight);
      thumb.style.top = `${Math.round(travel * cardProgress)}px`;
      rail.setAttribute('aria-valuemax', String(Math.round(scrollLimit)));
      rail.setAttribute('aria-valuenow', String(Math.round(grid.scrollTop)));

      if (isActive) {
        const progress = max(grid.scrollTop / Math.max(1, introDistance), 0, 1);
        intro.style.setProperty('--tools-v12-intro-opacity',
          reducedMotion.matches ? '1' : String(Math.pow(1 - progress, 0.6).toFixed(3)));
      }
    }
    function schedule() {
      if (!request) request = window.requestAnimationFrame(refresh);
    }
    function positionFromPointer(event, grabOffset) {
      const p = (event.clientY - rail.getBoundingClientRect().top - grabOffset) / Math.max(1, railHeight - thumbHeight);
      const introDistance = isActive && firstCard
        ? Math.max(0, firstCard.getBoundingClientRect().top - grid.getBoundingClientRect().top + grid.scrollTop)
        : 0;
      const availableCards = Math.max(0, scrollLimit - introDistance);
      // The rail represents the card region. Clicking/dragging it scrolls the
      // intro away first, then moves through the cards.
      grid.scrollTop = isActive
        ? Math.min(scrollLimit, introDistance + max(p, 0, 1) * availableCards)
        : max(p, 0, 1) * scrollLimit;
    }
    rail.addEventListener('pointerdown', event => {
      if (event.button !== 0 || rail.style.display === 'none') return;
      const t = thumb.getBoundingClientRect();
      const overThumb = event.clientY >= t.top && event.clientY <= t.bottom;
      dragging = { id:event.pointerId, offset:overThumb ? event.clientY - t.top : thumbHeight / 2 };
      rail.setPointerCapture(event.pointerId);
      positionFromPointer(event, dragging.offset);
      event.preventDefault();
    });
    rail.addEventListener('pointermove', event => {
      if (!dragging || dragging.id !== event.pointerId) return;
      positionFromPointer(event, dragging.offset);
      event.preventDefault();
    });
    function finish(event) {
      if (!dragging || dragging.id !== event.pointerId) return;
      dragging = null;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    }
    rail.addEventListener('pointerup', finish);
    rail.addEventListener('pointercancel', finish);
    rail.addEventListener('lostpointercapture', () => { dragging = null; });
    rail.addEventListener('keydown', event => {
      const step = Math.max(50, grid.clientHeight * 0.15);
      let target;
      if (event.key === 'ArrowDown') target = grid.scrollTop + step;
      else if (event.key === 'ArrowUp') target = grid.scrollTop - step;
      else if (event.key === 'PageDown') target = grid.scrollTop + grid.clientHeight * 0.85;
      else if (event.key === 'PageUp') target = grid.scrollTop - grid.clientHeight * 0.85;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = scrollLimit;
      else return;
      event.preventDefault();
      grid.scrollTop = max(target, 0, scrollLimit);
    });
    grid.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', applyLayout, { passive:true });
    window.addEventListener('wmol:viewport', applyLayout);
    window.addEventListener('wmol:portrait', applyLayout);
    window.addEventListener('wmol:prepare-snapshot', applyLayout);
    reducedMotion.addEventListener?.('change', schedule);
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(schedule);
      observer.observe(hub); observer.observe(grid); observer.observe(hero);
    }
    document.fonts?.ready?.then(schedule);
    window.addEventListener('load', applyLayout, {once:true});
    applyLayout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
