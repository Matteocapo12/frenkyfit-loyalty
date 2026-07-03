const LANG = {
  it: {
    loginTitle: 'Accedi / Registrati', loginName: 'Nome', loginEmail: 'Email',
    loginPlaceholder: 'Il tuo nome', emailPlaceholder: 'la.tua@email.com',
    loginFooter: 'Ogni 10 consumazioni, 1 gratis!', loadingCard: 'Caricamento carta fedeltà...',
    stampTitle: 'Le Tue Consumazioni', qrTitle: 'Mostra questo QR allo staff',
    qrHint: 'Fai scannerizzare il QR al tablet della palestra per accumulare timbri',
    walletTitle: 'Aggiungi al Wallet', walletHome: 'Aggiungi alla Home',
    walletPhone: 'Salva sul telefono',
    freeTitle: 'CONSUMAZIONE GRATIS!', freeText: 'Hai completato la tua carta! Reclama il premio allo staff.',
    logout: 'Esci',
    staffBadge: 'Staff', scanHint: 'Inquadra il QR code sulla carta del socio',
    addStamp: '+ Aggiungi Timbro', newCard: 'Nuova Carta (resetta)', scanAnother: 'Scansiona un altro QR',
    cardCompleteStaff: 'CARTA COMPLETA!', cardCompleteText: 'Il socio ha diritto a una consumazione gratis!',
    addHomeTitle: 'Aggiungi a Schermata Home',
    addHomeText: 'Apri il menu Condividi (icona quadrato con freccia) e scegli "Aggiungi a Schermata Home".',
    addHomeOk: 'Ho capito',
    rewardMsg: 'HAI VINTO UNA CONSUMAZIONE GRATIS!',
    installBanner: 'Aggiungi FrenkyFit alla schermata Home per usarlo come un\'app',
    installBtn: 'Aggiungi',
  },
  en: {
    loginTitle: 'Login / Register', loginName: 'Name', loginEmail: 'Email',
    loginPlaceholder: 'Your name', emailPlaceholder: 'your.email@email.com',
    loginFooter: 'Every 10 purchases, 1 free!', loadingCard: 'Loading loyalty card...',
    stampTitle: 'Your Purchases', qrTitle: 'Show this QR to the staff',
    qrHint: 'Have the gym tablet scan the QR to collect stamps',
    walletTitle: 'Add to Wallet', walletHome: 'Add to Home Screen',
    walletPhone: 'Save to your phone',
    freeTitle: 'FREE PURCHASE!', freeText: 'You completed your card! Claim your reward at the counter.',
    logout: 'Log out',
    staffBadge: 'Staff', scanHint: 'Point at the QR code on the member\'s card',
    addStamp: '+ Add Stamp', newCard: 'New Card (reset)', scanAnother: 'Scan another QR',
    cardCompleteStaff: 'CARD COMPLETE!', cardCompleteText: 'This member is entitled to a free purchase!',
    addHomeTitle: 'Add to Home Screen',
    addHomeText: 'Open the Share menu (square with arrow icon) and tap "Add to Home Screen".',
    addHomeOk: 'Got it',
    rewardMsg: 'YOU WON A FREE PURCHASE!',
    installBanner: 'Add FrenkyFit to your Home Screen to use it as an app',
    installBtn: 'Add',
  },
  es: {
    loginTitle: 'Iniciar Sesión / Registrarse', loginName: 'Nombre', loginEmail: 'Correo',
    loginPlaceholder: 'Tu nombre', emailPlaceholder: 'tu.correo@email.com',
    loginFooter: '¡Cada 10 consumiciones, 1 gratis!', loadingCard: 'Cargando tarjeta de fidelidad...',
    stampTitle: 'Tus Consumiciones', qrTitle: 'Muestra este QR al personal',
    qrHint: 'Haz que escaneen el QR en la tablet del gimnasio para acumular sellos',
    walletTitle: 'Añadir al Monedero', walletHome: 'Añadir a la Pantalla de Inicio',
    walletPhone: 'Guardar en tu teléfono',
    freeTitle: '¡CONSUMICIÓN GRATIS!', freeText: '¡Completaste tu tarjeta! Reclama tu premio en el mostrador.',
    logout: 'Cerrar sesión',
    staffBadge: 'Personal', scanHint: 'Apunta al código QR en la tarjeta del socio',
    addStamp: '+ Añadir Sello', newCard: 'Nueva Tarjeta (reiniciar)', scanAnother: 'Escanear otro QR',
    cardCompleteStaff: '¡TARJETA COMPLETA!', cardCompleteText: '¡Este socio tiene derecho a una consumición gratis!',
    addHomeTitle: 'Añadir a Pantalla de Inicio',
    addHomeText: 'Abre el menú Compartir (icono cuadrado con flecha) y elige "Añadir a Pantalla de Inicio".',
    addHomeOk: 'Entendido',
    rewardMsg: '¡GANASTE UNA CONSUMICIÓN GRATIS!',
    installBanner: 'Añade FrenkyFit a tu Pantalla de Inicio para usarlo como una app',
    installBtn: 'Añadir',
  }
};

let currentLang = localStorage.getItem('frenkyfit_lang') || 'it';

function t(key) {
  return LANG[currentLang]?.[key] || LANG.it[key] || key;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('frenkyfit_lang', lang);
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.style.borderColor = b.dataset.lang === lang ? 'var(--red)' : 'transparent';
  });
  updatePageText();
  updateDynamicText?.();
}

function createLangSelector() {
  const d = document.createElement('div');
  d.style.cssText = 'display:flex;justify-content:center;gap:6px;margin-top:12px;';
  ['it','en','es'].forEach(c => {
    const b = document.createElement('button');
    b.className = 'lang-btn';
    b.dataset.lang = c;
    b.textContent = c === 'it' ? '🇮🇹' : c === 'en' ? '🇬🇧' : '🇪🇸';
    b.style.cssText = `font-size:18px;background:none;border:2px solid ${currentLang === c ? 'var(--red)' : 'transparent'};border-radius:50%;cursor:pointer;width:32px;height:32px;display:flex;align-items:center;justify-content:center;transition:border-color 0.2s;`;
    b.title = c.toUpperCase();
    b.onclick = () => setLang(c);
    d.appendChild(b);
  });
  return d;
}
