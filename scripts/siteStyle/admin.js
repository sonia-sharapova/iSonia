(function () {
  fetch('/admin/check-session.php')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var btn = document.createElement('a');
      btn.id = 'admin-sidebar-btn';
      btn.textContent = data.admin ? 'ADMIN LOGOUT (moi)' : 'ADMIN LOGIN (moi)';
      btn.href = data.admin
        ? '/admin/logout.php'
        : '/admin/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      document.body.appendChild(btn);
    })
    .catch(function () {});
})();
