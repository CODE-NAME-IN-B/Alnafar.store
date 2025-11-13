// محول قاعدة البيانات - يدعم SQLite المحلي (للتطوير) و Turso (للإنتاج المجاني)
const fs = require('fs');
const path = require('path');

let dbClient = null;
let dbType = 'local'; // 'local' or 'turso'

// تهيئة قاعدة البيانات حسب البيئة
async function initDatabase() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

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
        result.columns.forEach((col, i) => {
          // استخدام الاسم الأصلي وأيضاً نسخة بأحرف صغيرة للتوافق
          const colName = col;
          obj[colName] = row[i];
          // إضافة نسخة بأحرف صغيرة إذا كانت مختلفة
          if (colName !== colName.toLowerCase()) {
            obj[colName.toLowerCase()] = row[i];
          }
        });
        return obj;
      });
    } catch (error) {
      console.error('[DB] Turso query error:', error);
      console.error('[DB] SQL:', sql);
      console.error('[DB] Params:', params);
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
  return rows[0] || {};
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
    let usedExecuteMultiple = false;
    if (typeof dbClient.executeMultiple === 'function') {
      try {
        await dbClient.executeMultiple(sql);
        usedExecuteMultiple = true;
      } catch (error) {
        console.warn('[DB] Turso executeMultiple failed, falling back to sequential exec:', error?.message || error);
      }
    }

    if (usedExecuteMultiple) {
      return;
    }

    // Fallback: تقسيم الاستعلامات وتنفيذها واحداً تلو الآخر مع تتبع الأخطاء
    const statements = sql
      .split(';')
      .map(stmt => stmt.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim())
      .filter(Boolean);
    for (const trimmed of statements) {
      try {
        await dbClient.execute(trimmed);
      } catch (error) {
        const message = (error?.message || '').toLowerCase();
        if (message.includes('duplicate column name') || message.includes('already exists')) {
          console.warn('[DB] Turso statement skipped (already applied):', trimmed);
          continue;
        }
        console.error('[DB] Turso statement failed:', trimmed);
        console.error('[DB] Error:', error?.message || error);
        throw error;
      }
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
