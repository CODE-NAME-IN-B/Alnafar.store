 
// تحميل .env أولاً قبل أي شيء!
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dbAdapter = require('./db-adapter');
const cloudinaryStorage = require('./cloudinary-storage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// const { analyzeGameGenre, batchAnalyzeGames, ARABIC_GENRES } = require('../arabic-genre-detector'); // تم إزالة الملف
const SunmiPrinter = require('./sunmi-printer');

// Initialize Gemini AI (بعد تحميل .env)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  console.log('[Gemini] ✅ Google Gemini AI initialized with API key');
} else {
  console.warn('[Gemini] ❌ GEMINI_API_KEY not set. Image recognition will not work.');
}

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// دالة للعثور على منفذ متاح
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const MAPPING_PATH = path.join(DATA_DIR, 'mapping.json');

// ensure mapping file exists
if (!fs.existsSync(MAPPING_PATH)) {
  fs.writeFileSync(MAPPING_PATH, JSON.stringify({}, null, 2));
}

// ---- Global Wikipedia helper and simple in-memory cache ----
const _wikiCache = new Map(); // key: title(lower), val: { match, extract }
async function wikiFindSummaryGlobal(queryStr) {
  try {
    if (!queryStr) return null;
    const key = String(queryStr).toLowerCase().trim();
    if (_wikiCache.has(key)) return _wikiCache.get(key);
    const sites = [
      { api: 'https://ar.wikipedia.org/w/api.php', summary: 'https://ar.wikipedia.org/api/rest_v1/page/summary/' },
      { api: 'https://en.wikipedia.org/w/api.php', summary: 'https://en.wikipedia.org/api/rest_v1/page/summary/' }
    ];
    for (const site of sites) {
      try {
        const sres = await axios.get(site.api, { params: { action: 'query', list: 'search', srsearch: queryStr, format: 'json', origin: '*' }, timeout: 6000 });
        const hits = sres.data?.query?.search || [];
        if (hits.length > 0) {
          const title = hits[0].title;
          try {
            const sum = await axios.get(site.summary + encodeURIComponent(title), { timeout: 6000 });
            if (sum?.data?.extract) {
              const out = { match: title, extract: sum.data.extract };
              _wikiCache.set(key, out);
              return out;
            }
          } catch {}
        }
      } catch {}
    }
    return null;
  } catch { return null; }
}

// دالة للتحقق من صحة اسم اللعبة باستخدام Wikipedia
async function verifyGameTitle(gameTitle) {
  try {
    // Try to find the game on Wikipedia (English and Arabic)
    const result = await wikiFindSummaryGlobal(gameTitle + ' video game');
    if (result && result.match) {
      // Clean up the Wikipedia title
      let cleanTitle = result.match;
      // Remove "(video game)" suffix if present
      cleanTitle = cleanTitle.replace(/\s*\(video game\)\s*$/i, '');
      cleanTitle = cleanTitle.replace(/\s*\(game\)\s*$/i, '');
      return cleanTitle;
    }
    return null;
  } catch (error) {
    console.error('[Verify] Error verifying game title:', error.message);
    return null;
  }
}

// دالة للتعرف على الألعاب من الصورة باستخدام Gemini Vision API
async function recognizeGameFromImage(imageBuffer) {
  if (!genAI) {
    console.error('[Gemini] ❌ API not initialized - GEMINI_API_KEY missing!');
    return null;
  }

  try {
    console.log('[Gemini] 🔍 Starting recognition... Image size:', imageBuffer.length, 'bytes');
    
    // استخدام gemini-2.5-flash (أحدث موديل يدعم الصور)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };

    const prompt = `You are a professional video game expert specializing in PlayStation 4 games. Analyze this game cover image carefully.

CRITICAL INSTRUCTIONS:
1. Identify the EXACT game title as it appears on the cover
2. Include the full title with subtitle if present (e.g., "Assassin's Creed: Valhalla" not just "Assassin's Creed")
3. Look for text on the cover, logos, and distinctive visual elements
4. For series games, include the number or subtitle (e.g., "FIFA 23", "God of War: Ragnarök")
5. Use proper English spelling and capitalization
6. If you're uncertain, return "Unknown"
7. Return ONLY the game title, no explanations or additional text

Game title:`;

    console.log('[Gemini] 📤 Sending request to Gemini API...');
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('[Gemini] 📥 Gemini response:', text);
    
    if (text && text !== 'Unknown' && text.length > 0 && text.length < 200) {
      // Verify the game title using Wikipedia
      const verified = await verifyGameTitle(text);
      if (verified) {
        console.log(`[Gemini] ✅ Successfully detected and verified game: ${verified}`);
        return {
          title: verified,
          confidence: 0.95
        };
      } else {
        console.log(`[Gemini] ⚠️ Could not verify game title: ${text}`);
        // Return the original title even if not verified
        return {
          title: text,
          confidence: 0.7
        };
      }
    }
    
    console.log('[Gemini] ⚠️ Could not identify game (response was:', text, ')');
    return null;
  } catch (error) {
    console.error('[Gemini] ❌ Error recognizing game:', error.message);
    console.error('[Gemini] Error details:', error);
    return null;
  }
}

