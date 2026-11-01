/**
 * بوابة اختيار الفرع — أول شاشة للزبون (مصممة وفق ui-ux-pro-max وهوية النفار).
 */
import { Image } from 'expo-image';
import { Text, View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import AppButton from '@/components/ui/AppButton';
import Icon from '@/components/ui/Icon';
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

  const selectMainBranch = () => {
    const list = data ?? [];
    const main = list.find((b) => !!b.is_main) ?? list[0];
    selectBranch(main ? Number(main.id) : 1);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 24,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 26,
              backgroundColor: '#141e30',
              borderWidth: 1.5,
              borderColor: 'rgba(45,212,191,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Image
              source={require('../../../assets/_brand/logo.png')}
              style={{ width: 68, height: 68 }}
              contentFit="contain"
              accessibilityLabel="شعار المتجر"
            />
          </View>
          <AppText
            style={{
              color: '#f8fafc',
              fontFamily: FONT.bold,
              fontSize: 24,
              textAlign: 'center',
            }}
          >
            مرحباً بك في الشاردة ستور
          </AppText>
          <AppText
            style={{
              color: '#cbd5e1',
              fontFamily: FONT.regular,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 6,
            }}
          >
            اختر الفرع الأقرب إليك لتصفح مكتبة الألعاب والباقات والطلب المباشر
          </AppText>
        </View>

        {isLoading ? <LoadingState message="جاري جلب الفروع المتاحة..." /> : null}
        {isError ? (
          <ErrorState
            message="تعذر جلب الفروع، تحقق من الاتصال بالإنترنت"
            onRetry={() => refetch()}
          />
        ) : null}

        {data ? (
          <View style={{ gap: 12, marginBottom: 20 }}>
            {data.map((branch) => {
              const isMain = !!branch.is_main;
              return (
                <Pressable
                  key={branch.id}
                  onPress={() => selectBranch(branch.id)}
                  style={{
                    backgroundColor: '#141e30',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: isMain ? '#14b8a6' : 'rgba(255, 255, 255, 0.1)',
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      backgroundColor: isMain
                        ? 'rgba(20,184,166,0.18)'
                        : 'rgba(255,255,255,0.06)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name="branch"
                      size={22}
                      color={isMain ? '#2dd4bf' : '#94a3b8'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text
                        style={{
                          color: '#f8fafc',
                          fontFamily: FONT.bold,
                          fontSize: 16,
                          textAlign: 'right',
                        }}
                      >
                        {branch.name}
                      </Text>
                      {isMain ? (
                        <View
                          style={{
                            backgroundColor: 'rgba(20,184,166,0.2)',
                            borderRadius: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              color: '#2dd4bf',
                              fontFamily: FONT.bold,
                              fontSize: 11,
                            }}
                          >
                            الفرع الرئيسي
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {branch.address ? (
                      <Text
                        style={{
                          color: '#cbd5e1',
                          fontFamily: FONT.regular,
                          fontSize: 13,
                          marginTop: 4,
                          textAlign: 'right',
                        }}
                      >
                        {branch.address}
                      </Text>
                    ) : null}
                  </View>

                  <Icon name="arrow-left" size={18} color="#2dd4bf" />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <View style={{ gap: 10 }}>
          <AppButton
            label="الدخول السريع للفرع الرئيسي"
            icon="store"
            onPress={selectMainBranch}
          />
          <AppButton
            label="دخول الموظفين والإدارة"
            variant="secondary"
            icon="login"
            onPress={() => router.push('/login')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
