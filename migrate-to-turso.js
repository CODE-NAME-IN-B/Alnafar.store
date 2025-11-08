// سكريبت لنقل البيانات من SQLite المحلي إلى Turso
require('dotenv').config({ path: '.env.render' });
const { createClient } = require('@libsql/client');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function migrateToTurso() {
  console.log('🚀 بدء نقل البيانات من SQLite إلى Turso...\n');

  // 1. قراءة قاعدة البيانات المحلية
  console.log('📖 قراءة قاعدة البيانات المحلية...');
  const SQL = await initSqlJs();
  const DB_PATH = path.join(__dirname, 'backend/data/database.sqlite');
  
  if (!fs.existsSync(DB_PATH)) {
    console.error('❌ لم يتم العثور على قاعدة البيانات المحلية!');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(DB_PATH);
  const localDb = new SQL.Database(fileBuffer);

  // 2. الاتصال بـ Turso
  console.log('🌐 الاتصال بـ Turso...');
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });

  try {
    // 3. إنشاء الجداول في Turso
    console.log('📋 إنشاء الجداول في Turso...');
    
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category_id INTEGER,
        genre TEXT,
        series TEXT,
        features TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        games TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        whatsapp_number TEXT,
        default_message TEXT,
        telegram_bot_token TEXT,
        telegram_chat_id TEXT,
        telegram_username TEXT,
        telegram_enabled INTEGER DEFAULT 0,
        communication_method TEXT DEFAULT 'telegram'
      )`,
      `CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        items TEXT NOT NULL,
        total REAL NOT NULL,
        discount REAL DEFAULT 0,
        final_total REAL,
        status TEXT DEFAULT 'completed',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        printed_at DATETIME,
        print_count INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS invoice_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT DEFAULT 'الشارده للإلكترونيات',
        store_name_english TEXT DEFAULT 'Alnafar Store',
        store_address TEXT DEFAULT 'شارع القضائيه مقابل مطحنة الفضيل',
        store_phone TEXT DEFAULT '0920595447',
        store_email TEXT DEFAULT 'info@alnafar.store',
        store_website TEXT DEFAULT '',
        footer_message TEXT DEFAULT 'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
        invoice_title TEXT DEFAULT 'فاتورة مبيعات',
        show_logo INTEGER DEFAULT 1,
        show_qr INTEGER DEFAULT 1,
        paper_width INTEGER DEFAULT 58,
        font_size TEXT DEFAULT 'large'
      )`,
      `CREATE TABLE IF NOT EXISTS daily_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        total_invoices INTEGER DEFAULT 0,
        total_revenue REAL DEFAULT 0,
        total_discount REAL DEFAULT 0,
        net_revenue REAL DEFAULT 0,
        is_closed BOOLEAN DEFAULT 0,
        closed_at DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await tursoClient.execute(sql);
    }
    console.log('✅ تم إنشاء الجداول بنجاح\n');

    // 4. نقل البيانات
    const tablesToMigrate = ['categories', 'games', 'users', 'settings', 'invoices', 'invoice_settings'];
    
    for (const table of tablesToMigrate) {
      console.log(`📦 نقل بيانات جدول ${table}...`);
      
      // قراءة البيانات من SQLite المحلي
      const stmt = localDb.prepare(`SELECT * FROM ${table}`);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      if (rows.length === 0) {
        console.log(`   ⚠️  لا توجد بيانات في جدول ${table}`);
        continue;
      }

      // إدراج البيانات في Turso
      for (const row of rows) {
        const columns = Object.keys(row).filter(k => k !== 'id');
        const values = columns.map(col => row[col]);
        const placeholders = columns.map(() => '?').join(', ');
        
        const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        try {
          await tursoClient.execute({
            sql: insertSql,
            args: values
          });
        } catch (err) {
          console.error(`   ❌ خطأ في إدراج صف: ${err.message}`);
        }
      }
      
      console.log(`   ✅ تم نقل ${rows.length} صف من ${table}\n`);
    }

    console.log('🎉 تم نقل جميع البيانات بنجاح إلى Turso!');
    console.log('\n📝 الخطوات التالية:');
    console.log('1. افتح Render Dashboard');
    console.log('2. اذهب إلى Environment Variables');
    console.log('3. أضف المتغيرات من ملف .env.render');
    console.log('4. أعد نشر التطبيق\n');

  } catch (error) {
    console.error('❌ خطأ في النقل:', error);
    process.exit(1);
  } finally {
    localDb.close();
  }
}

migrateToTurso().catch(console.error);