function loadMapping() {
  try {
    const raw = fs.readFileSync(MAPPING_PATH, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function saveMapping(obj) {
  try {
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(obj, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// Normalize a mapping entry that could be a string or an object
function normalizeMapEntry(entry) {
  if (!entry) return null;
  if (typeof entry === 'string') return { title: entry, genre: null, series: null };
  const { title, genre = null, series = null } = entry || {};
  if (!title) return null;
  return { title, genre, series };
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Database functions - now using db-adapter
let all, get, run, exec;

async function initDb() {
  const { all: _all, get: _get, run: _run, exec: _exec } = await dbAdapter.initDatabase();
  all = _all;
  get = _get;
  run = _run;
  exec = _exec;
  console.log(`✅ Database initialized (${dbAdapter.getDbType()})`);
}

async function initializeDatabase() {
  await exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );`);
  try { await run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'admin'"); } catch (e) {}
  try { await run("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch (e) {}

  await exec(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );`);

  // Seed default categories if empty
  const catCount = (await get('SELECT COUNT(*) as count FROM categories')).count;
  if (catCount === 0) {
    const defaults = ['PS4','PS5','PS3','PC'];
    for (const n of defaults) {
      await run('INSERT INTO categories (name) VALUES (?)', [n]);
    }
  }

  await exec(`CREATE TABLE IF NOT EXISTS games (
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
    );`);

  // Migrate existing DBs to include new columns if missing
  try { await run('ALTER TABLE games ADD COLUMN genre TEXT'); } catch(e) {}
  try { await run('ALTER TABLE games ADD COLUMN series TEXT'); } catch(e) {}
  try { await run('ALTER TABLE games ADD COLUMN features TEXT'); } catch(e) {}

  await exec(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      games TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

  await exec(`CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_number TEXT,
      default_message TEXT,
      telegram_bot_token TEXT,
      telegram_chat_id TEXT,
      telegram_username TEXT,
      telegram_enabled BOOLEAN DEFAULT 0,
      communication_method TEXT DEFAULT 'telegram'
    );`);

  await exec(`CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      customer_notes TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      discount REAL DEFAULT 0,
      final_total REAL,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      printed_at DATETIME,
      print_count INTEGER DEFAULT 0
    );`);

  // Migrate existing DBs to include discount/final_total if missing
  try { await run('ALTER TABLE invoices ADD COLUMN discount REAL DEFAULT 0'); } catch (e) {}
  try { await run('ALTER TABLE invoices ADD COLUMN final_total REAL'); } catch (e) {}

  await exec(`CREATE TABLE IF NOT EXISTS invoice_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_name TEXT DEFAULT 'الشارده للإلكترونيات',
      store_name_english TEXT DEFAULT 'Alnafar Store',
      store_address TEXT DEFAULT 'شارع القضائيه مقابل مطحنة الفضيل',
      store_phone TEXT DEFAULT '0920595447',
      store_email TEXT DEFAULT 'info@alnafar.store',
      store_website TEXT DEFAULT '',
      footer_message TEXT DEFAULT 'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
      header_logo_text TEXT DEFAULT 'فاتورة مبيعات',
      show_store_info BOOLEAN DEFAULT 1,
      show_footer BOOLEAN DEFAULT 1,
      paper_width INTEGER DEFAULT 58,
      font_size TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);

  // جدول الفواتير اليومية لتتبع الترقيم اليومي
  await exec(`CREATE TABLE IF NOT EXISTS daily_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE, -- YYYY-MM-DD format
      last_invoice_number INTEGER DEFAULT 0,
      total_invoices INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      total_discount REAL DEFAULT 0,
      net_revenue REAL DEFAULT 0,
      is_closed BOOLEAN DEFAULT 0, -- للجرد اليومي
      closed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`);
  try { await run('ALTER TABLE daily_invoices ADD COLUMN notes TEXT'); } catch (e) {}

  // Seed default settings if empty
  const settingsCount = (await get('SELECT COUNT(*) as count FROM settings')).count;
  if (settingsCount === 0) {
  await run('INSERT INTO settings (whatsapp_number, default_message, telegram_bot_token, telegram_chat_id, telegram_username, telegram_enabled, communication_method) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    ['', 'مرحباً، أريد طلب الألعاب التالية:', '', '', '', 1, 'telegram']);

  // Seed default invoice settings if empty
  const invoiceSettingsCount = (await get('SELECT COUNT(*) as count FROM invoice_settings')).count;
  if (invoiceSettingsCount === 0) {
    await run(`INSERT INTO invoice_settings (
      store_name, store_name_english, store_address, store_phone, 
      store_email, store_website, footer_message, header_logo_text,
      show_store_info, show_footer, paper_width, font_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      'الشارجه للإلكترونيات',
      'Alnafar Store', 
      'شارع القضائيه مقابل مطحنة الفضيل',
      '0920595447',
      'info@alnafar.store',
      '',
      'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
      'فاتورة مبيعات',
      1, 1, 58, 'large'
    ]);
  }
  } else {
    // Update existing settings to add new columns if they don't exist
    try {
      const existing = get('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
      if (existing && !existing.telegram_bot_token) {
        await run('ALTER TABLE settings ADD COLUMN telegram_bot_token TEXT');
        await run('ALTER TABLE settings ADD COLUMN telegram_chat_id TEXT');
        await run('ALTER TABLE settings ADD COLUMN telegram_username TEXT');
        await run('ALTER TABLE settings ADD COLUMN telegram_enabled INTEGER DEFAULT 0');
        await run('ALTER TABLE settings ADD COLUMN communication_method TEXT DEFAULT "telegram"');
        await run('UPDATE settings SET telegram_enabled = 1, communication_method = "telegram" WHERE id = ?', [existing.id]);
      }
    } catch (e) {
      // Columns might already exist, ignore error
    }
  }

  // Seed admin user if none
  const userCount = (await get('SELECT COUNT(*) as count FROM users')).count;
  if (userCount === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hashed = bcrypt.hashSync(password, 10);
    await run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, 'admin']);
    console.log('Seeded admin user:', username);
  }
}

// initializeDatabase will be called after DB init in start()

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// تقارير بنطاق تاريخ
app.get('/api/daily-report-range', authMiddleware, (req, res) => {
  try {
    const start = (req.query.start || '').slice(0, 10);
    const end = ((req.query.end || start) || '').slice(0, 10);
    if (!start) return res.status(400).json({ success: false, message: 'start مطلوب' });
    const rows = all(`
      SELECT date, total_invoices, total_revenue, total_discount, net_revenue, is_closed, closed_at, COALESCE(notes,'') AS notes
      FROM daily_invoices
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `, [start, end]);
    const totals = rows.reduce((acc, r) => {
      acc.total_invoices += (r.total_invoices || 0);
      acc.total_revenue += (r.total_revenue || 0);
      acc.total_discount += (r.total_discount || 0);
      acc.net_revenue += (r.net_revenue || 0);
      return acc;
    }, { total_invoices: 0, total_revenue: 0, total_discount: 0, net_revenue: 0 });
    res.json({ success: true, range: { start, end, days: rows, totals } });
  } catch (e) {
    console.error('daily-report-range error:', e);
    res.status(500).json({ success: false, message: 'فشل في جلب تقارير النطاق', error: e.message });
  }
});

// تصدير CSV لنطاق تاريخ
app.get('/api/daily-report/export.csv', authMiddleware, (req, res) => {
  try {
    const start = (req.query.start || '').slice(0, 10);
    const end = ((req.query.end || start) || '').slice(0, 10);
    if (!start) return res.status(400).json({ message: 'start مطلوب' });
    const rows = all(`
      SELECT date, total_invoices, total_revenue, total_discount, net_revenue, is_closed, closed_at, COALESCE(notes,'') AS notes
      FROM daily_invoices
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
    `, [start, end]);
    function csvEscape(val) {
      const s = String(val == null ? '' : val).replace(/"/g, '""');
      return '"' + s + '"';
    }
    const header = ['date','total_invoices','total_revenue','total_discount','net_revenue','is_closed','closed_at','notes'];
    const lines = [header.join(',')].concat(rows.map(r => [
      r.date,
      r.total_invoices,
      r.total_revenue,
      r.total_discount,
      r.net_revenue,
      r.is_closed ? 1 : 0,
      r.closed_at || '',
      r.notes || ''
    ].map(csvEscape).join(',')));
    const csv = '\uFEFF' + lines.join('\n');
    const fname = `daily-report-${start}${start!==end?('_'+end):''}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.send(csv);
  } catch (e) {
    console.error('daily-report export error:', e);
    res.status(500).json({ message: 'فشل تصدير CSV', error: e.message });
  }
});

// Socket.IO للتحديثات الفورية
io.on('connection', (socket) => {
  console.log('🔌 عميل متصل:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 عميل منقطع:', socket.id);
  });
});

// دالة لإرسال التحديثات الفورية
function broadcastUpdate(event, data) {
  io.emit(event, data);
}

// دالة للتحقق من حالة قاعدة البيانات
function checkDatabaseHealth() {
  try {
    const result = get('SELECT 1 as test');
    return result && result.test === 1;
  } catch (error) {
    console.error('خطأ في التحقق من حالة قاعدة البيانات:', error);
    return false;
  }
}

// دالة للحصول على رقم الفاتورة اليومي التسلسلي (ذرية بدون معاملات يدوية)
async function getDailyInvoiceNumber() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todayNoDash = today.replace(/-/g, '');

  // تأكد من وجود سجل اليوم
  await run('INSERT OR IGNORE INTO daily_invoices (date, last_invoice_number, total_invoices) VALUES (?, 0, 0)', [today]);

  // احصل على آخر رقم فعلي في فواتير اليوم (لأغراض السجل فقط)
  const lastRow = await get(
    `SELECT MAX(CAST(substr(invoice_number, instr(invoice_number, '-') + 1) AS INTEGER)) AS last
     FROM invoices WHERE invoice_number LIKE ?`,
    [`${todayNoDash}-%`]
  );
  const lastFromInvoices = lastRow && lastRow.last ? parseInt(lastRow.last, 10) : 0;

  // زيادة ذرّية للعداد وإرجاع الرقم الجديد (آمن للتزامن)
  let ret;
  try {
    ret = await get('UPDATE daily_invoices SET last_invoice_number = last_invoice_number + 1, updated_at = CURRENT_TIMESTAMP WHERE date = ? RETURNING last_invoice_number', [today]);
  } catch (_) {
    // في حال عدم دعم RETURNING (بيئة SQLite قديمة)، استخدم تحديث ثم استعلام
    await run('UPDATE daily_invoices SET last_invoice_number = last_invoice_number + 1, updated_at = CURRENT_TIMESTAMP WHERE date = ?', [today]);
    ret = await get('SELECT last_invoice_number FROM daily_invoices WHERE date = ?', [today]);
  }
  const nextNumber = ret && ret.last_invoice_number ? parseInt(ret.last_invoice_number, 10) : (lastFromInvoices + 1);

  const formattedNumber = String(nextNumber).padStart(3, '0');
  const fullNumber = `${todayNoDash}-${formattedNumber}`;
  console.log(`✅ ترقيم اليوم ${today}: invoices=${lastFromInvoices} => النهائي ${fullNumber}`);
  return { dailyNumber: nextNumber, fullNumber };
}

// دالة لتحديث إحصائيات اليوم
function updateDailyStats(invoiceData) {
  const today = new Date().toISOString().split('T')[0];
  const { total, discount = 0 } = invoiceData;
  const netRevenue = total - discount;
  
  run(`UPDATE daily_invoices SET 
    total_invoices = total_invoices + 1,
    total_revenue = total_revenue + ?,
    total_discount = total_discount + ?,
    net_revenue = net_revenue + ?,
    updated_at = CURRENT_TIMESTAMP
    WHERE date = ?`, [total, discount, netRevenue, today]);
}

// إعادة احتساب إحصائيات الجرد اليومي من جدول الفواتير
function recomputeDailyStats(dateStr) {
  const date = dateStr || new Date().toISOString().split('T')[0];
  const agg = get(`
    SELECT 
      COUNT(*) AS total_invoices,
      COALESCE(SUM(total), 0) AS total_revenue,
      COALESCE(SUM(COALESCE(discount, 0)), 0) AS total_discount
    FROM invoices
    WHERE DATE(created_at) = ?
  `, [date]);
  const lastNum = get(`
    SELECT COALESCE(MAX(CAST(substr(invoice_number, 10) AS INTEGER)), 0) AS last
    FROM invoices
    WHERE DATE(created_at) = ?
  `, [date]);
  const net = (agg.total_revenue || 0) - (agg.total_discount || 0);
  const existing = get('SELECT * FROM daily_invoices WHERE date = ?', [date]);
  if (!existing || !existing.id) {
    run(`INSERT INTO daily_invoices (date, last_invoice_number, total_invoices, total_revenue, total_discount, net_revenue, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [date, lastNum.last || 0, agg.total_invoices || 0, agg.total_revenue || 0, agg.total_discount || 0, net]);
  } else {
    run(`UPDATE daily_invoices SET last_invoice_number = ?, total_invoices = ?, total_revenue = ?, total_discount = ?, net_revenue = ?, updated_at = CURRENT_TIMESTAMP WHERE date = ?`, [lastNum.last || 0, agg.total_invoices || 0, agg.total_revenue || 0, agg.total_discount || 0, net, date]);
  }
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// axios is already required above; use it to fetch descriptions

// Accept base64 uploads: { filename, data }
app.post('/api/uploads', async (req, res) => {
  const { filename, data } = req.body || {}
  if (!filename || !data) return res.status(400).json({ message: 'Missing file data' })
  try {
    // sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    // رفع إلى Cloudinary أو التخزين المحلي
    const result = await cloudinaryStorage.uploadBase64Image(data, safeName, 'games');
    
    res.json({ url: result.url })
  } catch (e) {
    console.error('upload error', e)
    res.status(500).json({ message: 'Upload failed', error: e.message })
  }
})

// health check محسن
app.get('/api/health', (req, res) => {
  const dbHealth = checkDatabaseHealth();
  const status = {
    ok: dbHealth,
    database: dbHealth ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  if (dbHealth) {
    res.json(status);
  } else {
    res.status(503).json(status);
  }
})

// التحقق من حالة ترقيم الفواتير
app.get('/api/invoice-numbering-status', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyRecord = get('SELECT * FROM daily_invoices WHERE date = ?', [today]);
    const lastInvoice = get('SELECT invoice_number, created_at FROM invoices ORDER BY created_at DESC LIMIT 1');
    
    res.json({
      success: true,
      today,
      dailyRecord: dailyRecord || null,
      lastInvoice: lastInvoice || null,
      nextNumber: dailyRecord ? (dailyRecord.last_invoice_number || 0) + 1 : 1,
      databaseHealth: checkDatabaseHealth()
    });
  } catch (error) {
    console.error('خطأ في فحص حالة ترقيم الفواتير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في فحص حالة ترقيم الفواتير',
      error: error.message
    });
  }
});

// إعادة تعيين ترقيم الفواتير لليوم (للطوارئ)
app.post('/api/reset-daily-numbering', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // إعادة احتساب آخر رقم فاتورة لليوم
    const lastTodayInvoice = get(`
      SELECT invoice_number FROM invoices 
      WHERE DATE(created_at) = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [today]);
    
    let lastNumber = 0;
    if (lastTodayInvoice && lastTodayInvoice.invoice_number) {
      const numberPart = lastTodayInvoice.invoice_number.split('-')[1];
      lastNumber = parseInt(numberPart) || 0;
    }
    
    // تحديث أو إنشاء سجل اليوم
    const existingRecord = get('SELECT * FROM daily_invoices WHERE date = ?', [today]);
    if (existingRecord) {
      run('UPDATE daily_invoices SET last_invoice_number = ? WHERE date = ?', [lastNumber, today]);
    } else {
      run('INSERT INTO daily_invoices (date, last_invoice_number, total_invoices) VALUES (?, ?, ?)', [today, lastNumber, 0]);
    }
    
    // إعادة احتساب الإحصائيات
    recomputeDailyStats(today);
    
    res.json({
      success: true,
      message: 'تم إعادة تعيين ترقيم الفواتير بنجاح',
      today,
      lastNumber,
      nextNumber: lastNumber + 1
    });
    
  } catch (error) {
    console.error('خطأ في إعادة تعيين ترقيم الفواتير:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين ترقيم الفواتير',
      error: error.message
    });
  }
});

// Arabic genre detection endpoints
app.post('/api/analyze-game-genre', async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || String(title).trim().length < 2) {
      return res.status(400).json({ error: 'title required' });
    }
    
    const result = await analyzeGameGenre(String(title));
    res.json({
      success: true,
      title: result.title,
      arabicGenre: result.arabicGenre,
      features: result.features,
      confidence: result.confidence
    });
  } catch (e) {
    console.error('Arabic genre analysis error:', e?.message || e);
    res.status(500).json({ error: 'analysis_failed', message: e.message || 'unknown' });
  }
});

// وسم فاتورة بأنها مطبوعة (بدون طباعة فعلية) - يفيد في الجرد
app.post('/api/invoices/:invoiceNumber/mark-printed', (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const exists = get('SELECT id FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    run(`UPDATE invoices SET printed_at = CURRENT_TIMESTAMP, print_count = COALESCE(print_count, 0) + 1 WHERE invoice_number = ?`, [invoiceNumber]);
    const updated = get('SELECT * FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
    res.json({ success: true, invoice: { ...updated, items: JSON.parse(updated.items) } });
  } catch (error) {
    console.error('mark-printed error:', error);
    res.status(500).json({ success: false, message: 'تعذر تحديث حالة الطباعة', error: error.message });
  }
});

// Batch analyze all games for Arabic genres
app.post('/api/batch-analyze-genres', authMiddleware, async (req, res) => {
  try {
    const games = all('SELECT id, title FROM games');
    if (games.length === 0) {
      return res.json({ success: true, updated: 0, message: 'No games to analyze' });
    }
    
    let updated = 0;
    const results = await batchAnalyzeGames(games, (current, total, title) => {
      console.log(`[Batch Genre Analysis] ${current}/${total}: ${title}`);
    });
    
    for (const result of results) {
      if (result.arabicGenre) {
        const features = result.features.length > 0 ? JSON.stringify(result.features) : null;
        run('UPDATE games SET genre = ?, features = ? WHERE id = ?', 
          [result.arabicGenre, features, result.id]);
        updated++;
      }
    }
    
    res.json({ success: true, updated, total: games.length, results });
  } catch (e) {
    console.error('Batch genre analysis error:', e?.message || e);
    res.status(500).json({ error: 'batch_analysis_failed', message: e.message || 'unknown' });
  }
});

// Get available Arabic genres
app.get('/api/arabic-genres', (req, res) => {
  const genres = Object.keys(ARABIC_GENRES);
  res.json({ genres });
});

// Genre management endpoints
app.get('/api/genres', (req, res) => {
  try {
    const genres = all('SELECT DISTINCT genre FROM games WHERE genre IS NOT NULL ORDER BY genre');
    res.json(genres.map(g => g.genre));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch genres', message: e.message });
  }
});

app.post('/api/genres', authMiddleware, (req, res) => {
  try {
    const { oldGenre, newGenre } = req.body;
    if (!newGenre || newGenre.trim() === '') {
      return res.status(400).json({ error: 'New genre name is required' });
    }
    
    if (oldGenre) {
      // Update existing genre
      run('UPDATE games SET genre = ? WHERE genre = ?', [newGenre.trim(), oldGenre]);
      const changes = get('SELECT changes() as changes');
      res.json({ updated: changes.changes, message: `Updated ${changes.changes} games` });
    } else {
      // This endpoint is mainly for updating, new genres are added automatically when games are classified
      res.json({ message: 'Genres are added automatically when classifying games' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to manage genre', message: e.message });
  }
});

app.delete('/api/genres/:genre', authMiddleware, (req, res) => {
  try {
    const genre = decodeURIComponent(req.params.genre);
    run('UPDATE games SET genre = NULL WHERE genre = ?', [genre]);
    const changes = get('SELECT changes() as changes');
    res.json({ deleted: changes.changes, message: `Removed genre from ${changes.changes} games` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete genre', message: e.message });
  }
});

// Series management endpoints
app.get('/api/series', (req, res) => {
  try {
    const series = all('SELECT DISTINCT series FROM games WHERE series IS NOT NULL ORDER BY series');
    res.json(series.map(s => s.series));
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch series', message: e.message });
  }
});

app.post('/api/series', authMiddleware, (req, res) => {
  try {
    const { oldSeries, newSeries } = req.body;
    if (!newSeries || newSeries.trim() === '') {
      return res.status(400).json({ error: 'New series name is required' });
    }
    
    if (oldSeries) {
      // Update existing series
      run('UPDATE games SET series = ? WHERE series = ?', [newSeries.trim(), oldSeries]);
      const changes = get('SELECT changes() as changes');
      res.json({ updated: changes.changes, message: `Updated ${changes.changes} games` });
    } else {
      // Add new series (this would typically be done when editing individual games)
      res.json({ message: 'Series are added automatically when editing games' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to manage series', message: e.message });
  }
});

app.delete('/api/series/:series', authMiddleware, (req, res) => {
  try {
    const series = decodeURIComponent(req.params.series);
    run('UPDATE games SET series = NULL WHERE series = ?', [series]);
    const changes = get('SELECT changes() as changes');
    res.json({ deleted: changes.changes, message: `Removed series from ${changes.changes} games` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete series', message: e.message });
  }
});

// Clear all genre/series/features from all games (admin only)
app.post('/api/clear-classifications', authMiddleware, (req, res) => {
  try {
    run('UPDATE games SET genre = NULL, series = NULL, features = NULL');
    const ch = get('SELECT changes() as changes');
    res.json({ cleared: ch.changes });
  } catch (e) {
    res.status(500).json({ error: 'clear_failed', message: e.message });
  }
});

// Classify by title using Wikipedia summary (no auth)
app.post('/api/classify-by-title', async (req, res) => {
  try {
    const { title } = req.body || {};
    if (!title || String(title).trim().length < 2) return res.status(400).json({ error: 'title required' });
    const info = await wikiFindSummaryGlobal(String(title));
    const text = `${String(title)} ${info?.extract || ''}`.toLowerCase();

    // Special-case corrections FIRST
    if (/avatar.*last\s*airbender.*quest\s*for\s*balance/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: '', split: false, genre: 'adventure' });
    }
    if (/plague\s*tale/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: 'a plague tale', split: false, genre: 'adventure' });
    }
    if (/telltale/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: '', split: false, genre: 'adventure' });
    }
    if (/bioshock/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: 'bioshock', split: false, genre: 'shooter' });
    }
    if (/blair\s*witch/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: '', split: false, genre: 'horror' });
    }
    if (/barbie/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: '', split: false, genre: 'kids' });
    }
    if (/arkham/i.test(text)) {
      return res.json({ success: true, title, matchedTitle: info?.match || null, summary: info?.extract || '', series: 'batman arkham', split: false, genre: 'action' });
    }

    // series detection
    const seriesRules = [
      ['resident evil', /resident\s*evil|biohazard/],
      ['god of war', /god\s*of\s*war/],
      ['call of duty', /call\s*of\s*duty|black\s*ops|modern\s*warfare/],
      ['assassin\'s creed', /assassin'?s\s*creed/],
      ['ea sports fc', /ea\s*sports\s*fc|\bfc\s*\d+\b|fifa/],
      ['need for speed', /need\s*for\s*speed|nfs/],
      ['grand theft auto', /grand\s*theft\s*auto|\bgta\b/],
      ['mortal kombat', /mortal\s*kombat/],
      ['street fighter', /street\s*fighter/],
      ['tekken', /\btekken\b/],
      ['uncharted', /\buncharted\b/],
      ['tomb raider', /tomb\s*raider/],
      ['far cry', /far\s*cry/],
      ['battlefield', /\bbattlefield\b/],
      ['horizon', /horizon\s*(zero\s*dawn|forbidden\s*west)?/],
      ['the last of us', /the\s*last\s*of\s*us/],
      ['bioshock', /bioshock/],
      ['batman arkham', /arkham/]
    ];
    let series = '';
    for (const [name, rx] of seriesRules) { if (rx.test(text)) { series = name; break; } }

    // split-screen detection
    const split = /(a\s*way\s*out|it\s*takes\s*two|overcooked|tools\s*up|lego\s+|borderlands|diablo\s*(iii|3)|split\s*-?\s*screen|local\s*(co\s*-?op|multiplayer)|couch\s*coop|شاشة\s*منقسمة|تعاوني)/i.test(text);

    // genre rules (ordered) - TIGHTENED
    // Important: order matters! Specific genres first
    const genreRules = [
      ['sports', /(ea\s*sports\s*fc|\bfc\s*\d+\b|fifa|pes|efootball|nba|\bsports\b|كرة|قدم|رياضة)/i],
      ['racing', /(\brace\b|racing|drift|need\s*for\s*speed|nfs|\bcar\b|\bcars\b|gran\s*turismo|سباق|سيارات|هجولة|تفحيط)/i],
      ['shooter', /(\bshooter\b|\bfps\b|call\s*of\s*duty|modern\s*warfare|black\s*ops|battlefield|\bgun\b|warfare|تصويب)/i],
      ['horror', /(\bhorror\b|zombie|resident\s*evil|biohazard|blair\s*witch|silent\s*hill|until\s*dawn|خوف|رعب)/i],
      ['fighting', /(mortal\s*kombat|street\s*fighter|tekken|dragon\s*ball.*kakarot|قتال|fighting|brawl)/i],
      ['adventure', /(adventure|مغامرة|uncharted|tomb\s*raider|life\s*is\s*strange|prince\s*of\s*persia|plague\s*tale|avatar)/i],
      ['puzzle', /(\bpuzzle\b|لغز|ألغاز|brain|logic)/i],
      ['platformer', /(platformer|platform\s*game|mario|crash\s*bandicoot|jump|منصات)/i],
      ['open world', /(open\s*world|grand\s*theft\s*auto|gta|cyberpunk|عالم\s*مفتوح)/i],
      ['stealth', /(stealth|assassin|hitman|metal\s*gear|خفاء|تخفي)/i],
      ['strategy', /(\bstrategy\b|\bstrategic\b|استراتيجية|\btactics\b|تكتيك)/i],
      ['rpg', /(\brpg\b|role\s*playing|witcher|elden\s*ring|dragon|souls|final\s*fantasy)/i],
      ['kids', /(\bkids\b|barbie|اطفال|عائلة|family)/i],
      ['action', /(\baction\b|اكشن|god\s*of\s*war|spider-?man|ghost\s*of\s*tsushima|arkham|batman)/i]
    ];
    let genre = '';
    for (const [g, rx] of genreRules) { if (rx.test(text)) { genre = g; break; } }

    res.json({
      success: true,
      title,
      matchedTitle: info?.match || null,
      summary: info?.extract || '',
      series,
      split,
      genre
    });
  } catch (e) {
    console.error('classify-by-title error:', e?.message || e);
    res.status(500).json({ error: 'classification_failed', message: e.message || 'unknown' })
  }
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });
    const user = await get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !user.id || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  try {
    const user = get('SELECT id, username, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.id) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch profile', error: e.message });
  }
});

// Users management (admin only)
app.get('/api/users', authMiddleware, requireAdmin, (req, res) => {
  try {
    const rows = all('SELECT id, username, role, created_at FROM users ORDER BY id DESC');
    res.json({ users: rows });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch users', error: e.message });
  }
});

app.post('/api/users', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { username, password, role = 'staff' } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'username and password are required' });
    const exists = get('SELECT id FROM users WHERE username = ?', [username]);
    if (exists && exists.id) return res.status(409).json({ message: 'Username already exists' });
    const hashed = bcrypt.hashSync(password, 10);
    run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashed, role]);
    const created = get('SELECT id, username, role, created_at FROM users WHERE username = ?', [username]);
    res.status(201).json({ success: true, user: created });
  } catch (e) {
    res.status(500).json({ message: 'Failed to create user', error: e.message });
  }
});

app.put('/api/users/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { username, role } = req.body || {};
    const user = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user || !user.id) return res.status(404).json({ message: 'User not found' });
    if (username && username !== user.username) {
      const dupe = get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id]);
      if (dupe && dupe.id) return res.status(409).json({ message: 'Username already exists' });
    }
    run('UPDATE users SET username = COALESCE(?, username), role = COALESCE(?, role) WHERE id = ?', [username || null, role || null, id]);
    const updated = get('SELECT id, username, role, created_at FROM users WHERE id = ?', [id]);
    res.json({ success: true, user: updated });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update user', error: e.message });
  }
});

app.put('/api/users/:id/password', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};
    if (!password || String(password).length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user || !user.id) return res.status(404).json({ message: 'User not found' });
    const hashed = bcrypt.hashSync(password, 10);
    run('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update password', error: e.message });
  }
});

app.delete('/api/users/:id', authMiddleware, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const user = get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user || !user.id) return res.status(404).json({ message: 'User not found' });
    run('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete user', error: e.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM categories');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Seed games from an uploads subfolder (authenticated)
// POST /api/seed-folder { folder: 'Ps4', categoryName: 'PS4' }
app.post('/api/seed-folder', authMiddleware, async (req, res) => {
  const { folder, categoryName, defaultPrice, preview } = req.body || {}
  if (!folder) return res.status(400).json({ message: 'folder is required' })
  const folderPath = path.join(UPLOADS_DIR, folder)
  if (!fs.existsSync(folderPath)) return res.status(400).json({ message: 'folder not found' })
  // ensure category
  let cat = get('SELECT * FROM categories WHERE name = ?', [categoryName || folder])
  if (!cat || !cat.id) {
    run('INSERT INTO categories (name) VALUES (?)', [categoryName || folder])
    cat = get('SELECT * FROM categories WHERE name = ?', [categoryName || folder])
  }
  const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile())
  let inserted = 0
  const skipped = []
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])
  function toTitleCase(s) {
    return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  // helper to search Wikipedia (try Arabic then English) using MediaWiki search then summary
  async function wikiFindSummary(queryStr) {
    if (!queryStr) return ''
    const sites = [
      { api: 'https://ar.wikipedia.org/w/api.php', summary: 'https://ar.wikipedia.org/api/rest_v1/page/summary/' },
      { api: 'https://en.wikipedia.org/w/api.php', summary: 'https://en.wikipedia.org/api/rest_v1/page/summary/' }
    ]
    for (const site of sites) {
      try {
        // search for best match
        const sres = await axios.get(site.api, { params: { action: 'query', list: 'search', srsearch: queryStr, format: 'json', origin: '*' }, timeout: 5000 })
        const hits = sres.data?.query?.search || []
        if (hits.length > 0) {
          const title = hits[0].title
          try {
            const sum = await axios.get(site.summary + encodeURIComponent(title), { timeout: 5000 })
            if (sum?.data?.extract) return { match: title, extract: sum.data.extract }
          } catch (e) {}
        }
      } catch (e) {}
    }
    return null
  }

  // concurrency-limited map
  async function mapLimit(array, limit, iterator) {
    const results = []
    let i = 0
    const executing = []
    while (i < array.length) {
      const item = array[i++];
      const p = Promise.resolve().then(() => iterator(item))
      results.push(p)
      executing.push(p)
      p.finally(() => {
        const idx = executing.indexOf(p)
        if (idx >= 0) executing.splice(idx, 1)
      })
      if (executing.length >= limit) await Promise.race(executing)
    }
    return Promise.all(results)
  }

  const previews = []
  await mapLimit(files, 6, async (file) => {
    try {
      const ext = path.extname(file).toLowerCase()
      if (!allowed.has(ext)) { previews.push({ file, status: 'invalid_ext' }); return }
      const imagePath = `/uploads/${folder}/${file}`
      const exists = get('SELECT * FROM games WHERE image = ?', [imagePath])
      if (exists && exists.id) { previews.push({ file, status: 'exists' }); return }
      const name = path.parse(file).name
      let title = name.replace(/[_\-\.]+/g, ' ')
      title = title.replace(/\b[0-9a-fA-F]{8,}\b/g, '')
      title = title.replace(/\b\d{4}\b/g, '')
      title = title.replace(/\d{3,}/g, '')
      title = title.replace(/\s+/g, ' ').trim()
      if (!title) title = name
      title = toTitleCase(title)
      // find summary
      const match = await wikiFindSummary(title)
      const desc = match?.extract || ''
      previews.push({ file, title, matchedTitle: match?.match || null, description: desc })
      if (!preview) {
        // actually insert (use mapping for title/genre/series if present)
        const priceVal = typeof defaultPrice === 'number' ? defaultPrice : (defaultPrice ? Number(defaultPrice) : 0)
        const m = loadMapping();
        const mapEntry = normalizeMapEntry(m[file]);
        const finalTitle = mapEntry?.title || title;
        const finalGenre = mapEntry?.genre || null;
        const finalSeries = mapEntry?.series || null;
        run('INSERT INTO games (title, image, description, price, category_id, genre, series) VALUES (?, ?, ?, ?, ?, ?, ?)', [finalTitle, imagePath, desc, priceVal || 0, cat.id, finalGenre, finalSeries])
        inserted++
      }
    } catch (e) {
      console.error('seed error', e)
      previews.push({ file, status: 'error' })
    }
  })

  if (preview) return res.json({ preview: previews })
  res.json({ inserted, skipped, details: previews })
})

// list upload folders (authenticated)
app.get('/api/uploads-folders', authMiddleware, (req, res) => {
  try {
    const dirs = fs.readdirSync(UPLOADS_DIR).filter(name => fs.statSync(path.join(UPLOADS_DIR, name)).isDirectory())
    res.json(dirs)
  } catch (e) {
    res.status(500).json({ message: 'failed' })
  }
})

app.post('/api/categories', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  run('INSERT INTO categories (name) VALUES (?)', [name]);
  const row = get('SELECT last_insert_rowid() as id');
  res.status(201).json({ id: row.id, name });
});

// Preview seed (does not insert) - returns candidate titles/descriptions for a folder
app.post('/api/seed-preview', authMiddleware, async (req, res) => {
  const { folder } = req.body || {};
  if (!folder) return res.status(400).json({ message: 'folder required' });
  const folderPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(folderPath)) return res.status(400).json({ message: 'folder not found' });
  const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile());
  const mapping = loadMapping();
  const results = [];
  for (const file of files) {
    try {
      const raw = path.parse(file).name;
      let title = cleanTitle(raw);
      if ((!title || title.length < 3) && mapping[file]) title = mapping[file];
      if ((!title || title.length < 3) && visionClient) {
        const detected = await detectTitleFromImage(path.join(folderPath, file));
        if (detected) title = detected;
      }
      const summary = title ? await wikiFindSummary(title) : null;
      const desc = summary?.extract || '';
      results.push({ file, title: title || null, description: desc });
    } catch (e) {
      results.push({ file, error: e.message || String(e) });
    }
  }
  res.json({ results });
});

// Force-insert all images from Ps4 folder into DB (no auth) - default price 10
app.post('/api/seed-ps4-force', async (req, res) => {
  const folder = 'Ps4';
  const defaultPrice = 10;
  const folderPath = path.join(UPLOADS_DIR, folder);
  if (!fs.existsSync(folderPath)) return res.status(400).json({ message: 'folder not found' });
  const files = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile() && /\.(jpe?g|png|webp|gif)$/i.test(f));
  let inserted = [];
  const mapping = loadMapping();
  let cat = get('SELECT * FROM categories WHERE name = ?', [folder]);
  if (!cat || !cat.id) { run('INSERT INTO categories (name) VALUES (?)', [folder]); cat = get('SELECT * FROM categories WHERE name = ?', [folder]); }

  for (const file of files) {
    try {
      const imagePath = `/uploads/${folder}/${file}`;
      const exists = get('SELECT * FROM games WHERE image = ?', [imagePath]);
      if (exists && exists.id) continue; // skip already inserted
      const rawName = path.parse(file).name;
      let title = cleanTitle(rawName);
      let finalGenre = null;
      let finalSeries = null;
      
      // try OCR detection first
        try {
          const detected = await detectTitleFromImage(path.join(folderPath, file));
          if (detected) {
            title = detected;
            mapping[file] = { title: detected, genre: null, series: null };
            saveMapping(mapping);
        } else if (mapping[file]) {
          // fallback to mapping if OCR failed
          const me = normalizeMapEntry(mapping[file]);
          if (me) { title = me.title; finalGenre = me.genre; finalSeries = me.series; }
        } else if (!title || title.length < 3) {
          // fallback to raw name if still empty
          title = rawName;
        }
      } catch (e) {
        console.warn('[Force-Seed] OCR failed for', file, e.message);
        if (mapping[file]) {
          const me = normalizeMapEntry(mapping[file]);
          if (me) { title = me.title; finalGenre = me.genre; finalSeries = me.series; }
        } else if (!title || title.length < 1) {
          title = rawName;
        }
      }
      // try wiki
      let desc = '';
      try {
        const sum = await wikiFindSummary(title);
        if (sum && sum.extract) { desc = sum.extract; title = sum.match || title; }
      } catch (e) { /* ignore */ }
      run('INSERT INTO games (title, image, description, price, category_id, genre, series) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, imagePath, desc || (`لعبة ${title}`), defaultPrice, cat.id, finalGenre, finalSeries]);
      const last = get('SELECT last_insert_rowid() as id');
      inserted.push({ id: last.id, title, image: imagePath });
    } catch (e) {
      console.error('[Force-Seed] error', e);
    }
  }
  res.json({ inserted: inserted.length, items: inserted });
});

// Mapping endpoints (authenticated)
app.get('/api/mapping', authMiddleware, (req, res) => {
  const m = loadMapping();
  res.json(m);
});

app.post('/api/mapping', authMiddleware, (req, res) => {
  const { file, title, genre = null, series = null } = req.body || {};
  if (!file || !title) return res.status(400).json({ message: 'file and title required' });
  const m = loadMapping();
  m[file] = { title, genre, series };
  if (saveMapping(m)) return res.json({ ok: true, entry: m[file] });
  res.status(500).json({ ok: false });
});

app.delete('/api/mapping/:file', authMiddleware, (req, res) => {
  const f = req.params.file;
  const m = loadMapping();
  if (m[f]) delete m[f];
  if (saveMapping(m)) return res.json({ ok: true });
  res.status(500).json({ ok: false });
});

app.put('/api/categories/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  run('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
  const ch = get('SELECT changes() as changes');
  res.json({ updated: ch.changes });
});

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  run('DELETE FROM categories WHERE id = ?', [id]);
  const ch = get('SELECT changes() as changes');
  res.json({ deleted: ch.changes });
});

// Games
app.get('/api/games', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const clauses = [];
    const params = [];
    if (q) { clauses.push('title LIKE ?'); params.push(`%${q}%`); }
    if (category) { clauses.push('category_id = ?'); params.push(category); }
    if (minPrice) { clauses.push('price >= ?'); params.push(minPrice); }
    if (maxPrice) { clauses.push('price <= ?'); params.push(maxPrice); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await all(`SELECT * FROM games ${where} ORDER BY id DESC`, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

app.get('/api/games/:id', (req, res) => {
  const row = get('SELECT * FROM games WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

app.post('/api/games', authMiddleware, (req, res) => {
  const { title, image, description, price, category_id, genre, series, features } = req.body;
  if (!title || !image || typeof price !== 'number') {
    return res.status(400).json({ message: 'Missing fields' });
  }
  run('INSERT INTO games (title, image, description, price, category_id, genre, series, features) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, image, description || '', price, category_id || null, genre || null, series || null, features || null]);
  const row = get('SELECT last_insert_rowid() as id');
  
  const newGame = { id: row.id, title, image, description: description || '', price, category_id: category_id || null, genre: genre || null, series: series || null, features: features || null };
  
  // إرسال تحديث فوري
  broadcastUpdate('game_added', {
    game: newGame,
    message: 'تم إضافة لعبة جديدة'
  });
  
  res.status(201).json(newGame);
});

app.put('/api/games/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, image, description, price, category_id, genre, series, features } = req.body;
  run('UPDATE games SET title = ?, image = ?, description = ?, price = ?, category_id = ?, genre = ?, series = ?, features = ? WHERE id = ?',
    [title, image, description || '', price, category_id || null, genre || null, series || null, features || null, id]);
  const ch = get('SELECT changes() as changes');
  try {
    // Persist into mapping.json so reseeds keep manual edits
    const row = get('SELECT image FROM games WHERE id = ?', [id]);
    if (row && row.image) {
      const file = path.basename(row.image);
      const m = loadMapping();
      m[file] = { title, genre: genre || null, series: series || null };
      saveMapping(m);
    }
  } catch (e) {
    // ignore mapping persist errors
  }
  res.json({ updated: ch.changes });
});

app.delete('/api/games/:id', authMiddleware, (req, res) => {
  run('DELETE FROM games WHERE id = ?', [req.params.id]);
  const ch = get('SELECT changes() as changes');
  res.json({ deleted: ch.changes });
});

// Orders
app.get('/api/orders', authMiddleware, (req, res) => {
  const rows = all('SELECT * FROM orders ORDER BY created_at DESC');
  res.json(rows);
});

app.post('/api/orders', (req, res) => {
  const { games, customer_name, customer_phone } = req.body;
  if (!Array.isArray(games) || games.length === 0) {
    return res.status(400).json({ message: 'No games in order' });
  }
  if (!customer_phone || customer_phone.trim() === '') {
    return res.status(400).json({ message: 'Phone number is required' });
  }
  const payload = JSON.stringify(games);
  run('INSERT INTO orders (games, customer_name, customer_phone) VALUES (?, ?, ?)',
    [payload, customer_name || '', customer_phone]);
  const row = get('SELECT last_insert_rowid() as id');
  res.status(201).json({ id: row.id });
});

// Settings
app.get('/api/settings', (req, res) => {
  const row = get('SELECT * FROM settings ORDER BY id DESC LIMIT 1');
  res.json(row || { 
    whatsapp_number: '', 
    default_message: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_username: '',
    telegram_enabled: false
  });
});

app.put('/api/settings', authMiddleware, (req, res) => {
  const { whatsapp_number, default_message, telegram_bot_token, telegram_chat_id, telegram_username, telegram_enabled, communication_method } = req.body;
  const existing = get('SELECT id FROM settings ORDER BY id DESC LIMIT 1');
  if (existing) {
    run('UPDATE settings SET whatsapp_number = ?, default_message = ?, telegram_bot_token = ?, telegram_chat_id = ?, telegram_username = ?, telegram_enabled = ?, communication_method = ? WHERE id = ?',
      [whatsapp_number || '', default_message || '', telegram_bot_token || '', telegram_chat_id || '', telegram_username || '', telegram_enabled || false, communication_method || 'telegram', existing.id]);
    const ch = get('SELECT changes() as changes');
    res.json({ updated: ch.changes });
  } else {
    run('INSERT INTO settings (whatsapp_number, default_message, telegram_bot_token, telegram_chat_id, telegram_username, telegram_enabled, communication_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [whatsapp_number || '', default_message || '', telegram_bot_token || '', telegram_chat_id || '', telegram_username || '', telegram_enabled || false, communication_method || 'telegram']);
    const row = get('SELECT last_insert_rowid() as id');
    res.status(201).json({ id: row.id });
  }
});

// Game recognition endpoint - استخدام Gemini Vision API (بدون authentication للتبسيط)
app.post('/api/recognize-game', async (req, res) => {
  try {
    const { imageUrl, imagePath, imageBase64 } = req.body;
    
    if (!imageUrl && !imagePath && !imageBase64) {
      return res.status(400).json({ error: 'Image URL, path, or base64 is required' });
    }
    
    let imageBuffer;
    
    // الطريقة 1: قراءة من base64 (الأسهل والأكثر موثوقية)
    if (imageBase64) {
      try {
        imageBuffer = Buffer.from(imageBase64, 'base64');
      } catch (e) {
        return res.status(400).json({ error: 'Invalid base64 image data' });
      }
    }
    // الطريقة 2: قراءة الصورة من المسار المحلي
    else if (imagePath) {
      try {
        // دعم مسارات مثل: 'uploads\\Ps4\\file.jpg' أو 'uploads/Ps4/file.jpg' أو '/uploads/Ps4/file.jpg'
        let rel = String(imagePath);
        // إزالة أي أصل URL إن وجد
        rel = rel.replace(/^https?:\/\/[^/]+/i, '');
        // تحويل الباك سلاش إلى سلاش
        rel = rel.replace(/\\/g, '/');
        // ضمان وجود البادئة الصحيحة
        if (!rel.startsWith('/uploads/')) {
          rel = rel.replace(/^\/?uploads\//i, '');
          rel = '/uploads/' + rel;
        }
        const withinUploads = rel.replace(/^\/?uploads\//i, '');
        const fullPath = path.join(UPLOADS_DIR, withinUploads);
        if (!fs.existsSync(fullPath)) {
          return res.status(404).json({ error: 'Image not found at: ' + fullPath });
        }
        imageBuffer = fs.readFileSync(fullPath);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to read image file', details: e.message });
      }
    }
    // الطريقة 3: تحميل الصورة من URL
    else if (imageUrl) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to download image', details: e.message });
      }
    }
    
    const recognizedGame = await recognizeGameFromImage(imageBuffer);
    
    if (recognizedGame) {
      res.json({
        success: true,
        game: recognizedGame,
        title: recognizedGame.title,
        confidence: recognizedGame.confidence
      });
    } else {
      res.json({
        success: false,
        error: 'Could not recognize game from image'
      });
    }
    
  } catch (error) {
    console.error('[API] Game recognition error:', error);
    res.status(500).json({ error: 'Failed to recognize game', details: error.message });
  }
});

// Telegram endpoint
app.post('/api/send-telegram', async (req, res) => {
  try {
    const { message, bot_token, chat_id, customer_phone } = req.body;
    
    if (!bot_token || !chat_id || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // إضافة رقم الهاتف للرسالة إذا كان متوفراً
    let finalMessage = message;
    if (customer_phone) {
      finalMessage += `\n\n📞 رقم الهاتف: ${customer_phone}`;
    }
    
    const telegramUrl = `https://api.telegram.org/bot${bot_token}/sendMessage`;
    const response = await axios.post(telegramUrl, {
      chat_id: chat_id,
      text: finalMessage,
      parse_mode: 'HTML'
    });
    
    if (response.data.ok) {
      res.json({ success: true, message: 'Message sent successfully' });
    } else {
      res.status(400).json({ error: 'Failed to send message', details: response.data });
    }
  } catch (error) {
    console.error('Telegram error:', error);
    res.status(500).json({ error: 'Failed to send telegram message', details: error.message });
  }
});

// Stats - Updated to use invoices table
app.get('/api/stats', async (req, res) => {
  try {
    const totals = await get('SELECT COUNT(*) as totalOrders FROM invoices');
    const invoices = await all('SELECT items FROM invoices');
    const counts = new Map();
    
    for (const invoice of invoices || []) {
      try {
        const items = JSON.parse(invoice.items);
        for (const item of items) {
          const id = item.id;
          counts.set(id, (counts.get(id) || 0) + 1);
        }
      } catch (e) {
        console.error('Error parsing invoice items:', e);
      }
    }
    
    const top = Array.from(counts.entries())
      .map(([gameId, count]) => ({ gameId: parseInt(gameId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
      
    console.log('📊 Stats generated:', { totalOrders: totals?.totalOrders || 0, topGames: top });
    res.json({ totalOrders: totals?.totalOrders || 0, topGames: top });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// إنشاء طابعة Sunmi
const printer = new SunmiPrinter();

// إنشاء فاتورة جديدة
app.post('/api/invoices', async (req, res) => {
  try {
    const {
      customerInfo,
      items,
      total,
      discount = 0,
      finalTotal,
      date,
      status = 'completed'
    } = req.body;

    const createdAt = date || new Date().toISOString();

    if (!customerInfo || !items || !total) {
      return res.status(400).json({ message: 'بيانات الفاتورة غير مكتملة' });
    }

    if (!customerInfo.name || !customerInfo.phone) {
      return res.status(400).json({ message: 'اسم العميل ورقم الهاتف مطلوبان' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'يجب أن تحتوي الفاتورة على عنصر واحد على الأقل' });
    }

    // الحصول على رقم الفاتورة اليومي التسلسلي مع معالجة الأخطاء
    let invoiceNumberResult;
    try {
      invoiceNumberResult = await getDailyInvoiceNumber();
      if (!invoiceNumberResult || !invoiceNumberResult.fullNumber) {
        throw new Error('فشل في الحصول على رقم الفاتورة');
      }
    } catch (numberError) {
      console.error('خطأ في ترقيم الفاتورة:', numberError);
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في ترقيم الفاتورة. يرجى المحاولة مرة أخرى.',
        error: 'INVOICE_NUMBERING_ERROR'
      });
    }

    let { dailyNumber, fullNumber, isFallback } = invoiceNumberResult;
    
    // تحذير في حالة استخدام رقم احتياطي
    if (isFallback) {
      console.warn('⚠️ تم استخدام رقم فاتورة احتياطي:', fullNumber);
    }

    // حفظ الفاتورة في قاعدة البيانات مع معالجة الأخطاء
    try {
      await run(`INSERT INTO invoices (
        invoice_number, customer_name, customer_phone, customer_address, 
        customer_notes, items, total, discount, final_total, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        fullNumber,
        customerInfo.name,
        customerInfo.phone,
        customerInfo.address || '',
        customerInfo.notes || '',
        JSON.stringify(items),
        total,
        discount,
        finalTotal || (total - discount),
        status,
        createdAt
      ]);
    } catch (dbError) {
      console.error('خطأ في حفظ الفاتورة في قاعدة البيانات:', dbError);
      
      // في حالة تضارب رقم الفاتورة، حاول مرة أخرى برقم جديد
      if (dbError.message && dbError.message.includes('UNIQUE constraint failed')) {
        console.log('تضارب في رقم الفاتورة، محاولة الحصول على رقم جديد...');
        try {
          const newNumberResult = await getDailyInvoiceNumber();
          const newFullNumber = newNumberResult.fullNumber;
          
          await run(`INSERT INTO invoices (
            invoice_number, customer_name, customer_phone, customer_address, 
            customer_notes, items, total, discount, final_total, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            newFullNumber,
            customerInfo.name,
            customerInfo.phone,
            customerInfo.address || '',
            customerInfo.notes || '',
            JSON.stringify(items),
            total,
            discount,
            finalTotal || (total - discount),
            status,
            createdAt
          ]);
          
          // تحديث رقم الفاتورة المستخدم
          fullNumber = newFullNumber;
          console.log('✅ تم حفظ الفاتورة برقم جديد:', newFullNumber);
          
        } catch (retryError) {
          console.error('فشل في إعادة المحاولة:', retryError);
          return res.status(500).json({ 
            success: false, 
            message: 'خطأ في حفظ الفاتورة. يرجى المحاولة مرة أخرى.',
            error: 'DATABASE_ERROR'
          });
        }
      } else {
        return res.status(500).json({ 
          success: false, 
          message: 'خطأ في حفظ الفاتورة في قاعدة البيانات.',
          error: 'DATABASE_ERROR'
        });
      }
    }

    // تحديث إحصائيات اليوم
    try {
      updateDailyStats({ total, discount });
    } catch (statsError) {
      console.warn('تحذير: فشل في تحديث الإحصائيات:', statsError.message);
      // لا نوقف العملية بسبب خطأ في الإحصائيات
    }

    // الحصول على الفاتورة المحفوظة
    const savedInvoice = get('SELECT * FROM invoices WHERE invoice_number = ?', [fullNumber]);
    
    if (!savedInvoice) {
      console.error('خطأ: لم يتم العثور على الفاتورة المحفوظة');
      return res.status(500).json({ 
        success: false, 
        message: 'خطأ في التحقق من حفظ الفاتورة.',
        error: 'VERIFICATION_ERROR'
      });
    }

    // إرسال تحديث فوري للعملاء المتصلين
    broadcastUpdate('invoice_created', {
      invoice: savedInvoice,
      message: 'تم إنشاء فاتورة جديدة'
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفاتورة بنجاح',
      invoice: savedInvoice
    });

  } catch (error) {
    console.error('خطأ في إنشاء الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في إنشاء الفاتورة',
      error: error.message 
    });
  }
});

// طباعة فاتورة على جهاز Sunmi V2
app.post('/api/print-invoice', async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress,
      items,
      total,
      date,
      notes
    } = req.body;

    if (!invoiceNumber || !customerName || !customerPhone || !items || !total) {
      return res.status(400).json({ message: 'بيانات الطباعة غير مكتملة' });
    }

    // جلب إعدادات المتجر
    const storeSettings = get('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');

    // إعداد بيانات الطباعة
    const printData = {
      invoiceNumber,
      customerName,
      customerPhone,
      customerAddress: customerAddress || '',
      items,
      total,
      date,
      notes: notes || ''
    };

    // طباعة الفاتورة مع إعدادات المتجر
    const printResult = await printer.printInvoice(printData, storeSettings);

    // تحديث عداد الطباعة في قاعدة البيانات
    run(`UPDATE invoices SET 
      printed_at = CURRENT_TIMESTAMP, 
      print_count = print_count + 1 
      WHERE invoice_number = ?`, [invoiceNumber]);

    res.json({
      success: true,
      message: 'تم طباعة الفاتورة بنجاح',
      printResult
    });

  } catch (error) {
    console.error('خطأ في طباعة الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في طباعة الفاتورة',
      error: error.message 
    });
  }
});

// الحصول على جميع الفواتير (للمدير)
app.get('/api/invoices', authMiddleware, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const invoices = all(`
      SELECT * FROM invoices 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const total = get('SELECT COUNT(*) as count FROM invoices').count;

    res.json({
      invoices: invoices.map(invoice => ({
        ...invoice,
        items: JSON.parse(invoice.items)
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('خطأ في جلب الفواتير:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب الفواتير' });
  }
});

// الحصول على فاتورة محددة
app.get('/api/invoices/:invoiceNumber', (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const invoice = get('SELECT * FROM invoices WHERE invoice_number = ?', [invoiceNumber]);

    if (!invoice) {
      return res.status(404).json({ message: 'الفاتورة غير موجودة' });
    }

    res.json({
      ...invoice,
      items: JSON.parse(invoice.items)
    });

  } catch (error) {
    console.error('خطأ في جلب الفاتورة:', error);
    res.status(500).json({ message: 'حدث خطأ في جلب الفاتورة' });
  }
});

// تعديل فاتورة
app.put('/api/invoices/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_phone,
      customer_address,
      customer_notes,
      items,
      total,
      status
    } = req.body;

    const invoice = get('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice || !invoice.id) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }

    run(`UPDATE invoices SET 
      customer_name = ?, 
      customer_phone = ?, 
      customer_address = ?, 
      customer_notes = ?,
      items = ?,
      total = ?,
      status = ?
      WHERE id = ?`, [
      customer_name || invoice.customer_name,
      customer_phone || invoice.customer_phone,
      customer_address || invoice.customer_address || '',
      customer_notes || invoice.customer_notes || '',
      items ? JSON.stringify(items) : invoice.items,
      total || invoice.total,
      status || invoice.status,
      id
    ]);

    const updated = get('SELECT * FROM invoices WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'تم تحديث الفاتورة بنجاح',
      invoice: { ...updated, items: JSON.parse(updated.items) }
    });

  } catch (error) {
    console.error('خطأ في تعديل الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تعديل الفاتورة',
      error: error.message 
    });
  }
});

// حذف فاتورة
app.delete('/api/invoices/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = get('SELECT * FROM invoices WHERE id = ?', [id]);
    if (!invoice || !invoice.id) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }

    run('DELETE FROM invoices WHERE id = ?', [id]);
    // إعادة احتساب الجرد لليوم الموافق لتاريخ هذه الفاتورة
    try {
      const dateStr = (invoice.created_at || '').slice(0,10) || new Date().toISOString().split('T')[0];
      recomputeDailyStats(dateStr);
    } catch (_) {}
    
    res.json({
      success: true,
      message: 'تم حذف الفاتورة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في حذف الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في حذف الفاتورة',
      error: error.message 
    });
  }
});

// حذف فواتير اليوم فقط
app.delete('/api/invoices/today', authMiddleware, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = get('SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = ?', [today]).count;
    run('DELETE FROM invoices WHERE DATE(created_at) = ?', [today]);
    // إعادة احتساب الجرد لليوم
    recomputeDailyStats(today);
    res.json({
      success: true,
      message: `تم حذف ${count} من فواتير اليوم (${today}) بنجاح`,
      deletedCount: count,
      date: today
    });
  } catch (error) {
    console.error('خطأ في حذف فواتير اليوم:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في حذف فواتير اليوم',
      error: error.message 
    });
  }
});

// حذف جميع الفواتير
app.delete('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const countResult = await get('SELECT COUNT(*) as count FROM invoices');
    const count = countResult?.count || 0;
    
    await run('DELETE FROM invoices');
    await run("DELETE FROM sqlite_sequence WHERE name='invoices'");
    // Clear daily reports as well since invoices are wiped
    await run('DELETE FROM daily_invoices');
    await run("DELETE FROM sqlite_sequence WHERE name='daily_invoices'");
    
    res.json({
      success: true,
      message: `تم حذف ${count} فاتورة بنجاح`,
      deletedCount: count
    });

  } catch (error) {
    console.error('خطأ في حذف جميع الفواتير:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في حذف الفواتير',
      error: error.message 
    });
  }
});

// الحصول على الجرد اليومي
app.get('/api/daily-report/:date?', authMiddleware, (req, res) => {
  try {
    const date = req.params.date || new Date().toISOString().split('T')[0];
    
    // الحصول على بيانات اليوم
    const dailyRecord = get('SELECT * FROM daily_invoices WHERE date = ?', [date]);
    
    if (!dailyRecord) {
      return res.json({
        success: true,
        report: {
          date,
          totalInvoices: 0,
          totalRevenue: 0,
          totalDiscount: 0,
          netRevenue: 0,
          lastInvoiceNumber: 0,
          isClosed: false,
          invoices: []
        }
      });
    }
    
    // الحصول على فواتير اليوم
    const invoices = all(`
      SELECT * FROM invoices 
      WHERE DATE(created_at) = ? 
      ORDER BY created_at ASC
    `, [date]);
    
    res.json({
      success: true,
      report: {
        ...dailyRecord,
        invoices: invoices.map(invoice => ({
          ...invoice,
          items: JSON.parse(invoice.items)
        }))
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب الجرد اليومي:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في جلب الجرد اليومي',
      error: error.message 
    });
  }
});

// إغلاق الجرد اليومي
app.post('/api/daily-report/:date/close', authMiddleware, (req, res) => {
  try {
    const date = req.params.date;
    
    // التحقق من وجود السجل
    const dailyRecord = get('SELECT * FROM daily_invoices WHERE date = ?', [date]);
    
    if (!dailyRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'لا يوجد سجل لهذا التاريخ' 
      });
    }
    
    if (dailyRecord.is_closed) {
      return res.status(400).json({ 
        success: false, 
        message: 'تم إغلاق الجرد لهذا التاريخ مسبقاً' 
      });
    }
    
    // إغلاق الجرد مع ملاحظات اختيارية
    const notes = req.body && typeof req.body.notes !== 'undefined' ? String(req.body.notes) : null;
    run(`UPDATE daily_invoices SET 
      is_closed = 1, 
      closed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP,
      notes = COALESCE(?, notes)
      WHERE date = ?`, [notes, date]);
    
    res.json({
      success: true,
      message: 'تم إغلاق الجرد اليومي بنجاح'
    });
    
  } catch (error) {
    console.error('خطأ في إغلاق الجرد اليومي:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في إغلاق الجرد اليومي',
      error: error.message 
    });
  }
});

// الحصول على تقرير الأيام السابقة
app.get('/api/daily-reports', authMiddleware, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    
    const reports = all(`
      SELECT * FROM daily_invoices 
      ORDER BY date DESC 
      LIMIT ? OFFSET ?
    `, [limit, offset]);
    
    const total = get('SELECT COUNT(*) as count FROM daily_invoices').count;
    
    res.json({
      success: true,
      reports,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset + limit) < total
      }
    });
    
  } catch (error) {
    console.error('خطأ في جلب التقارير اليومية:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في جلب التقارير اليومية',
      error: error.message 
    });
  }
});

// حساب إجمالي الفواتير
app.get('/api/invoices-summary', authMiddleware, (req, res) => {
  try {
    const summary = get(`
      SELECT 
        COUNT(*) as totalInvoices,
        COALESCE(SUM(CASE WHEN final_total > 0 THEN final_total ELSE (total - COALESCE(discount, 0)) END), 0) as totalRevenue,
        COALESCE(AVG(CASE WHEN final_total > 0 THEN final_total ELSE (total - COALESCE(discount, 0)) END), 0) as averageInvoice,
        COALESCE(MAX(CASE WHEN final_total > 0 THEN final_total ELSE (total - COALESCE(discount, 0)) END), 0) as highestInvoice,
        COALESCE(MIN(CASE WHEN final_total > 0 THEN final_total ELSE (total - COALESCE(discount, 0)) END), 0) as lowestInvoice
      FROM invoices
    `);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todaySummary = get(`
      SELECT 
        COUNT(*) as todayInvoices,
        COALESCE(SUM(CASE WHEN final_total > 0 THEN final_total ELSE (total - COALESCE(discount, 0)) END), 0) as todayRevenue
      FROM invoices
      WHERE created_at >= ?
    `, [todayStart.toISOString()]);

    res.json({
      success: true,
      summary: {
        ...summary,
        ...todaySummary
      }
    });

  } catch (error) {
    console.error('خطأ في حساب إجمالي الفواتير:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في حساب الإجمالي',
      error: error.message 
    });
  }
});

// طباعة تجريبية لاختبار الاتصال بجهاز Sunmi V2
app.post('/api/print-test', authMiddleware, async (req, res) => {
  try {
    const testResult = await printer.printTest();
    res.json({
      success: true,
      message: 'تم إجراء الطباعة التجريبية بنجاح',
      result: testResult
    });
  } catch (error) {
    console.error('خطأ في الطباعة التجريبية:', error);
    res.status(500).json({ 
      success: false, 
      message: 'فشل في الطباعة التجريبية',
      error: error.message 
    });
  }
});

// تحديث إعدادات طابعة Sunmi V2
app.post('/api/printer-settings', authMiddleware, (req, res) => {
  try {
    const { deviceIP, devicePort, printSettings } = req.body;

    if (deviceIP) {
      printer.updateDeviceIP(deviceIP, devicePort || '8080');
    }

    if (printSettings) {
      printer.updateSettings(printSettings);
    }

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الطابعة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث إعدادات الطابعة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحديث إعدادات الطابعة',
      error: error.message 
    });
  }
});

// إنشاء نسخة احتياطية من قاعدة البيانات
app.get('/api/backup-database', authMiddleware, (req, res) => {
  try {
    // حفظ قاعدة البيانات الحالية
    persistDb();
    
    // قراءة ملف قاعدة البيانات
    const dbBuffer = fs.readFileSync(DB_PATH);
    
    // إنشاء اسم ملف النسخة الاحتياطية مع التاريخ والوقت
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `database-backup-${timestamp}.sqlite`;
    
    // إرسال الملف للتحميل
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backupFilename}"`);
    res.setHeader('Content-Length', dbBuffer.length);
    res.send(dbBuffer);
    
    console.log(`✅ تم إنشاء نسخة احتياطية: ${backupFilename}`);

  } catch (error) {
    console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في إنشاء النسخة الاحتياطية',
      error: error.message 
    });
  }
});

