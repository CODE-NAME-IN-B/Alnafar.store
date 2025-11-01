#!/usr/bin/env node

const axios = require('axios');
const { analyzeGameGenre } = require('./arabic-genre-detector');

const API_BASE = 'http://localhost:5000/api';

// تسجيل الدخول للحصول على التوكن
async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ فشل تسجيل الدخول:', error.message);
    process.exit(1);
  }
}

// جلب جميع الألعاب
async function getAllGames() {
  try {
    const response = await axios.get(`${API_BASE}/games`);
    return response.data;
  } catch (error) {
    console.error('❌ فشل جلب الألعاب:', error.message);
    return [];
  }
}

// تحديث لعبة بالنوع العربي
async function updateGameGenre(gameId, genre, features, token) {
  try {
    const gameResponse = await axios.get(`${API_BASE}/games/${gameId}`);
    const game = gameResponse.data;
    
    const updateData = {
      ...game,
      genre: genre,
      features: features && features.length > 0 ? JSON.stringify(features) : null
    };
    
    await axios.put(`${API_BASE}/games/${gameId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return true;
  } catch (error) {
    console.error(`❌ فشل تحديث اللعبة ${gameId}:`, error.message);
    return false;
  }
}

// التصنيف الرئيسي
async function classifyAllGames() {
  console.log('🏷️ بدء تصنيف جميع الألعاب بالعربية...\n');
  
  // تسجيل الدخول
  const token = await login();
  console.log('✅ تم تسجيل الدخول بنجاح\n');
  
  // جلب الألعاب
  const games = await getAllGames();
  console.log(`📊 تم العثور على ${games.length} لعبة\n`);
  
  if (games.length === 0) {
    console.log('❌ لا توجد ألعاب للتصنيف');
    return;
  }
  
  let processed = 0;
  let updated = 0;
  let failed = 0;
  
  const genreStats = {};
  
  console.log('🔄 بدء عملية التصنيف...\n');
  console.log('='.repeat(60));
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    processed++;
    
    try {
      // عرض التقدم
      const progress = `[${processed}/${games.length}]`;
      console.log(`${progress} 🎮 ${game.title}`);
      
      // تحليل النوع
      const analysis = await analyzeGameGenre(game.title);
      
      if (analysis.arabicGenre) {
        // تحديث اللعبة
        const success = await updateGameGenre(game.id, analysis.arabicGenre, analysis.features, token);
        
        if (success) {
          updated++;
          
          // إحصائيات الأنواع
          if (!genreStats[analysis.arabicGenre]) {
            genreStats[analysis.arabicGenre] = 0;
          }
          genreStats[analysis.arabicGenre]++;
          
          console.log(`   ✅ ${analysis.arabicGenre}${analysis.features.length > 0 ? ' + ' + analysis.features.join(', ') : ''}`);
        } else {
          failed++;
          console.log(`   ❌ فشل التحديث`);
        }
      } else {
        console.log(`   ⚠️  لم يتم العثور على نوع مناسب`);
      }
      
      // تأخير لتجنب إرهاق الخوادم
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      failed++;
      console.log(`   ❌ خطأ: ${error.message}`);
    }
    
    console.log('');
  }
  
  // النتائج النهائية
  console.log('='.repeat(60));
  console.log('📊 ملخص النتائج:');
  console.log(`   📝 إجمالي الألعاب: ${games.length}`);
  console.log(`   ✅ تم التصنيف: ${updated}`);
  console.log(`   ❌ فشل: ${failed}`);
  console.log(`   ⚠️  غير مصنف: ${games.length - updated - failed}`);
  console.log('');
  
  // إحصائيات الأنواع
  if (Object.keys(genreStats).length > 0) {
    console.log('🏷️ إحصائيات الأنواع:');
    const sortedGenres = Object.entries(genreStats)
      .sort(([,a], [,b]) => b - a);
    
    for (const [genre, count] of sortedGenres) {
      const percentage = ((count / updated) * 100).toFixed(1);
      console.log(`   ${genre}: ${count} لعبة (${percentage}%)`);
    }
  }
  
  console.log('\n🎉 انتهت عملية التصنيف!');
}

// تشغيل السكريبت
if (require.main === module) {
  classifyAllGames().catch(error => {
    console.error('💥 خطأ في التصنيف:', error.message);
    process.exit(1);
  });
}

module.exports = { classifyAllGames };
