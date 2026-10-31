/* Select real IVE previews. Tabs are independent of playback and support keyboard navigation. */
(function () {
  'use strict';
  document.querySelectorAll('[data-ws-tabs]').forEach(function (group) {
    var tabs = Array.from(group.querySelectorAll('[data-ws-tab]'));
    var panels = Array.from(group.querySelectorAll('[data-ws-panel]'));
    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-selected', i === index ? 'true' : 'false');
        tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (event) {
        var next = i;
        if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(next, true);
      });
    });
  });

  /* Header CTA (design/ACCENT-BRIEF.md, Where 2): one coloured call to action per view. While the
     hero's own buttons (.ws-actions) are ahead of or inside the viewport, html.hero-cta-ahead keeps
     the header button neutral; once they have scrolled above the viewport it turns pop, and back
     again on the way up. Pages without .ws-actions are left alone; without JS the header is pop. */
  var actions = document.querySelector('.ws-actions');
  if (actions) {
    var root = document.documentElement;
    var setAhead = function (ahead) { root.classList.toggle('hero-cta-ahead', ahead); };
    // first state before the first frame (deferred scripts run before paint), no flash of pop
    setAhead(actions.getBoundingClientRect().bottom > 0);
    if ('IntersectionObserver' in window) {
      // the root is extended far below the viewport, so "intersecting" means "not yet above its top edge";
      // the observer also follows layout shifts (the intro's measured heights) without a scroll event
      new IntersectionObserver(function (entries) {
        setAhead(entries[entries.length - 1].isIntersecting);
      }, { rootMargin: '0px 0px 100000px 0px', threshold: 0 }).observe(actions);
    } else {
      var queued = false;
      window.addEventListener('scroll', function () {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; setAhead(actions.getBoundingClientRect().bottom > 0); });
      }, { passive: true });
    }
  }
})();