// استعادة قاعدة البيانات من نسخة احتياطية
app.post('/api/restore-database', authMiddleware, async (req, res) => {
  try {
    const { backupData } = req.body;
    
    if (!backupData) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم إرسال بيانات النسخة الاحتياطية' 
      });
    }
    
    // إنشاء نسخة احتياطية من قاعدة البيانات الحالية قبل الاستعادة
    const currentDbBuffer = fs.readFileSync(DB_PATH);
    const backupPath = path.join(DATA_DIR, `database-before-restore-${Date.now()}.sqlite`);
    fs.writeFileSync(backupPath, currentDbBuffer);
    console.log(`✅ تم حفظ نسخة احتياطية من قاعدة البيانات الحالية: ${backupPath}`);
    
    // تحويل البيانات من base64 إلى buffer
    const buffer = Buffer.from(backupData, 'base64');
    
    // كتابة قاعدة البيانات الجديدة
    fs.writeFileSync(DB_PATH, buffer);
    
    // إعادة تحميل قاعدة البيانات
    if (db) {
      try {
        db.close();
      } catch (e) {
        console.warn('Warning closing old DB:', e.message);
      }
    }
    
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    
    res.json({
      success: true,
      message: 'تم استعادة قاعدة البيانات بنجاح',
      backupLocation: backupPath
    });
    
    console.log('✅ تم استعادة قاعدة البيانات بنجاح');

  } catch (error) {
    console.error('خطأ في استعادة قاعدة البيانات:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في استعادة قاعدة البيانات',
      error: error.message 
    });
  }
});

