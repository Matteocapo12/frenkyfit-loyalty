const Database = require('better-sqlite3');
const { Pool } = require('pg');
const path = require('path');

let db;
let isPg = false;

async function init() {
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        card_code TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stamps (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        staff_token TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS free_rewards (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db = pool;
    isPg = true;
    console.log('📦 Connesso a PostgreSQL');
  } else {
    const s = new Database(path.join(__dirname, 'frenkyfit.db'));
    s.pragma('journal_mode = WAL');
    s.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        card_code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS stamps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        staff_token TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS free_rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    db = s;
    isPg = false;
    console.log('📦 Connesso a SQLite');
  }
}

function q(sql, params) {
  if (isPg) {
    let i = 0;
    return sql.replace(/\?/g, () => `$${++i}`);
  }
  return sql;
}

async function get(sql, params = []) {
  if (isPg) {
    const r = await db.query(q(sql), params);
    return r.rows[0] || null;
  }
  return db.prepare(sql).get(...params) || null;
}

async function all(sql, params = []) {
  if (isPg) {
    const r = await db.query(q(sql), params);
    return r.rows;
  }
  return db.prepare(sql).all(...params);
}

async function run(sql, params = []) {
  if (isPg) {
    await db.query(q(sql), params);
  } else {
    db.prepare(sql).run(...params);
  }
}

async function getCount(sql, params = []) {
  if (isPg) {
    const r = await db.query(q(sql), params);
    return parseInt(r.rows[0].count);
  }
  return db.prepare(sql).get(...params).count;
}

module.exports = { init, get, all, run, getCount };
