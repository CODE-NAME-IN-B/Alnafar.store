import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicTopGames } from '@/api/stats';
import { FONT } from '@/lib/fonts';
import { formatDinar } from '@/lib/money';
import type { Game } from '@/api/types';

interface Props {
  onSelectGame: (game: Game) => void;
}

/** شريط الألعاب الأكثر طلباً في المتجر (TopList) */
export default function TopList({ onSelectGame }: Props) {
  const { data } = useQuery({
    queryKey: ['public-top-games'],
    queryFn: fetchPublicTopGames,
    staleTime: 5 * 60_000,
  });

  if (!data || data.length === 0) return null;

  return (
    <View style={{ paddingTop: 6, paddingBottom: 4 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          marginBottom: 6,
        }}
      >
        <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 14 }}>
          🔥 الأكثر طلباً
        </Text>
        <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 11 }}>
          اسحب لاستعراض القائمة
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
      >
        {data.map((g, idx) => {
          const rankBg =
            idx === 0
              ? 'rgba(234,179,8,0.2)'
              : idx === 1
                ? 'rgba(148,163,184,0.2)'
                : idx === 2
                  ? 'rgba(249,115,22,0.2)'
                  : 'rgba(255,255,255,0.06)';
          const rankFg =
            idx === 0
              ? '#facc15'
              : idx === 1
                ? '#cbd5e1'
                : idx === 2
                  ? '#fb923c'
                  : '#94a3b8';

          return (
            <Pressable
              key={`${g.id}-${idx}`}
              onPress={() =>
                onSelectGame({
                  id: g.id,
                  title: g.title,
                  image: g.image,
                  price: g.price,
                  price_ps5: g.price_ps5,
                  category_id: g.category_id,
                  size_gb: g.size_gb,
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#141e30',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(20,184,166,0.2)',
                padding: 8,
                width: 215,
              }}
              accessible
              accessibilityLabel={`إضافة ${g.title} من الأكثر طلباً`}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  backgroundColor: rankBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: rankFg, fontFamily: FONT.bold, fontSize: 12 }}>
                  {idx + 1}
                </Text>
              </View>

              <Image
                source={{ uri: g.image }}
                style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#0b1220' }}
                contentFit="cover"
              />

              <View style={{ flex: 1 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 12 }}
                >
                  {g.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={{ color: '#2dd4bf', fontFamily: FONT.bold, fontSize: 11 }}>
                    {formatDinar(g.price)}
                  </Text>
                  <Text style={{ color: '#64748b', fontFamily: FONT.regular, fontSize: 10 }}>
                    • {g.count} طلب
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