// جلب إعدادات الفاتورة
app.get('/api/invoice-settings', (req, res) => {
  try {
    let settings = get('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');
    
    // إذا لم توجد إعدادات، إنشاء إعدادات افتراضية
    if (!settings || Object.keys(settings).length === 0) {
      run(`INSERT INTO invoice_settings (
        store_name, store_name_english, store_address, store_phone, 
        store_email, store_website, footer_message, header_logo_text,
        show_store_info, show_footer, paper_width, font_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        'الشارده للإلكترونيات',
        'Alnafar Store', 
        'شارع القضائيه مقابل مطحنة الفضيل',
        '0920595447',
        'info@alnafar.store',
        '',
        'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
        'فاتورة مبيعات',
        1, 1, 58, 'large'
      ]);
      
      settings = get('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');
    }

    res.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('خطأ في جلب إعدادات الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في جلب إعدادات الفاتورة',
      error: error.message 
    });
  }
});

// تحديث إعدادات الفاتورة
app.post('/api/invoice-settings', authMiddleware, (req, res) => {
  try {
    const {
      store_name,
      store_name_english,
      store_address,
      store_phone,
      store_email,
      store_website,
      footer_message,
      header_logo_text,
      show_store_info,
      show_footer,
      paper_width,
      font_size
    } = req.body;

    // التحقق من وجود إعدادات حالية
    const existing = get('SELECT * FROM invoice_settings ORDER BY id DESC LIMIT 1');
    
    if (existing && existing.id) {
      // تحديث الإعدادات الموجودة
      run(`UPDATE invoice_settings SET 
        store_name = ?, store_name_english = ?, store_address = ?, store_phone = ?,
        store_email = ?, store_website = ?, footer_message = ?, header_logo_text = ?,
        show_store_info = ?, show_footer = ?, paper_width = ?, font_size = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`, [
        store_name || 'الشارجه للإلكترونيات',
        store_name_english || 'Alnafar Store',
        store_address || 'شارع القضائيه مقابل مطحنة الفضيل',
        store_phone || '0920595447',
        store_email || 'info@alnafar.store',
        store_website || '',
        footer_message || 'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
        header_logo_text || 'فاتورة مبيعات',
        show_store_info ? 1 : 0,
        show_footer ? 1 : 0,
        paper_width || 58,
        font_size || 'normal',
        existing.id
      ]);
    } else {
      // إنشاء إعدادات جديدة
      run(`INSERT INTO invoice_settings (
        store_name, store_name_english, store_address, store_phone, 
        store_email, store_website, footer_message, header_logo_text,
        show_store_info, show_footer, paper_width, font_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        store_name || 'الشارجه للإلكترونيات',
        store_name_english || 'Alnafar Store',
        store_address || 'شارع القضائيه مقابل مطحنة الفضيل',
        store_phone || '0920595447',
        store_email || 'info@alnafar.store',
        store_website || '',
        footer_message || 'شكراً لتسوقكم معنا - للاستفسارات اتصل بنا',
        header_logo_text || 'فاتورة مبيعات',
        show_store_info ? 1 : 0,
        show_footer ? 1 : 0,
        paper_width || 58,
        font_size || 'normal'
      ]);
    }

    // تحديث إعدادات الطابعة
    if (paper_width || font_size) {
      printer.updateSettings({
        paperWidth: paper_width || 58,
        fontSize: font_size || 'normal'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث إعدادات الفاتورة بنجاح'
    });

  } catch (error) {
    console.error('خطأ في تحديث إعدادات الفاتورة:', error);
    res.status(500).json({ 
      success: false, 
      message: 'حدث خطأ في تحديث إعدادات الفاتورة',
      error: error.message 
    });
  }
});

// Database helper functions are now imported from db-adapter at the top

async function autoSeedFromUploads() {
  console.log('[Auto-Seed] Clearing existing games table for a fresh start...');
  try {
    run('DELETE FROM games');
    // Reset autoincrement counter for SQLite
    run("DELETE FROM sqlite_sequence WHERE name='games'");
    console.log('[Auto-Seed] `games` table cleared.');
  } catch (e) {
    console.error('[Auto-Seed] Failed to clear games table.', e);
  }

  console.log('[Auto-Seed] Checking for new games in uploads folder...');
  const folder = 'Ps4';
  const categoryName = 'PS4';
  const defaultPrice = 10;
  const folderPath = path.join(UPLOADS_DIR, folder);

  if (!fs.existsSync(folderPath)) {
    console.log(`[Auto-Seed] Folder not found, skipping: ${folderPath}`);
    return;
  }

  let cat = get('SELECT * FROM categories WHERE name = ?', [categoryName]);
  if (!cat || !cat.id) {
    try {
      run('INSERT INTO categories (name) VALUES (?)', [categoryName]);
      cat = get('SELECT * FROM categories WHERE name = ?', [categoryName]);
      console.log(`[Auto-Seed] Created category '${categoryName}'`);
    } catch (e) {
      console.error(`[Auto-Seed] Failed to create category '${categoryName}'`, e);
      return;
    }
  }

  const files = fs.readdirSync(folderPath).filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f));
  let insertedCount = 0;

  // Use the existing wiki helper function
  async function wikiFindSummary(queryStr) {
    if (!queryStr) return null;
    const sites = [
      { api: 'https://en.wikipedia.org/w/api.php', summary: 'https://en.wikipedia.org/api/rest_v1/page/summary/' },
      { api: 'https://ar.wikipedia.org/w/api.php', summary: 'https://ar.wikipedia.org/api/rest_v1/page/summary/' }
    ];
    for (const site of sites) {
      try {
        const sres = await axios.get(site.api, { params: { action: 'query', list: 'search', srsearch: queryStr, format: 'json', origin: '*' }, timeout: 3000 });
        const hits = sres.data?.query?.search || [];
        if (hits.length > 0) {
          const title = hits[0].title;
          const sum = await axios.get(site.summary + encodeURIComponent(title), { timeout: 3000 });
          if (sum?.data?.extract) return { match: title, extract: sum.data.extract };
        }
      } catch (e) { /* ignore errors and try next site */ }
    }
    return null;
  }

  // تحسين تنظيف اسم اللعبة واستخراج وصف من ويكيبيديا
  function cleanTitle(name) {
    let title = name.replace(/\.[^/.]+$/, ""); // إزالة الامتداد
    title = title.replace(/[_\-\.]+/g, ' '); // استبدال الرموز بمسافة
    title = title.replace(/(Retouch|Picsart|Screenshot|IMG|Image|Photo)[\s_]?(\d+)?/gi, ''); // إزالة كلمات غير مرغوب فيها
    title = title.replace(/\b[0-9a-fA-F]{8,}\b/g, ''); // إزالة سلاسل أرقام طويلة
    title = title.replace(/\d{4,}/g, ''); // إزالة أرقام/تاريخ طويل
    title = title.replace(/\s+/g, ' ').trim();
    // تحويل إلى Title Case
    return title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  // استخدام Gemini لاكتشاف عنوان اللعبة من الصورة
  async function detectTitleFromImage(fsImagePath) {
    if (!genAI) return null;
    
    try {
      const imageBuffer = fs.readFileSync(fsImagePath);
      const result = await recognizeGameFromImage(imageBuffer);
      return result ? result.title : null;
    } catch (error) {
      console.error('[Auto-Seed] Gemini detection failed:', error.message);
      return null;
    }
  }

  const mapping = loadMapping();
  for (const file of files) {
    try {
      const imagePath = `/uploads/${folder}/${file}`;
      const rawName = path.parse(file).name;
      let title = cleanTitle(rawName);
      
      // Check mapping first
      if (mapping[file]) {
        title = mapping[file];
        console.log(`[Auto-Seed] Using mapping for ${file} -> ${title}`);
      } else if (genAI) {
        // Try OCR detection if Gemini is available
        const fsImage = path.join(folderPath, file);
        const detected = await detectTitleFromImage(fsImage);
        
        if (detected) {
          title = detected;
          console.log(`[Auto-Seed] OCR detected title for ${file}: ${title}`);
          // save to mapping for future runs
          mapping[file] = title;
          saveMapping(mapping);
          // Rate limiting: wait 4 seconds between Gemini API calls (15 requests/minute)
          await new Promise(resolve => setTimeout(resolve, 4000));
        } else if (!title || title.length < 3) {
          console.log(`[Auto-Seed] Skipped ${file} due to empty or short title after cleaning.`);
          continue;
        }
      } else if (!title || title.length < 3) {
        // No Gemini and no good title from filename - use generic title
        title = `Game ${rawName.substring(0, 8)}`;
        console.log(`[Auto-Seed] Using generic title for ${file}: ${title}`);
      }

      // جلب وصف اللعبة من ويكيبيديا
      let description = '';
      let wikiTitle = title;
      const summary = await wikiFindSummary(wikiTitle);
      if (summary && summary.extract) {
        description = summary.extract;
        wikiTitle = summary.match;
      } else {
        // إذا لم يوجد وصف، استخدم اسم اللعبة فقط
        description = `لعبة ${title}`;
      }

      run('INSERT INTO games (title, image, description, price, category_id) VALUES (?, ?, ?, ?, ?)', [wikiTitle, imagePath, description, defaultPrice, cat.id]);
      insertedCount++;
      console.log(`[Auto-Seed] Added: ${wikiTitle}`);
    } catch (e) {
      console.error(`[Auto-Seed] Error processing file ${file}:`, e);
    }
  }

  if (insertedCount > 0) {
    console.log(`[Auto-Seed] Finished. Added ${insertedCount} new games from '${folder}' folder.`);
  } else {
    console.log(`[Auto-Seed] No new games to add from '${folder}' folder.`);
  }
}

