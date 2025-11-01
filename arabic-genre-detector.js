const axios = require('axios');

// Arabic genre mapping with comprehensive keywords
const ARABIC_GENRES = {
  'رعب': {
    keywords: ['horror', 'zombie', 'resident evil', 'biohazard', 'silent hill', 'until dawn', 'outlast', 'amnesia', 'dead space', 'evil within', 'blair witch', 'layers of fear', 'phasmophobia', 'visage', 'madison', 'scary', 'frightening', 'terror', 'haunted', 'ghost', 'demon', 'undead', 'survival horror'],
    series: ['resident evil', 'silent hill', 'dead space', 'outlast', 'amnesia', 'evil within']
  },
  'أكشن': {
    keywords: ['action', 'god of war', 'spider-man', 'ghost of tsushima', 'batman', 'devil may cry', 'bayonetta', 'metal gear rising', 'ninja gaiden', 'combat', 'fighting', 'battle', 'warrior', 'hero', 'adventure action'],
    series: ['god of war', 'spider-man', 'batman', 'devil may cry', 'bayonetta', 'metal gear']
  },
  'مغامرة': {
    keywords: ['adventure', 'uncharted', 'tomb raider', 'life is strange', 'prince of persia', 'plague tale', 'avatar', 'the last of us', 'horizon', 'exploration', 'quest', 'journey', 'story', 'narrative'],
    series: ['uncharted', 'tomb raider', 'life is strange', 'prince of persia', 'the last of us', 'horizon', 'assassin\'s creed']
  },
  'رياضة': {
    keywords: ['sports', 'fifa', 'pes', 'efootball', 'nba', 'football', 'soccer', 'basketball', 'tennis', 'golf', 'baseball', 'hockey', 'wrestling', 'wwe', 'ufc', 'boxing'],
    series: ['fifa', 'pes', 'nba 2k', 'wwe 2k', 'ufc', 'madden']
  },
  'سباقات': {
    keywords: ['racing', 'race', 'drift', 'need for speed', 'nfs', 'car', 'cars', 'gran turismo', 'forza', 'dirt', 'rally', 'f1', 'formula', 'driving', 'speed', 'motor'],
    series: ['need for speed', 'gran turismo', 'forza', 'dirt', 'f1']
  },
  'تصويب': {
    keywords: ['shooter', 'fps', 'call of duty', 'modern warfare', 'black ops', 'battlefield', 'gun', 'warfare', 'sniper', 'combat', 'military', 'war', 'shooting'],
    series: ['call of duty', 'battlefield', 'rainbow six', 'ghost recon', 'sniper elite']
  },
  'قتال': {
    keywords: ['fighting', 'mortal kombat', 'street fighter', 'tekken', 'dragon ball', 'naruto', 'one piece', 'demon slayer', 'brawl', 'combat', 'martial arts', 'boxing', 'wrestling'],
    series: ['mortal kombat', 'street fighter', 'tekken', 'dragon ball', 'naruto', 'one piece']
  },
  'ألعاب أدوار': {
    keywords: ['rpg', 'role playing', 'witcher', 'elden ring', 'dragon', 'souls', 'final fantasy', 'persona', 'yakuza', 'cyberpunk', 'skyrim', 'fallout', 'mass effect', 'character', 'level up', 'stats'],
    series: ['the witcher', 'final fantasy', 'persona', 'yakuza', 'elder scrolls', 'fallout', 'mass effect']
  },
  'عالم مفتوح': {
    keywords: ['open world', 'grand theft auto', 'gta', 'cyberpunk', 'red dead', 'saints row', 'watch dogs', 'just cause', 'mafia', 'exploration', 'sandbox'],
    series: ['grand theft auto', 'red dead', 'saints row', 'watch dogs', 'just cause', 'mafia']
  },
  'تخفي': {
    keywords: ['stealth', 'assassin', 'hitman', 'metal gear', 'dishonored', 'thief', 'splinter cell', 'ninja', 'infiltration', 'sneak'],
    series: ['assassin\'s creed', 'hitman', 'metal gear', 'dishonored', 'splinter cell']
  },
  'منصات': {
    keywords: ['platformer', 'platform', 'mario', 'crash bandicoot', 'ratchet', 'clank', 'sackboy', 'jump', 'puzzle platformer', 'side scrolling'],
    series: ['crash bandicoot', 'ratchet & clank', 'littlebigplanet']
  },
  'ألغاز': {
    keywords: ['puzzle', 'brain', 'logic', 'tetris', 'portal', 'witness', 'baba is you', 'thinking', 'mind', 'strategy puzzle'],
    series: ['portal', 'tetris']
  },
  'استراتيجية': {
    keywords: ['strategy', 'strategic', 'tactics', 'civilization', 'total war', 'command', 'conquer', 'age of empires', 'planning', 'management'],
    series: ['civilization', 'total war', 'age of empires']
  },
  'أطفال': {
    keywords: ['kids', 'children', 'family', 'barbie', 'lego', 'disney', 'cartoon', 'educational', 'learning', 'cute', 'colorful'],
    series: ['lego', 'disney', 'barbie']
  },
  'محاكاة': {
    keywords: ['simulation', 'sim', 'farming', 'city', 'flight', 'truck', 'train', 'life simulation', 'management', 'building'],
    series: ['the sims', 'cities skylines', 'farming simulator']
  },
  'تعاوني': {
    keywords: ['co-op', 'cooperative', 'multiplayer', 'split screen', 'local multiplayer', 'couch coop', 'a way out', 'it takes two', 'overcooked', 'tools up', 'borderlands', 'diablo'],
    series: ['borderlands', 'diablo', 'destiny']
  }
};

