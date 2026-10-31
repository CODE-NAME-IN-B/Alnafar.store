export const ARABIC_LETTERS = [
  'أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر',
  'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف',
  'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const ENGLISH_LETTERS = [
  '#',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

const ALEF_MAP: Record<string, string> = {
  'ا': 'أ',
  'آ': 'أ',
  'إ': 'أ',
  'أ': 'أ',
};

export function firstLetterOf(title: string): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return '';
  const ch = trimmed[0].toUpperCase();
  return ALEF_MAP[ch] ?? ch;
}

export function matchesLetter(title: string, letter: string | null): boolean {
  if (!letter) return true;
  const trimmed = (title || '').trim();
  if (!trimmed) return false;
  const ch = trimmed[0].toUpperCase();
  if (letter === '#') {
    return !(ch >= 'A' && ch <= 'Z');
  }
  return ch === letter.toUpperCase();
}

export function sortGamesAlphabetically<T extends { title?: string | null }>(games: T[]): T[] {
  return [...games].sort((a, b) =>
    (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
  );
}

export const GENRE_AR_LABELS: Record<string, string> = {
  Action: 'أكشن',
  'Action-Adventure': 'أكشن ومغامرة',
  Adventure: 'مغامرة',
  Sports: 'رياضة',
  'Sports / Racing': 'رياضة وسباقات',
  Racing: 'سباقات',
  Shooter: 'تصويب',
  FPS: 'تصويب منظور أول',
  RPG: 'تقمص أدوار (RPG)',
  Action_RPG: 'أكشن وتقمص أدوار',
  'Action RPG': 'أكشن وتقمص أدوار',
  Horror: 'رعب',
  'Survival Horror': 'رعب وبقاء',
  Survival: 'بقاء',
  Fighting: 'قتال',
  Strategy: 'استراتيجية',
  Simulation: 'محاكاة',
  Puzzle: 'ألغاز',
  Platformer: 'منصات',
  Hack_and_Slash: 'هاك آند سلاش',
  Stealth: 'تخفي',
  Open_World: 'عالم مفتوح',
  'Open World': 'عالم مفتوح',
  Kids: 'أطفال وعائلة',
  Family: 'عائلية',
  Coop: 'تعاونية (شاشة مقسومة)',
  Party: 'حفلات وجماعية',
  Anime: 'أنمي',
  Cars: 'سيارات وسباقات',
  Football: 'كرة قدم',
  Wrestling: 'مصارعة',
};

export function formatGenreLabel(genre?: string | null): string {
  if (!genre) return '';
  const trimmed = genre.trim();
  return GENRE_AR_LABELS[trimmed] || trimmed;
}

export function classifyGameHeuristic(game: {
  title?: string | null;
  genre?: string | null;
  series?: string | null;
}): { genre: string; series: string } {
  const title = (game.title || '').toLowerCase();
  let genre = (game.genre || '').trim();
  let series = (game.series || '').trim();

  if (!series) {
    if (title.includes('call of duty') || title.includes('cod ') || title.includes('modern warfare') || title.includes('black ops')) {
      series = 'Call of Duty';
    } else if (title.includes('fifa') || title.includes('ea sports fc') || title.includes('fc 2') || title.includes('pes') || title.includes('efootball')) {
      series = 'EA Sports FC / FIFA';
    } else if (title.includes('gta') || title.includes('grand theft auto')) {
      series = 'Grand Theft Auto';
    } else if (title.includes('assassin')) {
      series = "Assassin's Creed";
    } else if (title.includes('resident evil')) {
      series = 'Resident Evil';
    } else if (title.includes('need for speed') || title.includes('nfs')) {
      series = 'Need for Speed';
    } else if (title.includes('god of war')) {
      series = 'God of War';
    } else if (title.includes('spider-man') || title.includes('spiderman')) {
      series = 'Spider-Man';
    } else if (title.includes('far cry')) {
      series = 'Far Cry';
    } else if (title.includes('mortal kombat') || title.includes('tekken') || title.includes('street fighter') || title.includes('wwe')) {
      series = 'ألعاب قتال ومصارعة';
    }
  }

  if (!genre) {
    if (series === 'EA Sports FC / FIFA' || title.includes('nba') || title.includes('ufc') || title.includes('wwe') || title.includes('tennis')) {
      genre = 'رياضة';
    } else if (series === 'Need for Speed' || title.includes('gran turismo') || title.includes('forza') || title.includes('dirt') || title.includes('f1 ') || title.includes('crew') || title.includes('corsa')) {
      genre = 'سباقات';
    } else if (series === 'Call of Duty' || title.includes('battlefield') || title.includes('doom') || title.includes('halo') || title.includes('sniper') || title.includes('wolfenstein')) {
      genre = 'تصويب';
    } else if (series === 'Resident Evil' || title.includes('silent hill') || title.includes('outlast') || title.includes('evil within') || title.includes('until dawn') || title.includes('quarry') || title.includes('dead space')) {
      genre = 'رعب';
    } else if (title.includes('mortal kombat') || title.includes('tekken') || title.includes('street fighter') || title.includes('injustice') || title.includes('brawlhalla') || title.includes('dragon ball') || title.includes('naruto')) {
      genre = 'قتال';
    } else if (title.includes('crash') || title.includes('sonic') || title.includes('mario') || title.includes('sponge') || title.includes('lego') || title.includes('ratchet') || title.includes('sackboy') || title.includes('rayman') || title.includes('astro')) {
      genre = 'أطفال وعائلة';
    } else if (title.includes('witcher') || title.includes('elden ring') || title.includes('souls') || title.includes('skyrim') || title.includes('final fantasy') || title.includes('persona') || title.includes('cyberpunk') || title.includes('diablo')) {
      genre = 'تقمص أدوار (RPG)';
    } else if (series === 'Grand Theft Auto' || title.includes('red dead') || title.includes('watch dogs') || title.includes('mafia') || title.includes('horizon') || title.includes('ghost of tsushima') || title.includes('days gone')) {
      genre = 'عالم مفتوح';
    } else {
      genre = 'أكشن ومغامرة';
    }
  } else {
    genre = formatGenreLabel(genre);
  }

  return { genre, series };
}
