(function () {
  function renderAdminLink(isAdmin) {
    var text = isAdmin ? 'ADMIN LOGOUT (moi)' : 'ADMIN LOGIN (moi)';
    var href = isAdmin
      ? '/admin/logout.php'
      : '/admin/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);

    ['admin-link-area', 'admin-link-mobile'].forEach(function (id) {
      var area = document.getElementById(id);
      if (!area) return;
      var a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      area.appendChild(a);
    });
  }

  fetch('/admin/check-session.php')
    .then(function (r) { return r.json(); })
    .then(function (data) { renderAdminLink(data.admin); })
    .catch(function () { renderAdminLink(false); });
})();