// Removed duplicate start() implementation (was here previously)



// Mapping endpoints (authenticated)

app.get('/api/mapping', authMiddleware, (req, res) => {

  const m = loadMapping();

  res.json(m);

});



app.post('/api/mapping', authMiddleware, (req, res) => {

  const { file, title } = req.body || {};

  if (!file || !title) return res.status(400).json({ message: 'file and title required' });

  const m = loadMapping();

  m[file] = title;

  if (saveMapping(m)) return res.json({ ok: true });

  res.status(500).json({ ok: false });

});



app.delete('/api/mapping/:file', authMiddleware, (req, res) => {

  const f = req.params.file;

  const m = loadMapping();

  if (m[f]) delete m[f];

  if (saveMapping(m)) return res.json({ ok: true });

  res.status(500).json({ ok: false });

});



app.put('/api/categories/:id', authMiddleware, (req, res) => {

  const { id } = req.params;

  const { name } = req.body;

  run('UPDATE categories SET name = ? WHERE id = ?', [name, id]);

  const ch = get('SELECT changes() as changes');

  res.json({ updated: ch.changes });

});



app.delete('/api/categories/:id', authMiddleware, (req, res) => {

  const { id } = req.params;

  run('DELETE FROM categories WHERE id = ?', [id]);

  const ch = get('SELECT changes() as changes');

  res.json({ deleted: ch.changes });

});



