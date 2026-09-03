/* Mobile navigation: close the menu after a link is tapped, or when tapping outside it. */
(function () {
  var toggle = document.getElementById('nav-toggle');
  if (!toggle) return;

  var nav = document.querySelector('.main-nav');
  var hamburger = document.querySelector('.hamburger');

  function close() {
    toggle.checked = false;
  }

  /* 1) Close after tapping any link inside the menu (covers same-page anchors). */
  if (nav) {
    nav.addEventListener('click', function (e) {
      var link = e.target && e.target.closest ? e.target.closest('a') : null;
      if (link) close();
    });
  }

  /* 2) Close when tapping anywhere outside the menu and the hamburger button. */
  document.addEventListener('click', function (e) {
    if (!toggle.checked) return;
    if (e.target === toggle) return; // label 合成触发的 checkbox 点击，忽略，避免误关
    if (nav && nav.contains(e.target)) return;
    if (hamburger && hamburger.contains(e.target)) return;
    close();
  });
})();
