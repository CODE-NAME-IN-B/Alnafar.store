const { analyzeGameGenre, ARABIC_GENRES } = require('./arabic-genre-detector');

// Test games with expected genres
const testGames = [
  'A Way Out',
  'A Plague Tale Innocence', 
  'Call of Duty Modern Warfare',
  'FIFA 23',
  'Resident Evil 4',
  'God of War',
  'Gran Turismo 7',
  'Mortal Kombat 11',
  'The Witcher 3',
  'Spider-Man',
  'Crash Bandicoot',
  'Portal 2'
];

async function testGenreDetection() {
  console.log('🏷️ Testing Arabic Genre Detection System\n');
  console.log('Available Arabic Genres:');
  Object.keys(ARABIC_GENRES).forEach(genre => {
    console.log(`  - ${genre}`);
  });
  console.log('\n' + '='.repeat(50) + '\n');

  for (const gameTitle of testGames) {
    console.log(`🎮 Testing: ${gameTitle}`);
    try {
      const result = await analyzeGameGenre(gameTitle);
      console.log(`   Genre: ${result.arabicGenre || 'غير محدد'}`);
      console.log(`   Features: ${result.features.join(', ') || 'لا توجد'}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run the test
testGenreDetection().catch(console.error);
