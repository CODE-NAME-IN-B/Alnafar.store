import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import AppInput from '@/components/ui/AppInput';
import Icon from '@/components/ui/Icon';
import { AR_FONT } from '@/design/fonts';
import { usePalette } from '@/design/theme';
import { ROW } from '@/lib/rtl';

const LOGO_MARK = require('../../assets/_brand/logo-mark.png');
const LOGO_FULL = require('../../assets/_brand/logo.png');

export default function LoginScreen() {
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const enterGuest = useAuthStore((s) => s.enterGuest);
  const selectBranch = useAppStore((s) => s.selectBranch);
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);
  const palette = usePalette();
  const dark = palette.name === 'dark';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!username.trim() || !password) {
      setErr('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setBusy(true);
    try {
      const ok = await loginWithPassword(username.trim(), password);
      if (!ok) {
        setErr(useAuthStore.getState().lastError || 'فشل تسجيل الدخول — تحقق من البيانات');
        return;
      }
      const me = useAuthStore.getState().user;
      if (me?.branch_id) {
        selectBranch(me.branch_id);
      } else if (!selectedBranchId) {
        selectBranch(1);
      }
      router.replace('/(store)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'فشل تسجيل الدخول';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleGuest = async () => {
    if (!selectedBranchId) {
      await selectBranch(1);
    }
    await enterGuest();
    router.replace('/(store)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.canvas }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandBlock}>
            <View
              style={[
                styles.logoFrame,
                {
                  backgroundColor: dark ? palette.surface : palette.surfaceRaised,
                  borderColor: palette.surfaceLine,
                },
              ]}
            >
              <Image
                source={dark ? LOGO_MARK : LOGO_FULL}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text
              style={[styles.brandTitle, { color: palette.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              الشاردة ستور
            </Text>
            <Text style={[styles.brandSubtitle, { color: palette.textSub }]}>
              النفار للألعاب • بلايستيشن و PC
            </Text>
          </View>

          {/* Login Form Bento Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: palette.surface,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.cardBadge,
                  {
                    backgroundColor: palette.surfaceRaised,
                    borderColor: palette.surfaceLine,
                  },
                ]}
              >
                <Icon name="lock" size={16} color={palette.primary} />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.cardTitle, { color: palette.text }]}>
                  دخول الموظفين والكاشير
                </Text>
                <Text style={[styles.cardDesc, { color: palette.textSub }]}>
                  سجّل دخولك لإصدار الفواتير وإدارة المتجر
                </Text>
              </View>
            </View>

            <View style={styles.fieldsWrap}>
              <AppInput
                label="اسم المستخدم"
                value={username}
                onChangeText={setUsername}
                icon="user"
                returnKeyType="next"
              />
              <AppInput
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secure
                icon="lock"
                returnKeyType="done"
                onSubmitEditing={submit}
              />
            </View>

            {err ? (
              <View
                style={[
                  styles.errBox,
                  {
                    borderColor: palette.danger,
                    backgroundColor: palette.danger + '18',
                  },
                ]}
              >
                <Icon name="alert" size={16} color={palette.danger} />
                <Text style={[styles.errText, { color: palette.danger }]}>{err}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={busy}
              style={({ pressed }) => [
                styles.loginBtn,
                {
                  backgroundColor: pressed ? palette.primaryPressed : palette.primary,
                },
                busy && styles.btnDisabled,
              ]}
            >
              {busy ? (
                <ActivityIndicator color={palette.onPrimary} />
              ) : (
                <View style={styles.btnRow}>
                  <Icon name="login" size={18} color={palette.onPrimary} />
                  <Text style={[styles.loginBtnText, { color: palette.onPrimary }]}>
                    تسجيل الدخول للكاشير
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: palette.surfaceLine }]} />
            <Text style={[styles.dividerLabel, { color: palette.textSub }]}>
              أو تصفح المتجر كزبون
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: palette.surfaceLine }]} />
          </View>

          {/* Prominent Guest Bento Button */}
          <Pressable
            onPress={handleGuest}
            style={({ pressed }) => [
              styles.guestBtn,
              {
                backgroundColor: pressed ? palette.surfaceLine : palette.surfaceRaised,
                borderColor: palette.surfaceLine,
              },
            ]}
          >
            <View
              style={[
                styles.guestIconWrap,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.surfaceLine,
                },
              ]}
            >
              <Icon name="store" size={20} color={palette.primary} />
            </View>
            <View style={styles.guestTextCol}>
              <Text style={[styles.guestTitle, { color: palette.text }]}>
                دخول كضيف — تصفح المتجر الآن
              </Text>
              <Text style={[styles.guestSubtitle, { color: palette.textSub }]}>
                استعرض جميع الألعاب والأسعار وأرسل طلبك بسهولة
              </Text>
            </View>
            <Icon name="arrow-left" size={18} color={palette.primary} />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 16,
  },
  logoFrame: {
    width: 90,
    height: 90,
    borderRadius: 24,
    padding: 6,
    borderWidth: 1.5,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  brandTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 22,
    includeFontPadding: false,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: AR_FONT.medium,
    fontSize: 13,
    marginTop: 4,
    includeFontPadding: false,
  },
  card: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cardDesc: {
    fontFamily: AR_FONT.regular,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
    includeFontPadding: false,
  },
  fieldsWrap: {
    gap: 14,
  },
  errBox: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errText: {
    flex: 1,
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  loginBtn: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    fontFamily: AR_FONT.bold,
    fontSize: 15,
    includeFontPadding: false,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontFamily: AR_FONT.medium,
    fontSize: 12,
    includeFontPadding: false,
  },
  guestBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    fontFamily: AR_FONT.bold,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  guestSubtitle: {
    fontFamily: AR_FONT.regular,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
