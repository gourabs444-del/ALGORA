(function () {
  const style = document.createElement('style');
  style.textContent = `
    .pa-account {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: 9999;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .pa-avatar-btn {
      width: 44px;
      height: 44px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.78);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.16);
      backdrop-filter: blur(20px);
      display: grid;
      place-items: center;
      padding: 3px;
      cursor: pointer;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }
    .pa-avatar-btn:hover {
      transform: translateY(-1px);
      border-color: rgba(37, 99, 235, 0.42);
      box-shadow: 0 20px 48px rgba(15, 23, 42, 0.2);
    }
    .pa-avatar-btn img {
      width: 100%;
      height: 100%;
      border-radius: inherit;
      object-fit: cover;
      display: block;
    }
    .pa-menu {
      position: absolute;
      top: 56px;
      right: 0;
      width: 282px;
      padding: 14px;
      border-radius: 24px;
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
      backdrop-filter: blur(24px);
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
      pointer-events: none;
      transition: opacity 180ms ease, transform 180ms ease;
    }
    .pa-account.is-open .pa-menu {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .pa-profile-card {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px;
      border-radius: 18px;
      background: rgba(248, 250, 252, 0.86);
    }
    .pa-profile-card img {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      object-fit: cover;
    }
    .pa-name {
      color: #0f172a;
      font-size: 14px;
      font-weight: 800;
      line-height: 1.25;
      margin: 0;
    }
    .pa-email {
      color: #64748b;
      font-size: 12px;
      line-height: 1.35;
      margin: 3px 0 0;
      word-break: break-word;
    }
    .pa-links {
      display: grid;
      gap: 6px;
      margin-top: 10px;
    }
    .pa-link,
    .pa-signout {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 42px;
      padding: 0 12px;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: #334155;
      text-decoration: none;
      font-size: 13px;
      font-weight: 750;
      cursor: pointer;
      transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
    }
    .pa-link:hover {
      background: rgba(37, 99, 235, 0.08);
      color: #2563eb;
    }
    .pa-signout {
      width: 100%;
      color: #dc2626;
      margin-top: 8px;
      background: rgba(239, 68, 68, 0.08);
    }
    .pa-signout:hover {
      background: rgba(239, 68, 68, 0.14);
      transform: translateY(-1px);
    }
    .pa-guest .pa-profile-card {
      justify-content: center;
    }
    .pa-guest .pa-identity,
    .pa-guest .pa-auth-only {
      display: none;
    }
    .dark .pa-avatar-btn,
    html.dark .pa-avatar-btn {
      background: rgba(15, 23, 42, 0.78);
      border-color: rgba(71, 85, 105, 0.52);
    }
    .dark .pa-menu,
    html.dark .pa-menu {
      background: rgba(15, 23, 42, 0.94);
      border-color: rgba(51, 65, 85, 0.9);
    }
    .dark .pa-profile-card,
    html.dark .pa-profile-card {
      background: rgba(30, 41, 59, 0.72);
    }
    .dark .pa-name,
    html.dark .pa-name,
    .dark .pa-link,
    html.dark .pa-link {
      color: #f8fafc;
    }
    .dark .pa-email,
    html.dark .pa-email {
      color: #94a3b8;
    }
    @media (max-width: 680px) {
      .pa-account { top: 14px; right: 14px; }
      .pa-menu { width: min(282px, calc(100vw - 28px)); }
    }
  `;
  document.head.appendChild(style);

  const root = document.createElement('div');
  root.className = 'pa-account pa-guest';
  root.innerHTML = `
    <button class="pa-avatar-btn" type="button" aria-label="Open account menu" aria-expanded="false">
      <img class="pa-avatar" alt="" src="${window.PortfolioAuth ? window.PortfolioAuth.DEFAULT_AVATAR : ''}">
    </button>
    <div class="pa-menu" role="menu">
      <div class="pa-profile-card">
        <img class="pa-menu-avatar" alt="" src="${window.PortfolioAuth ? window.PortfolioAuth.DEFAULT_AVATAR : ''}">
        <div class="pa-identity">
          <p class="pa-name"></p>
          <p class="pa-email"></p>
        </div>
      </div>
      <div class="pa-links">
        <a class="pa-link pa-login-only" href="login.html">Sign In <span>-></span></a>
        <a class="pa-link pa-auth-only" href="profile.html">Profile <span>-></span></a>
        <a class="pa-link pa-auth-only" href="profile.html#settings">Settings <span>-></span></a>
        <a class="pa-link pa-auth-only" href="profile.html#account">Account <span>-></span></a>
        <button class="pa-signout pa-auth-only" type="button">Sign Out <span>-></span></button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const button = root.querySelector('.pa-avatar-btn');
  const avatar = root.querySelector('.pa-avatar');
  const menuAvatar = root.querySelector('.pa-menu-avatar');
  const nameEl = root.querySelector('.pa-name');
  const emailEl = root.querySelector('.pa-email');
  const signOut = root.querySelector('.pa-signout');
  const loginOnly = root.querySelector('.pa-login-only');

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  }

  button.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) setOpen(false);
  });

  signOut.addEventListener('click', async () => {
    if (!confirm('Sign out of your account?')) return;
    await window.PortfolioAuth.signOut();
    window.location.href = 'index.html';
  });

  function syncExistingProjectSidebar(user, profile) {
    const sidebarAvatar = document.getElementById('user-avatar-sidebar');
    const sidebarName = document.getElementById('user-name-sidebar') || document.querySelector('.mt-auto .text-on-surface');
    const sidebarPlan = document.querySelector('.mt-auto .text-primary, .mt-auto .text-secondary');
    if (!sidebarAvatar && !sidebarName && !sidebarPlan) return;

    if (user) {
      const photo = window.PortfolioAuth.getAvatar(profile, user);
      if (sidebarAvatar) sidebarAvatar.src = photo;
      if (sidebarName) sidebarName.innerText = profile.displayName || user.displayName || 'User';
      if (sidebarPlan) sidebarPlan.innerText = 'Authenticated';
    } else {
      if (sidebarAvatar) sidebarAvatar.src = window.PortfolioAuth.DEFAULT_AVATAR;
      if (sidebarName) sidebarName.innerText = 'Guest';
      if (sidebarPlan) sidebarPlan.innerText = 'Guest Account';
    }
  }

  window.PortfolioAuth.onAuthState(({ user, profile }) => {
    const photo = window.PortfolioAuth.getAvatar(profile, user);
    avatar.src = photo;
    menuAvatar.src = photo;
    root.classList.toggle('pa-guest', !user);
    loginOnly.style.display = user ? 'none' : 'flex';

    if (user) {
      nameEl.textContent = profile.displayName || user.displayName || 'User';
      emailEl.textContent = user.email || '';
    } else {
      nameEl.textContent = '';
      emailEl.textContent = '';
    }

    syncExistingProjectSidebar(user, profile);
  });
})();