// Games

app.get('/api/games', (req, res) => {

  const { q, category, minPrice, maxPrice } = req.query;

  const clauses = [];

  const params = [];

  if (q) { clauses.push('title LIKE ?'); params.push(`%${q}%`); }

  if (category) { clauses.push('category_id = ?'); params.push(category); }

  if (minPrice) { clauses.push('price >= ?'); params.push(minPrice); }

  if (maxPrice) { clauses.push('price <= ?'); params.push(maxPrice); }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const rows = all(`SELECT * FROM games ${where} ORDER BY id DESC`, params);

  res.json(rows);

});



app.get('/api/games/:id', (req, res) => {

  const row = get('SELECT * FROM games WHERE id = ?', [req.params.id]);

  if (!row) return res.status(404).json({ message: 'Not found' });

  res.json(row);

});



app.post('/api/games', authMiddleware, (req, res) => {

  const { title, image, description, price, category_id } = req.body;

  if (!title || !image || typeof price !== 'number') {

    return res.status(400).json({ message: 'Missing fields' });

  }

  run('INSERT INTO games (title, image, description, price, category_id) VALUES (?, ?, ?, ?, ?)',

    [title, image, description || '', price, category_id || null]);

  const row = get('SELECT last_insert_rowid() as id');

  res.status(201).json({ id: row.id, title, image, description: description || '', price, category_id: category_id || null });

});



