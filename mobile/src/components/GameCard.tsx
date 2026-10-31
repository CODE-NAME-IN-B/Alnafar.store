import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { FONT } from '@/lib/fonts';
import type { Category, Game } from '@/api/types';
import { isPs4Game, mainPriceOf, ps5PriceOf } from '@/lib/gamePrices';

interface Props {
  game: Game;
  categories?: Category[];
  /** الفتح لاختيار نسخة (لألعاب PS4) أو الإضافة المباشرة للسلة */
  onOpen: (game: Game) => void;
}

function badge(label: string, bg: string, fg: string) {
  return (
    <View style={[pill, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontFamily: FONT.medium, fontSize: 11 }}>{label}</Text>
    </View>
  );
}

/** بطاقة لعبة في شبكة المتجر — أصلية بالكامل (expo-image) */
export default function GameCard({ game, categories = [], onOpen }: Props) {
  const split = hasSplitScreen(game);
  const showDualPrices = isPs4Game(game, categories);
  const categoryName = categories.find((c) => Number(c.id) === Number(game.category_id))?.name;

  return (
    <Pressable
      onPress={() => onOpen(game)}
      style={{
        backgroundColor: '#141e30',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        overflow: 'hidden',
        flex: 1,
        margin: 6,
      }}
    >
      <Image
        source={{ uri: game.image }}
        style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: '#0b1220' }}
        contentFit="cover"
        transition={150}
        accessibilityLabel={`غلاف لعبة ${game.title}`}
      />
      <View style={{ padding: 10, gap: 6 }}>
        <Text
          numberOfLines={2}
          style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14, minHeight: 40 }}
        >
          {game.title}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {showDualPrices ? (
            <>
              {badge(
                `فور ${Number(game.price).toLocaleString('en-US')} د.ل`,
                'rgba(20,184,166,0.15)',
                '#2dd4bf'
              )}
              {badge(
                `فايف ${Number(ps5PriceOf(game)).toLocaleString('en-US')} د.ل`,
                'rgba(138,92,255,0.16)',
                '#a78bfa'
              )}
            </>
          ) : (
            <>
              {badge(
                `${Number(mainPriceOf(game)).toLocaleString('en-US')} د.ل`,
                'rgba(20,184,166,0.15)',
                '#2dd4bf'
              )}
              {categoryName
                ? badge(categoryName, 'rgba(138,92,255,0.16)', '#a78bfa')
                : null}
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {game.series ? badge(game.series, 'rgba(100,116,139,0.2)', '#cbd5e1') : null}
          {game.size_gb
            ? badge(`${Math.round(Number(game.size_gb))} GB`, 'rgba(59,130,246,0.15)', '#93c5fd')
            : null}
          {split ? badge('تقسيم الشاشة', 'rgba(34,197,94,0.15)', '#86efac') : null}
        </View>
      </View>
    </Pressable>
  );
}

/** شريحة صغيرة */
const pill = {
  paddingHorizontal: 6,
  paddingVertical: 3,
  borderRadius: 6,
} as const;

export function hasSplitScreen(game: Game): boolean {
  const haystack = `${game.genre ?? ''} ${game.series ?? ''} ${game.features ?? ''} ${game.title ?? ''}`;
  return (
    haystack.includes('تقسيم') ||
    haystack.includes('سبليت') ||
    haystack.toLowerCase().includes('split')
  );
}
