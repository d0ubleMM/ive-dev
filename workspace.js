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
})();