app.put('/api/games/:id', authMiddleware, (req, res) => {

  const { id } = req.params;

  const { title, image, description, price, category_id } = req.body;

  run('UPDATE games SET title = ?, image = ?, description = ?, price = ?, category_id = ? WHERE id = ?',

    [title, image, description || '', price, category_id || null, id]);

  const ch = get('SELECT changes() as changes');

  res.json({ updated: ch.changes });

});



app.delete('/api/games/:id', authMiddleware, (req, res) => {

  run('DELETE FROM games WHERE id = ?', [req.params.id]);

  const ch = get('SELECT changes() as changes');

  res.json({ deleted: ch.changes });

});



// Orders

app.get('/api/orders', authMiddleware, (req, res) => {

  const rows = all('SELECT * FROM orders ORDER BY created_at DESC');

  res.json(rows);

});



app.post('/api/orders', (req, res) => {

  const { games, customer_name, customer_phone } = req.body;

  if (!Array.isArray(games) || games.length === 0) {

    return res.status(400).json({ message: 'No games in order' });

  }

  const payload = JSON.stringify(games);

  run('INSERT INTO orders (games, customer_name, customer_phone) VALUES (?, ?, ?)',

    [payload, customer_name || '', customer_phone || '']);

  const row = get('SELECT last_insert_rowid() as id');

  res.status(201).json({ id: row.id });

});



