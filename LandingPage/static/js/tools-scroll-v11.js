/* WMOL Tools v11: always-visible, warm-brown scrollbar for the card grid only.
   Uses the v10 scrollable .tools-grid. No body/window scroll interception.
   Native wheel/touchpad and keyboard controls continue to work. */
(() => {
  'use strict';
  function init() {
    const layout = document.getElementById('wmol-tools');
    const hub = layout?.querySelector('.tools-hub');
    const grid = hub?.querySelector('.tools-hub-density-surface > .tools-grid');
    if (!grid || !hub || hub.querySelector('.tools-scroll-v11-rail')) return;

    if (!grid.id) grid.id = 'wmol-tools-card-list';
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
    // Hide the native scrollbar only after the replacement rail is attached.
    layout.classList.add('tools-scroll-v11-ready');

    const media = window.matchMedia('(min-width:701px) and (min-height:601px)');
    let raf = 0;
    let railHeight = 0;
    let thumbHeight = 0;
    let maxScroll = 0;
    let dragging = null;
    const clamp = (v, low, high) => Math.min(high, Math.max(low, v));

    function refresh() {
      raf = 0;
      const enabled = media.matches && !document.documentElement.classList.contains('wmol-phone-device');
      maxScroll = Math.max(0, grid.scrollHeight - grid.clientHeight);
      if (!enabled || maxScroll < 2 || getComputedStyle(grid).overflowY !== 'auto') {
        rail.style.display = 'none';
        return;
      }
      const hubBox = hub.getBoundingClientRect();
      const gridBox = grid.getBoundingClientRect();
      // Start exactly at the bottom of the fixed heading/description, beside
      // the first card row; end level with the card scroll region's bottom.
      const top = Math.max(0, gridBox.top - hubBox.top - hub.clientTop);
      railHeight = Math.max(0, gridBox.height - 12);
      if (railHeight < 48) {rail.style.display = 'none';return;}
      rail.style.display = 'block';
      rail.style.top = `${Math.round(top)}px`;
      rail.style.height = `${Math.round(railHeight)}px`;
      thumbHeight = clamp(railHeight * grid.clientHeight / grid.scrollHeight, 35, railHeight);
      thumb.style.height = `${Math.round(thumbHeight)}px`;
      const available = Math.max(0, railHeight - thumbHeight);
      thumb.style.top = `${Math.round(maxScroll ? (grid.scrollTop / maxScroll) * available : 0)}px`;
      rail.setAttribute('aria-valuemax', String(Math.round(maxScroll)));
      rail.setAttribute('aria-valuenow', String(Math.round(grid.scrollTop)));
    }
    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(refresh);
    }
    function scrollToRailPointer(event, grabOffset) {
      const t = (event.clientY - rail.getBoundingClientRect().top) - grabOffset;
      const distance = railHeight - thumbHeight;
      grid.scrollTop = distance > 0 ? clamp(t / distance, 0, 1) * maxScroll : 0;
    }
    rail.addEventListener('pointerdown', event => {
      if (event.button !== 0 || rail.style.display === 'none') return;
      const thumbBox = thumb.getBoundingClientRect();
      const onThumb = event.clientY >= thumbBox.top && event.clientY <= thumbBox.bottom;
      const grabOffset = onThumb ? event.clientY - thumbBox.top : thumbHeight / 2;
      dragging = {pointerId:event.pointerId, grabOffset};
      rail.setPointerCapture(event.pointerId);
      scrollToRailPointer(event, grabOffset);
      event.preventDefault();
    });
    rail.addEventListener('pointermove', event => {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      scrollToRailPointer(event, dragging.grabOffset);
      event.preventDefault();
    });
    function endDrag(event) {
      if (!dragging || dragging.pointerId !== event.pointerId) return;
      dragging = null;
      if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('lostpointercapture', () => {dragging = null;});
    rail.addEventListener('keydown', event => {
      const amount = Math.max(50, grid.clientHeight * .15);
      let next;
      if (event.key === 'ArrowDown') next = grid.scrollTop + amount;
      else if (event.key === 'ArrowUp') next = grid.scrollTop - amount;
      else if (event.key === 'PageDown') next = grid.scrollTop + grid.clientHeight * .85;
      else if (event.key === 'PageUp') next = grid.scrollTop - grid.clientHeight * .85;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = maxScroll;
      else return;
      event.preventDefault();
      grid.scrollTop = clamp(next, 0, maxScroll);
    });
    grid.addEventListener('scroll', schedule, {passive:true});
    window.addEventListener('resize', schedule, {passive:true});
    window.addEventListener('wmol:viewport', schedule);
    window.addEventListener('wmol:portrait', schedule);
    window.addEventListener('wmol:prepare-snapshot', schedule);
    media.addEventListener?.('change', schedule);
    if (window.ResizeObserver) {
      const obs = new ResizeObserver(schedule);
      obs.observe(hub); obs.observe(grid);
      const hero = hub.querySelector('.tools-hub-hero');
      if (hero) obs.observe(hero);
    }
    document.fonts?.ready?.then(schedule);
    window.addEventListener('load', schedule, {once:true});
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
