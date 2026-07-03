const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'frenkyfit-secret-2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token non valido' });
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome ed email richiesti' });
  }

  const existing = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (existing) {
    const token = jwt.sign({ id: existing.id, name: existing.name, email: existing.email }, JWT_SECRET, { expiresIn: '365d' });
    const stamps = await db.getCount('SELECT COUNT(*) as count FROM stamps WHERE user_id = ?', [existing.id]);
    const freeCount = await db.getCount('SELECT COUNT(*) as count FROM free_rewards WHERE user_id = ?', [existing.id]);
    return res.json({ user: existing, stamps, freeCount, token, existing: true });
  }

  const id = uuidv4();
  const cardCode = 'FRK-' + id.slice(0, 8).toUpperCase();
  await db.run('INSERT INTO users (id, name, email, card_code) VALUES (?, ?, ?, ?)', [id, name, email, cardCode]);

  const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: '365d' });
  const user = { id, name, email, card_code: cardCode };
  res.json({ user, stamps: 0, freeCount: 0, token, existing: false });
});

app.get('/api/user/card', authenticate, async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const stamps = await db.getCount('SELECT COUNT(*) as count FROM stamps WHERE user_id = ?', [user.id]);
  const freeCount = await db.getCount('SELECT COUNT(*) as count FROM free_rewards WHERE user_id = ?', [user.id]);
  const stampList = await db.all('SELECT * FROM stamps WHERE user_id = ? ORDER BY created_at DESC', [user.id]);
  const lastFree = await db.get('SELECT * FROM free_rewards WHERE user_id = ? ORDER BY claimed_at DESC LIMIT 1', [user.id]);

  res.json({ user, stamps, freeCount, stampsTotal: stamps + freeCount * 10, stampList, lastFree });
});

app.get('/api/user/qr', authenticate, async (req, res) => {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const qrData = JSON.stringify({ card: user.card_code, id: user.id });
  const qr = await QRCode.toDataURL(qrData, { color: { dark: '#000000', light: '#ffffff' } });
  res.json({ qr, cardCode: user.card_code });
});

app.post('/api/staff/scan', async (req, res) => {
  const { qrData, staffToken } = req.body;
  if (!qrData || !staffToken) {
    return res.status(400).json({ error: 'Dati QR e token staff richiesti' });
  }

  let parsed;
  try {
    parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
  } catch {
    return res.status(400).json({ error: 'QR code non valido' });
  }

  const user = await db.get('SELECT * FROM users WHERE id = ? OR card_code = ?', [parsed.id, parsed.card]);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const stamps = await db.getCount('SELECT COUNT(*) as count FROM stamps WHERE user_id = ?', [user.id]);

  res.json({
    user: { id: user.id, name: user.name, email: user.email, card_code: user.card_code },
    stamps,
    canStamp: stamps < 10,
    isFree: stamps >= 10
  });
});

app.post('/api/staff/add-stamp', async (req, res) => {
  const { userId, staffToken } = req.body;
  if (!userId || !staffToken) {
    return res.status(400).json({ error: 'userId e staffToken richiesti' });
  }

  if (staffToken !== 'frenkyfit-staff-2024') {
    return res.status(403).json({ error: 'Token staff non valido' });
  }

  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const stamps = await db.getCount('SELECT COUNT(*) as count FROM stamps WHERE user_id = ?', [user.id]);

  if (stamps >= 10) {
    return res.status(400).json({ error: 'Carta già piena! Reclama il premio prima.', isFull: true });
  }

  await db.run('INSERT INTO stamps (user_id, staff_token) VALUES (?, ?)', [userId, staffToken]);

  const newStamps = stamps + 1;
  let reward = null;

  if (newStamps >= 10) {
    await db.run('INSERT INTO free_rewards (user_id) VALUES (?)', [userId]);
    reward = { message: '🎉 HAI VINTO UNA CONSUMAZIONE GRATIS!' };
  }

  res.json({ stamps: newStamps, reward, isFree: newStamps >= 10 });
});

app.post('/api/staff/reset-card', async (req, res) => {
  const { userId, staffToken } = req.body;
  if (!userId || !staffToken) {
    return res.status(400).json({ error: 'userId e staffToken richiesti' });
  }

  if (staffToken !== 'frenkyfit-staff-2024') {
    return res.status(403).json({ error: 'Token staff non valido' });
  }

  await db.run('DELETE FROM stamps WHERE user_id = ?', [userId]);
  await db.run('DELETE FROM free_rewards WHERE user_id = ?', [userId]);

  res.json({ stamps: 0, message: 'Carta resettata' });
});

app.get('/api/staff/stats', async (req, res) => {
  const { staffToken } = req.query;
  if (staffToken !== 'frenkyfit-staff-2024') {
    return res.status(403).json({ error: 'Token staff non valido' });
  }

  const totalUsers = await db.getCount('SELECT COUNT(*) as count FROM users');
  const totalStamps = await db.getCount('SELECT COUNT(*) as count FROM stamps');
  const totalFree = await db.getCount('SELECT COUNT(*) as count FROM free_rewards');

  res.json({ totalUsers, totalStamps, totalFree });
});

function noCache(req, res, next) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
}

app.get('/login', noCache, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/card', noCache, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

app.get('/staff', noCache, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

db.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏋️ FrenkyFit server attivo su http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Errore database:', err);
  process.exit(1);
});
