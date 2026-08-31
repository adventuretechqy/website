/* Material detail pages: single-image slider (one 1:1 image per view).
   Arrow buttons step one full image; touch/trackpad swipes snap to slides. */
(function () {
  'use strict';

  var sliders = document.querySelectorAll('.gallery-slider');
  if (!sliders.length) return;

  sliders.forEach(function (slider) {
    var viewport = slider.querySelector('.slider-viewport');
    var prev = slider.querySelector('.slider-btn-prev');
    var next = slider.querySelector('.slider-btn-next');
    if (!viewport || !prev || !next) return;

    var rafId = null;
    var ticking = false;

    function slideWidth() {
      return viewport.clientWidth;
    }
    function maxScroll() {
      return viewport.scrollWidth - viewport.clientWidth;
    }
    function updateButtons() {
      var max = maxScroll();
      prev.disabled = viewport.scrollLeft <= 1;
      next.disabled = viewport.scrollLeft >= max - 1;
    }
    function animateTo(target) {
      var max = maxScroll();
      target = Math.max(0, Math.min(target, max));
      var start = viewport.scrollLeft;
      var delta = target - start;
      if (Math.abs(delta) < 1) return;
      var duration = Math.min(500, 240 + Math.abs(delta) * 0.4);
      var t0 = performance.now();
      cancelAnimationFrame(rafId);
      function tick(now) {
        var t = Math.min((now - t0) / duration, 1);
        var e = 1 - Math.pow(1 - t, 3); /* ease-out cubic */
        viewport.scrollLeft = start + delta * e;
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          updateButtons();
        }
      }
      rafId = requestAnimationFrame(tick);
    }
    function step(dir) {
      animateTo(viewport.scrollLeft + dir * slideWidth());
    }

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });

    viewport.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { updateButtons(); ticking = false; });
      }
    }, { passive: true });

    window.addEventListener('resize', updateButtons);
    updateButtons();
  });
})();
