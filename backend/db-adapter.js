// محول قاعدة البيانات - يدعم SQLite المحلي (للتطوير) و Turso (للإنتاج المجاني)
const fs = require('fs');
const path = require('path');

let dbClient = null;
let dbType = 'local'; // 'local' or 'turso'

// تهيئة قاعدة البيانات حسب البيئة
async function initDatabase() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // On Vercel, Turso is required (local SQLite won't work on read-only filesystem)
  if (process.env.VERCEL && (!tursoUrl || !tursoToken)) {
    throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required on Vercel. Set them in your Vercel project settings.');
  }

  if (tursoUrl && tursoToken) {
    // استخدام Turso في الإنتاج
    console.log('🌐 Connecting to Turso cloud database...');
    const { createClient } = require('@libsql/client');
    
    dbClient = createClient({
      url: tursoUrl,
      authToken: tursoToken
    });
    
    dbType = 'turso';
    console.log('✅ Connected to Turso database');
  } else {
    // استخدام SQLite المحلي في التطوير
    console.log('💾 Using local SQLite database...');
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    
    const DATA_DIR = path.join(__dirname, 'data');
    const DB_PATH = path.join(DATA_DIR, 'database.sqlite');
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    const fileBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
    const db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
    
    dbClient = {
      db,
      SQL,
      DB_PATH,
      persist: () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
      }
    };
    
    dbType = 'local';
    console.log('✅ Local SQLite database ready');
  }
  
  return { all, get, run, exec, dbClient, dbType };
}

// تنفيذ استعلام SELECT (يُرجع صفوف متعددة)
async function all(sql, params = []) {
  if (dbType === 'turso') {
    try {
      const result = await dbClient.execute({ sql, args: params });
      return result.rows.map(row => {
        const obj = {};
        // Robust mapping: handle both named columns and indexed columns
        result.columns.forEach((col, i) => {
          // Check for named property first, then index
          if (typeof row[col] !== 'undefined') obj[col] = row[col];
          else if (typeof row[i] !== 'undefined') obj[col] = row[i];
          else obj[col] = null;
        });
        return obj;
      });
    } catch (error) {
      console.error(`[DB] Query failed: ${sql}`, error.message);
      throw error;
    }
  } else {
    // SQLite المحلي
    const stmt = dbClient.db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) rows.push(stmt.getAsObject());
    stmt.free();
    return rows;
  }
}

// تنفيذ استعلام SELECT (يُرجع صف واحد)
async function get(sql, params = []) {
  const rows = await all(sql, params);
  return rows[0] || null;
}

// تنفيذ استعلام INSERT/UPDATE/DELETE
async function run(sql, params = []) {
  if (dbType === 'turso') {
    await dbClient.execute({ sql, args: params });
  } else {
    // SQLite المحلي
    dbClient.db.run(sql, params);
    dbClient.persist();
  }
}

// تنفيذ استعلامات متعددة (للإنشاء الأولي للجداول)
async function exec(sql) {
  if (dbType === 'turso') {
    // Turso executeMultiple is preferred, otherwise fallback to simple splitting
    try {
      if (typeof dbClient.executeMultiple === 'function') {
        await dbClient.executeMultiple(sql);
      } else {
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(Boolean);
        for (const s of statements) {
          await dbClient.execute(s);
        }
      }
    } catch (error) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        return; // Ignore common "already exists" errors in schema creation
      }
      console.error('[DB] exec error:', error.message);
      throw error;
    }
  } else {
    // SQLite المحلي
    dbClient.db.exec(sql);
    dbClient.persist();
  }
}

module.exports = {
  initDatabase,
  all,
  get,
  run,
  exec,
  getDbType: () => dbType,
  getDbClient: () => dbClient
};