// Enhanced web search function for game genre detection
async function searchGameGenre(gameTitle) {
  try {
    console.log(`[Genre Detection] Searching for: ${gameTitle}`);
    
    // Search queries in order of preference
    const searchQueries = [
      `${gameTitle} video game genre`,
      `${gameTitle} game type`,
      `${gameTitle} PlayStation game`,
      `${gameTitle} PS4 PS5 game`
    ];
    
    for (const query of searchQueries) {
      try {
        // Use DuckDuckGo search API (free alternative)
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const response = await axios.get(searchUrl, { timeout: 5000 });
        
        if (response.data && response.data.Abstract) {
          const text = response.data.Abstract.toLowerCase();
          const genre = detectGenreFromText(text, gameTitle);
          if (genre) {
            console.log(`[Genre Detection] Found genre "${genre}" for "${gameTitle}" via search`);
            return genre;
          }
        }
        
        // Also check related topics
        if (response.data && response.data.RelatedTopics) {
          for (const topic of response.data.RelatedTopics.slice(0, 3)) {
            if (topic.Text) {
              const text = topic.Text.toLowerCase();
              const genre = detectGenreFromText(text, gameTitle);
              if (genre) {
                console.log(`[Genre Detection] Found genre "${genre}" for "${gameTitle}" via related topics`);
                return genre;
              }
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.warn(`[Genre Detection] Search failed for query "${query}":`, error.message);
        continue;
      }
    }
    
    // Fallback: analyze game title directly
    const titleGenre = detectGenreFromText(gameTitle.toLowerCase(), gameTitle);
    if (titleGenre) {
      console.log(`[Genre Detection] Found genre "${titleGenre}" for "${gameTitle}" via title analysis`);
      return titleGenre;
    }
    
    console.log(`[Genre Detection] No genre found for "${gameTitle}"`);
    return null;
    
  } catch (error) {
    console.error(`[Genre Detection] Error detecting genre for "${gameTitle}":`, error.message);
    return null;
  }
}

// Detect genre from text content
function detectGenreFromText(text, gameTitle) {
  const lowerText = text.toLowerCase();
  const lowerTitle = gameTitle.toLowerCase();
  
  // Check for series matches first (more specific)
  for (const [arabicGenre, data] of Object.entries(ARABIC_GENRES)) {
    if (data.series) {
      for (const series of data.series) {
        if (lowerTitle.includes(series.toLowerCase()) || lowerText.includes(series.toLowerCase())) {
          return arabicGenre;
        }
      }
    }
  }
  
  // Then check for keyword matches
  for (const [arabicGenre, data] of Object.entries(ARABIC_GENRES)) {
    for (const keyword of data.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return arabicGenre;
      }
    }
  }
  
  return null;
}

// Detect if game supports split-screen/co-op
function detectCoopFeatures(text, gameTitle) {
  const lowerText = text.toLowerCase();
  const lowerTitle = gameTitle.toLowerCase();
  
  const coopKeywords = [
    'split screen', 'split-screen', 'local multiplayer', 'couch coop', 'co-op', 'cooperative',
    'a way out', 'it takes two', 'overcooked', 'tools up', 'borderlands', 'diablo',
    'local co-op', 'shared screen', 'two player', '2 player', 'multiplayer'
  ];
  
  for (const keyword of coopKeywords) {
    if (lowerText.includes(keyword) || lowerTitle.includes(keyword)) {
      return true;
    }
  }
  
  return false;
}

// Main function to analyze game and return Arabic genre and features
async function analyzeGameGenre(gameTitle) {
  try {
    console.log(`[Game Analysis] Starting analysis for: ${gameTitle}`);
    
    const genre = await searchGameGenre(gameTitle);
    
    // For co-op detection, we can use the existing title analysis
    const hasCoop = detectCoopFeatures(gameTitle, gameTitle);
    
    const result = {
      title: gameTitle,
      arabicGenre: genre,
      features: hasCoop ? ['تعاوني'] : [],
      confidence: genre ? 0.8 : 0.1
    };
    
    console.log(`[Game Analysis] Result for "${gameTitle}":`, result);
    return result;
    
  } catch (error) {
    console.error(`[Game Analysis] Error analyzing "${gameTitle}":`, error.message);
    return {
      title: gameTitle,
      arabicGenre: null,
      features: [],
      confidence: 0
    };
  }
}

// Batch analyze multiple games
async function batchAnalyzeGames(games, onProgress = null) {
  const results = [];
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    
    if (onProgress) {
      onProgress(i + 1, games.length, game.title);
    }
    
    try {
      const analysis = await analyzeGameGenre(game.title);
      results.push({
        id: game.id,
        ...analysis
      });
      
      // Rate limiting to avoid overwhelming APIs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`[Batch Analysis] Error analyzing game ${game.id}:`, error.message);
      results.push({
        id: game.id,
        title: game.title,
        arabicGenre: null,
        features: [],
        confidence: 0
      });
    }
  }
  
  return results;
}

module.exports = {
  analyzeGameGenre,
  batchAnalyzeGames,
  detectGenreFromText,
  detectCoopFeatures,
  ARABIC_GENRES
};
