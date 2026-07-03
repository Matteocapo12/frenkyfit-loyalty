function updatePageText() {
  const el = id => document.getElementById(id);
  if (el('labelName')) el('labelName').textContent = t('loginName');
  if (el('labelEmail')) el('labelEmail').textContent = t('loginEmail');
  if (el('loginBtn')) el('loginBtn').textContent = t('loginTitle');
  if (el('loginFooter')) el('loginFooter').textContent = t('loginFooter');
  if (el('name')) el('name').placeholder = t('loginPlaceholder');
  if (el('email')) el('email').placeholder = t('emailPlaceholder');
  if (el('loadingText')) el('loadingText').textContent = t('loadingCard');
}

let updateDynamicText = updatePageText;

async function handleLogin() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const error = document.getElementById('errorMsg');
  const btn = document.getElementById('loginBtn');
  const form = document.getElementById('loginForm');
  const loading = document.getElementById('loadingState');

  error.style.display = 'none';

  if (!name || !email) {
    error.textContent = t('loginError');
    error.style.display = 'block';
    return;
  }

  if (!email.includes('@')) {
    error.textContent = t('loginErrorEmail');
    error.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = t('loginLoading');
  form.classList.add('hidden');
  loading.classList.remove('hidden');

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || t('sessionExpired'));
    }

    localStorage.setItem('frenkyfit_token', data.token);
    localStorage.setItem('frenkyfit_user', JSON.stringify(data.user));
    window.location.href = '/card';
  } catch (err) {
    form.classList.remove('hidden');
    loading.classList.add('hidden');
    error.textContent = err.message;
    error.style.display = 'block';
    btn.disabled = false;
    btn.textContent = t('loginTitle');
  }
}

document.getElementById('name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('email').focus();
});

document.getElementById('email').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langSelector').appendChild(createLangSelector());
  updatePageText();
});
