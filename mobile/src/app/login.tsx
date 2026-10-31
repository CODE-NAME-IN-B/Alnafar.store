import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { useForm, Controller } from 'react-hook-form';
import Screen from '@/components/ui/Screen';
import AppText from '@/components/ui/AppText';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import { useAuthStore } from '@/stores/auth';
import { FONT } from '@/lib/fonts';

const MIN_USERNAME = 2;
const MIN_PASSWORD = 4;

/** شاشة دخول الموظف/المدير — توكن من الخادم يبقى في SecureStore */
export default function LoginScreen() {
  const login = useAuthStore((s) => s.loginWithPassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<{ username: string; password: string }>({
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (values.username.trim().length < MIN_USERNAME) {
      setError('اسم المستخدم مطلوب');
      return;
    }
    if (values.password.length < MIN_PASSWORD) {
      setError('كلمة المرور قصيرة جداً');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const ok = await login(values.username.trim(), values.password);
      if (ok) {
        router.replace('/(admin)');
      } else {
        setError('فشل تسجيل الدخول، تحقق من الاسم وكلمة المرور');
      }
    } catch {
      setError('فشل تسجيل الدخول، تحقق من الاسم وكلمة المرور');
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Link href="/(store)" asChild>
          <Pressable accessible accessibilityLabel="عودة إلى المتجر">
            <Text style={{ color: '#14b8a6', fontFamily: FONT.medium, marginBottom: 18 }}>
              ← رجوع إلى المتجر
            </Text>
          </Pressable>
        </Link>

        <Image
          source={require('../../assets/_brand/icon.png')}
          style={{ width: 80, height: 80, alignSelf: 'center', borderRadius: 18, marginBottom: 16 }}
          contentFit="cover"
          accessibilityLabel="شعار المتجر"
        />
        <AppText
          style={{ color: '#f1f5f9', fontFamily: FONT.bold, fontSize: 22, textAlign: 'center' }}
        >
          دخول العاملين
        </AppText>
        <AppText
          style={{
            color: '#94a3b8',
            fontFamily: FONT.regular,
            textAlign: 'center',
            marginTop: 6,
            marginBottom: 24,
          }}
        >
          حساب لفريق المتجر (موظف/مدير) — الزبون يتصفح كضيف بلا حساب
        </AppText>

        <View style={{ gap: 16 }}>
          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange } }) => (
              <AppInput
                label="اسم المستخدم"
                placeholder="أدخل اسم المستخدم"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field: { value, onChange } }) => (
              <AppInput
                label="كلمة المرور"
                placeholder="أدخل كلمة المرور"
                value={value}
                onChangeText={onChange}
                secure
              />
            )}
          />
          {error ? (
            <AppText style={{ color: '#ef4444', fontFamily: FONT.regular }}>{error}</AppText>
          ) : null}
          <AppButton
            label="تسجيل الدخول"
            onPress={onSubmit}
            loading={busy}
            testID="login-submit"
          />
        </View>
      </View>
    </Screen>
  );
}
