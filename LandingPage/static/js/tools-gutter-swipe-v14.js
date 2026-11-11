/* WMOL Tools v14: restore native-feeling phone scrolling when a swipe begins
   in the empty beige gutters to either side of the card column.
   Only the mobile gesture target changes. Cards, intro fade, pinned controls,
   desktop hover/rail, zoom, and HTML structure remain owned by v13. */
(() => {
  'use strict';
  function init() {
    const layout = document.getElementById('wmol-tools');
    const hub = layout?.querySelector(':scope > .tools-hub');
    const grid = hub?.querySelector('.tools-hub-density-surface > .tools-grid');
    if (!layout || !hub || !grid) return;

    const clamp = (v, low, high) => Math.min(high, Math.max(low, v));
    let gesture = null;
    let glideFrame = 0;
    let glideVelocity = 0;
    let glideTime = 0;

    const stopGlide = () => {
      if (glideFrame) cancelAnimationFrame(glideFrame);
      glideFrame = 0;
      glideVelocity = 0;
    };
    function mobileScrollerReady() {
      const overflow = getComputedStyle(grid).overflowY;
      return window.innerWidth <= 700 &&
        layout.classList.contains('tools-scroll-v12-active') &&
        (overflow === 'auto' || overflow === 'scroll') &&
        grid.scrollHeight > grid.clientHeight + 2;
    }
    function touchById(event, id) {
      for (const touch of event.changedTouches) if (touch.identifier === id) return touch;
      for (const touch of event.touches) if (touch.identifier === id) return touch;
      return null;
    }
    function scrollByAmount(dy) {
      const limit = Math.max(0, grid.scrollHeight - grid.clientHeight);
      const before = grid.scrollTop;
      grid.scrollTop = clamp(before + dy, 0, limit);
      return Math.abs(grid.scrollTop - before) > 0.01;
    }
    function beginGlide(initialVelocity) {
      stopGlide();
      glideVelocity = clamp(initialVelocity, -2.2, 2.2); // CSS px / ms
      if (Math.abs(glideVelocity) < .13) return;
      glideTime = performance.now();
      function frame(now) {
        if (!mobileScrollerReady()) { stopGlide(); return; }
        const dt = clamp(now - glideTime, 1, 35);
        glideTime = now;
        const moved = scrollByAmount(glideVelocity * dt);
        glideVelocity *= Math.pow(.91, dt / 16.67);
        if (moved && Math.abs(glideVelocity) > .09) glideFrame = requestAnimationFrame(frame);
        else stopGlide();
      }
      glideFrame = requestAnimationFrame(frame);
    }
    // Cancel the gutter's momentum if the visitor touches a card or the page.
    hub.addEventListener('touchstart', () => stopGlide(), {passive:true});
    hub.addEventListener('touchstart', event => {
      if (!mobileScrollerReady() || event.touches.length !== 1) return;
      const t = event.touches[0];
      const target = event.target;
      if (!(target instanceof Element)) return;
      // The cards already scroll natively. The Back link, heading and other
      // real controls must never be turned into fake scrolling surfaces.
      if (grid.contains(target) || target.closest('a, button, input, textarea, select, [contenteditable="true"], .tools-back, .tools-hub-hero')) return;
      const cardBox = grid.getBoundingClientRect();
      const hubBox = hub.getBoundingClientRect();
      // Only the left/right BEIGE GUTTERS beside the scrolling card region.
      if (t.clientX >= cardBox.left && t.clientX <= cardBox.right) return;
      if (t.clientX < hubBox.left || t.clientX > hubBox.right ||
          t.clientY < cardBox.top || t.clientY > cardBox.bottom) return;
      gesture = {
        id:t.identifier, originX:t.clientX, originY:t.clientY,
        lastY:t.clientY, lastAt:performance.now(), velocity:0, moved:false
      };
    }, {passive:true});
    hub.addEventListener('touchmove', event => {
      const state = gesture;
      if (!state) return;
      if (event.touches.length !== 1 || !mobileScrollerReady()) {gesture = null; return;}
      const t = touchById(event, state.id);
      if (!t) {gesture = null; return;}
      const dx = t.clientX - state.originX;
      const dy = t.clientY - state.originY;
      if (!state.moved) {
        if (Math.abs(dx) > Math.abs(dy) * 1.3 && Math.abs(dx) > 7) {gesture = null; return;}
        if (Math.abs(dy) < 5) return; // taps are still taps
        state.moved = true;
      }
      const now = performance.now();
      const delta = state.lastY - t.clientY;
      const dt = Math.max(1, now - state.lastAt);
      scrollByAmount(delta);
      // Damp noisy events but retain a natural swipe finish.
      state.velocity = state.velocity * .55 + (delta / dt) * .45;
      state.lastY = t.clientY;
      state.lastAt = now;
      // iOS/Safari: suppress document rubber-banding *only* for a genuine
      // one-finger gutter swipe. Do not interfere with pinch zoom or tapping.
      if (event.cancelable) event.preventDefault();
    }, {passive:false});
    hub.addEventListener('touchend', event => {
      if (!gesture || !touchById(event,gesture.id)) return;
      const finished = gesture;
      gesture = null;
      if (finished.moved && performance.now() - finished.lastAt < 110) beginGlide(finished.velocity);
    }, {passive:true});
    hub.addEventListener('touchcancel', () => { gesture=null; stopGlide(); }, {passive:true});
    window.addEventListener('wmol:viewport', () => {gesture=null; stopGlide();}, {passive:true});
    window.addEventListener('pagehide', stopGlide, {passive:true});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
