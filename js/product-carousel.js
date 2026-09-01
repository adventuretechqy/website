/* Product carousel: arrow buttons + smooth rAF scrolling.
   Shared by the material detail pages' "Related Products" sections.
   Logic mirrors the homepage carousel (index.html inline script). */
(function () {
  'use strict';
  var carousels = document.querySelectorAll('.product-carousel');
  if (!carousels.length) return;

  Array.prototype.forEach.call(carousels, function (carousel) {
    var viewport = carousel.querySelector('.carousel-viewport');
    var prev = carousel.querySelector('.carousel-btn-prev');
    var next = carousel.querySelector('.carousel-btn-next');
    if (!viewport || !prev || !next) return;

    var GAP = 24;
    var rafId = null;
    var ticking = false;

    function cardWidth() {
      var card = viewport.querySelector('.product-card');
      return card ? card.getBoundingClientRect().width + GAP : viewport.clientWidth;
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
      var duration = Math.min(600, 260 + Math.abs(delta) * 0.5);
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
      animateTo(viewport.scrollLeft + dir * cardWidth());
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