// Settings

app.get('/api/settings', (req, res) => {

  const row = get('SELECT * FROM settings ORDER BY id DESC LIMIT 1');

  res.json(row || { 
    whatsapp_number: '', 
    default_message: 'مرحباً، أريد طلب الألعاب التالية:',
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_enabled: 1,
    communication_method: 'telegram'
  });

});



app.put('/api/settings', authMiddleware, (req, res) => {

  const { whatsapp_number, default_message } = req.body;

  const existing = get('SELECT id FROM settings ORDER BY id DESC LIMIT 1');

  if (existing) {

    run('UPDATE settings SET whatsapp_number = ?, default_message = ? WHERE id = ?',

      [whatsapp_number || '', default_message || '', existing.id]);

    const ch = get('SELECT changes() as changes');

    res.json({ updated: ch.changes });

  } else {

    run('INSERT INTO settings (whatsapp_number, default_message) VALUES (?, ?)',

      [whatsapp_number || '', default_message || '']);

    const row = get('SELECT last_insert_rowid() as id');

    res.status(201).json({ id: row.id });

  }

});






// Database helper functions moved to db-adapter

// Duplicate autoSeedFromUploads removed - using the one above

async function start() {

  await initDb();
  
  // Initialize storage (Cloudinary or local)
  cloudinaryStorage.initStorage();

  await initializeDatabase();

  // Optional: enable automatic seeding only if explicitly requested
  if (String(process.env.AUTO_SEED_ON_START || '').toLowerCase() === 'true') {
    await autoSeedFromUploads();
  }
  const isProd = process.env.NODE_ENV === 'production';



  if (isProd) {

    // Serve built frontend

    const clientDist = path.join(__dirname, '..', 'dist');
    
    console.log('🔍 Looking for dist folder at:', clientDist);
    console.log('📁 Dist exists:', fs.existsSync(clientDist));

    if (fs.existsSync(clientDist)) {
      console.log('✅ Serving static files from:', clientDist);
      app.use(express.static(clientDist));

      app.get('*', (_req, res) => {
        const indexPath = path.join(clientDist, 'index.html');
        console.log('📄 Serving index.html from:', indexPath);
        res.sendFile(indexPath);
      });

    } else {
      console.warn('⚠️ Dist folder not found at:', clientDist);
      try {
        console.warn('📁 Available files:', fs.readdirSync(path.join(__dirname, '..')));
      } catch (e) {
        console.warn('❌ Cannot read directory:', e.message);
      }
      
      // Fallback: serve a simple message
      app.get('*', (_req, res) => {
        res.status(404).send(`
          <h1>Build Error</h1>
          <p>Frontend build files not found.</p>
          <p>Expected location: ${clientDist}</p>
          <p>Please check the build process.</p>
        `);
      });
    }

  } else {

    // Dev: use Vite middleware on the same Express server (single port)
    let vite = null;
    try {
      // قمع تحذيرات Vite المهملة
      const originalConsoleWarn = console.warn;
      console.warn = (message) => {
        if (!message.includes('CJS build of Vite') && !message.includes('deprecated')) {
          originalConsoleWarn(message);
        }
      };

      const { createServer } = await import('vite');

      vite = await createServer({

      root: path.join(__dirname, '..', 'frontend'),

      server: { middlewareMode: true },

      appType: 'spa',

    });

    app.use(vite.middlewares);

      // Add the catch-all route for Vite
    app.use('*', async (_req, res) => {

      const indexHtmlPath = path.join(__dirname, '..', 'frontend', 'index.html');

      const rawHtml = await fs.promises.readFile(indexHtmlPath, 'utf-8');

      const html = await vite.transformIndexHtml('/', rawHtml);

      res.setHeader('Content-Type', 'text/html');

      res.status(200).end(html);

    });

      // استعادة console.warn
      console.warn = originalConsoleWarn;
      
    } catch (error) {
      console.warn('Vite not available, serving static files only:', error.message);
      // Fallback to static files
      const clientDist = path.join(__dirname, '..', 'frontend');
      if (fs.existsSync(clientDist)) {
        app.use(express.static(clientDist));
        app.get('*', (_req, res) => {
          res.sendFile(path.join(clientDist, 'index.html'));
        });
      }
    }

  }



  // استخدم منفذ ثابت من البيئة أو 5000 لضمان توافق بروكسي Vite
  const listenPort = Number(process.env.PORT) || 5000;
  httpServer.listen(listenPort, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${listenPort}`);
    console.log(`🔌 Socket.IO enabled for real-time updates`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Admin panel: /#/admin`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔗 Local access: http://localhost:${listenPort}`);
      console.log(`📱 Network access: http://192.168.8.104:${listenPort}`);
    }
  });

}



start();






