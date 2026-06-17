(function () {
  fetch('/admin/check-session.php')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var footer = document.querySelector('footer');
      if (!footer) return;
      var btn = document.createElement('a');
      btn.className = 'admin-footer-btn';
      if (data.admin) {
        btn.href = '/admin/logout.php';
        btn.textContent = 'Admin ↗';
        btn.title = 'Log out';
      } else {
        btn.href = '/admin/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        btn.textContent = 'Admin';
        btn.title = 'Admin login';
      }
      footer.appendChild(btn);
    })
    .catch(function () {});
})();
