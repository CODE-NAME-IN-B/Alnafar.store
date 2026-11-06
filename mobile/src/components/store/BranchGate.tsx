/**
 * بوابة اختيار الفرع — أول شاشة للزبون (مصممة وفق v4 Modern Minimalism).
 */
import React from 'react';
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
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { useAppStore } from '@/stores/app';

export default function BranchGate() {
  const palette = usePalette();
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
          paddingVertical: 28,
          justifyContent: 'center',
          backgroundColor: palette.canvas,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.surfaceLine,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Image
              source={require('../../../assets/_brand/logo-mark.png')}
              style={{ width: 60, height: 60 }}
              contentFit="contain"
              accessibilityLabel="شعار المتجر"
            />
          </View>
          <AppText
            style={{
              color: palette.text,
              fontFamily: AR_FONT.bold,
              fontSize: 22,
              textAlign: 'center',
            }}
          >
            مرحباً بك في الشاردة ستور
          </AppText>
          <AppText
            style={{
              color: palette.textSub,
              fontFamily: AR_FONT.regular,
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
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
          <View style={{ gap: 12, marginBottom: 24 }}>
            {data.map((branch) => {
              const isMain = !!branch.is_main;
              return (
                <Pressable
                  key={branch.id}
                  onPress={() => selectBranch(branch.id)}
                  style={{
                    backgroundColor: palette.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: isMain ? palette.primary : palette.surfaceLine,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isMain
                        ? palette.surfaceRaised
                        : palette.surfaceRaised,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name="branch"
                      size={20}
                      color={isMain ? palette.primary : palette.textSub}
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
                          color: palette.text,
                          fontFamily: AR_FONT.bold,
                          fontSize: 15,
                          textAlign: 'right',
                        }}
                      >
                        {branch.name}
                      </Text>
                      {isMain ? (
                        <View
                          style={{
                            backgroundColor: palette.surfaceRaised,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderWidth: 1,
                            borderColor: palette.primary,
                          }}
                        >
                          <Text
                            style={{
                              color: palette.primary,
                              fontFamily: AR_FONT.bold,
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
                          color: palette.textSub,
                          fontFamily: AR_FONT.regular,
                          fontSize: 12,
                          marginTop: 4,
                          textAlign: 'right',
                        }}
                      >
                        {branch.address}
                      </Text>
                    ) : null}
                  </View>

                  <Icon name="arrow-left" size={16} color={palette.textFaint} />
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
