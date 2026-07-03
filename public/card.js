const API = '';
let deferredPrompt = null;

function updatePageText() {
  const el = id => document.getElementById(id);
  if (el('stampSectionTitle')) el('stampSectionTitle').textContent = t('stampTitle');
  if (el('qrTitle')) el('qrTitle').textContent = t('qrTitle');
  if (el('qrHint')) el('qrHint').textContent = t('qrHint');
  if (el('walletTitle')) el('walletTitle').textContent = t('walletTitle');
  if (el('walletHomeText')) el('walletHomeText').textContent = t('walletHome');
  if (el('walletPhoneText')) el('walletPhoneText').textContent = t('walletPhone');
  if (el('freeTitle')) el('freeTitle').textContent = '🎉 ' + t('freeTitle');
  if (el('freeText')) el('freeText').textContent = t('freeText');
  if (el('logoutBtn')) el('logoutBtn').textContent = t('logout');
  if (el('loadingCardText')) el('loadingCardText').textContent = t('loadingCard');
  if (el('installBannerText')) el('installBannerText').textContent = t('installBanner');
  if (el('doInstall')) el('doInstall').textContent = t('installBtn');
}

let updateDynamicText = updatePageText;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  if (btn) btn.style.display = 'flex';
});

function showInstallPrompt() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => {
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
  });
}

function dismissInstallBanner() {
  document.getElementById('installBanner').classList.remove('show');
}

function showWalletInstructions() {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.8);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 24px;
  `;
  el.innerHTML = `
    <div style="background:#1a1a1a;border-radius:24px;padding:32px;max-width:340px;text-align:center;border:1px solid #2a2a2a;">
      <div style="font-size:48px;margin-bottom:16px;">📱</div>
      <h3 style="margin-bottom:12px;font-size:18px;">${t('addHomeTitle')}</h3>
      <p style="color:#888;font-size:14px;line-height:1.6;margin-bottom:20px;">
        ${t('addHomeText')}
      </p>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background:#e63946;color:white;border:none;padding:12px 32px;
        border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;
      ">${t('addHomeOk')}</button>
    </div>
  `;
  document.body.appendChild(el);
}

async function loadCard() {
  const token = localStorage.getItem('frenkyfit_token');
  if (!token) { window.location.href = '/login'; return; }

  try {
    const [userRes, qrRes] = await Promise.all([
      fetch(`${API}/api/user/card`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API}/api/user/qr`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    if (!userRes.ok || !qrRes.ok) {
      throw new Error(t('sessionExpired'));
    }

    const userData = await userRes.json();
    const qrData = await qrRes.json();

    renderCard(userData, qrData);
  } catch (err) {
    console.error(err);
    localStorage.removeItem('frenkyfit_token');
    localStorage.removeItem('frenkyfit_user');
    window.location.href = '/login';
  }
}

function renderCard(data, qrData) {
  const { user, stamps, freeCount } = data;
  const total = stamps;

  const stampsToShow = total % 10;
  const hasFree = total >= 10;

  const stampEls = document.querySelectorAll('.stamp');
  stampEls.forEach((el, i) => {
    el.classList.remove('active', 'free');
    if (hasFree) {
      el.className = 'stamp free';
      el.textContent = '🎉';
    } else if (i < stampsToShow) {
      el.classList.add('active');
      el.textContent = '✓';
    } else {
      el.textContent = String(i + 1).padStart(2, '0');
    }
  });

  const progress = hasFree ? 100 : (stampsToShow / 10) * 100;
  document.getElementById('progressFill').style.width = `${progress}%`;
  document.getElementById('stampCount').textContent = hasFree ? '10 / 10' : `${stampsToShow} / 10`;
  document.getElementById('stampProgress').textContent = hasFree ? '100%' : `${Math.round(progress)}%`;

  const freeBanner = document.getElementById('freeBanner');
  if (hasFree) {
    freeBanner.classList.remove('hidden');
    const prefix = freeCount > 1 ? `🎉 ${freeCount}x ` : '🎉 ';
    document.getElementById('freeTitle').textContent = prefix + t('freeTitle');
    document.getElementById('freeText').textContent = t('freeText');
  } else {
    freeBanner.classList.add('hidden');
  }

  document.getElementById('qrImage').src = qrData.qr;

  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('cardContent').classList.remove('hidden');

  if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window === false) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !navigator.standalone) {
      setTimeout(() => document.getElementById('installBanner').classList.add('show'), 2000);
    }
  }
}

function handleLogout() {
  localStorage.removeItem('frenkyfit_token');
  localStorage.removeItem('frenkyfit_user');
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langSelectorCard').appendChild(createLangSelector());
  updatePageText();
});

loadCard();
setInterval(loadCard, 30000);
