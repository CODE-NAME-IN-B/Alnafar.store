/**
 * بوابة اختيار الفرع — أول شاشة للزبون (مشابهة لتدفق الويب).
 * تُعرض بدل التبويبات حتى يختار الزائر فرعاً (أو يكمل بقيم الفرع الرئيسي).
 */
import { Image } from 'expo-image';
import { Text, View, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import { LoadingState, ErrorState } from '@/components/ui/StateView';
import { fetchBranches } from '@/api/branches';
import { FONT } from '@/lib/fonts';
import { useAppStore } from '@/stores/app';
export default function BranchGate() {
  const selectBranch = useAppStore((s) => s.selectBranch);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branches'],
    queryFn: fetchBranches,
  });

  const changeLater = () => {
    // الفرع الرئيسي افتراضياً إن فشل الجلب — يعود الزائر لتغييره من الزر لاحقاً
    const list = data ?? [];
    const main = list.find((b) => !!b.is_main) ?? list[0];
    selectBranch(main ? Number(main.id) : 1);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../../assets/_brand/icon.png')}
          style={{ width: 96, height: 96, alignSelf: 'center', borderRadius: 22, marginBottom: 16 }}
          contentFit="cover"
          accessibilityLabel="شعار المتجر"
        />
        <AppText
          style={{
            color: '#f1f5f9',
            fontFamily: FONT.bold,
            fontSize: 24,
            textAlign: 'center',
          }}
        >
          مرحباً بك في الشارده ستور
        </AppText>
        <AppText
          style={{
            color: '#94a3b8',
            fontFamily: FONT.regular,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 22,
          }}
        >
          اختر الفرع الأقرب لتصفح ألعابنا ونشاطاتنا في ذلك الفرع
        </AppText>

        {isLoading ? <LoadingState message="جاري جلب الفروع..." /> : null}
        {isError ? (
          <ErrorState
            message="تعذر جلب الفروع، تحقق من الاتصال"
            onRetry={() => refetch()}
          />
        ) : null}
        {data ? (
          <View style={{ gap: 10 }}>
            {data.map((branch) => (
              <Pressable
                key={branch.id}
                onPress={() => selectBranch(branch.id)}
                style={{
                  backgroundColor: '#141e30',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: branch.is_main ? 'rgba(20,184,166,0.35)' : 'rgba(255,255,255,0.08)',
                  padding: 14,
                }}
              >
                <Text style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 16 }}>
                  {branch.name}
                  {branch.is_main ? '  •فرع رئيسي' : ''}
                </Text>
                {branch.address ? (
                  <Text style={{ color: '#94a3b8', fontFamily: FONT.regular, marginTop: 4 }}>
                    {branch.address}
                  </Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        <Pressable onPress={changeLater} style={{ marginTop: 18, padding: 10 }}>
          <Text style={{ color: '#64748b', fontFamily: FONT.regular, textAlign: 'center' }}>
            تصفح الفرع الرئيسي (يمكن تغييره لاحقاً)
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
