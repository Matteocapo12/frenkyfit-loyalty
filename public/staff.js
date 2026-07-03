const STAFF_TOKEN = 'frenkyfit-staff-2024';
const API = '';

let html5QrCode = null;
let currentUser = null;
let currentStamps = 0;

function updatePageText() {
  const el = id => document.getElementById(id);
  if (el('staffBadge')) el('staffBadge').textContent = t('staffBadge');
  if (el('scanHint')) el('scanHint').innerHTML = t('scanHint');
  if (el('addStampBtn')) el('addStampBtn').textContent = t('addStamp');
  if (el('resetBtn')) el('resetBtn').textContent = '🆕 ' + t('newCard');
  if (el('scanAnotherBtn')) el('scanAnotherBtn').textContent = t('scanAnother');
  if (el('scannedFreeTitle')) el('scannedFreeTitle').textContent = '🎉 ' + t('cardCompleteStaff');
  if (el('scannedFreeText')) el('scannedFreeText').textContent = t('cardCompleteText');
  const sb = document.getElementById('startScanBtn');
  if (sb) sb.textContent = '📷 ' + t('startScan');
}

let updateDynamicText = updatePageText;

function startScanner() {
  const btn = document.getElementById('startScanBtn');
  const reader = document.getElementById('reader');
  reader.innerHTML = '';
  btn.style.display = 'none';

  html5QrCode = new Html5Qrcode('reader');

  html5QrCode.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 300, height: 300 } },
    onScanSuccess,
    onScanFailure
  ).catch(() => {
    btn.style.display = 'block';
    btn.textContent = '📷 Tocca per avviare la fotocamera';
    reader.innerHTML = '';
  });
}

function onScanSuccess(decodedText) {
  if (html5QrCode) {
    html5QrCode.stop().catch(() => {});
  }

  let qrData;
  try {
    qrData = JSON.parse(decodedText);
  } catch {
    qrData = { card: decodedText, id: decodedText };
  }

  lookupUser(qrData);
}

function onScanFailure() {}

async function lookupUser(qrData) {
  const scannerContainer = document.getElementById('scannerContainer');
  const scanResult = document.getElementById('scanResult');

  try {
    const res = await fetch(`${API}/api/staff/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData, staffToken: STAFF_TOKEN })
    });

    const data = await res.json();

    if (!res.ok) {
      showStaffError(data.error || 'QR non valido');
      setTimeout(() => resetScanner(), 2000);
      return;
    }

    currentUser = data.user;
    currentStamps = data.stamps;

    scannerContainer.classList.add('hidden');
    scanResult.classList.remove('hidden');

    document.getElementById('scannedAvatar').textContent = data.user.name.charAt(0).toUpperCase();
    document.getElementById('scannedName').textContent = data.user.name;
    document.getElementById('scannedEmail').textContent = data.user.email;
    document.getElementById('scannedCode').textContent = `Codice: ${data.user.card_code}`;

    renderStaffStamps(data.stamps);

    const freeBanner = document.getElementById('scannedFreeBanner');
    const addBtn = document.getElementById('addStampBtn');
    const resetBtn = document.getElementById('resetBtn');

    if (data.isFree) {
      freeBanner.classList.remove('hidden');
      addBtn.disabled = true;
      addBtn.textContent = t('cardComplete');
      resetBtn.style.display = 'block';
    } else {
      freeBanner.classList.add('hidden');
      addBtn.disabled = false;
      addBtn.textContent = t('addStamp');
      resetBtn.style.display = 'none';
    }
  } catch (err) {
    showStaffError(t('errorConnection'));
    setTimeout(() => resetScanner(), 2000);
  }
}

function renderStaffStamps(stamps) {
  const row = document.getElementById('stampRow');
  row.innerHTML = '';

  const toShow = stamps % 10;
  const isFree = stamps >= 10;

  for (let i = 0; i < 10; i++) {
    const dot = document.createElement('div');
    dot.className = 'stamp-dot';
    if (isFree) {
      dot.classList.add('free');
      dot.textContent = '🎉';
    } else if (i < toShow) {
      dot.classList.add('active');
      dot.textContent = '✓';
    } else {
      dot.textContent = String(i + 1).padStart(2, '0');
    }
    row.appendChild(dot);
  }
}

async function addStamp() {
  if (!currentUser) return;
  const addBtn = document.getElementById('addStampBtn');
  const success = document.getElementById('staffSuccess');
  const error = document.getElementById('staffError');

  addBtn.disabled = true;
  addBtn.textContent = '...';
  success.style.display = 'none';
  error.style.display = 'none';

  try {
    const res = await fetch(`${API}/api/staff/add-stamp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, staffToken: STAFF_TOKEN })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.isFull) {
        showStaffSuccess('🎉 ' + t('cardCompleteStaff'));
        renderStaffStamps(10);
        document.getElementById('scannedFreeBanner').classList.remove('hidden');
        addBtn.disabled = true;
        addBtn.textContent = t('cardComplete');
        document.getElementById('resetBtn').style.display = 'block';
        return;
      }
      throw new Error(data.error || 'Errore');
    }

    currentStamps = data.stamps;
    renderStaffStamps(data.stamps);

    if (data.reward) {
      showStaffSuccess('🎉 ' + t('rewardMsg'));
      document.getElementById('scannedFreeBanner').classList.remove('hidden');
      addBtn.disabled = true;
      addBtn.textContent = t('cardComplete');
      document.getElementById('resetBtn').style.display = 'block';
    } else {
      showStaffSuccess(`✓ ${t('stampAdded')} (${data.stamps % 10 || 10}/10)`);
      addBtn.disabled = false;
      addBtn.textContent = t('addStamp');
    }
  } catch (err) {
    showStaffError(err.message);
    addBtn.disabled = false;
    addBtn.textContent = t('addStamp');
  }
}

async function resetCard() {
  if (!currentUser) return;
  if (!confirm(t('resetConfirm') + ' ' + currentUser.name + t('resetConfirmEnd'))) return;

  const btn = document.getElementById('resetBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(`${API}/api/staff/reset-card`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, staffToken: STAFF_TOKEN })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Errore');

    currentStamps = 0;
    renderStaffStamps(0);
    document.getElementById('scannedFreeBanner').classList.add('hidden');

    const addBtn = document.getElementById('addStampBtn');
    addBtn.disabled = false;
    addBtn.textContent = t('addStamp');
    document.getElementById('resetBtn').style.display = 'none';

    showStaffSuccess('✅ ' + t('cardReset'));
    btn.disabled = false;
    btn.textContent = '🆕 ' + t('newCard');
  } catch (err) {
    showStaffError(err.message);
    btn.disabled = false;
    btn.textContent = '🆕 ' + t('newCard');
  }
}

function resetScanner() {
  currentUser = null;
  currentStamps = 0;

  document.getElementById('scanResult').classList.add('hidden');
  document.getElementById('scannerContainer').classList.remove('hidden');
  document.getElementById('staffSuccess').style.display = 'none';
  document.getElementById('staffError').style.display = 'none';

  const btn = document.getElementById('startScanBtn');
  btn.style.display = 'block';
  btn.textContent = '📷 Avvia Scanner';
  document.getElementById('reader').innerHTML = '';
}

function showStaffSuccess(msg) {
  const el = document.getElementById('staffSuccess');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function showStaffError(msg) {
  const el = document.getElementById('staffError');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langSelectorStaff').appendChild(createLangSelector());
  document.getElementById('startScanBtn').addEventListener('click', startScanner);
  updatePageText();
});
