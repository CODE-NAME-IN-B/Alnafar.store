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
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

const LOGO = require('../../assets/_brand/logo.png');

export default function LoginScreen() {
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const enterGuest = useAuthStore((s) => s.enterGuest);
  const selectBranch = useAppStore((s) => s.selectBranch);
  const selectedBranchId = useAppStore((s) => s.selectedBranchId);

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
        setErr(useAuthStore.getState().lastError || 'فشل تسجيل الدخول');
        return;
      }
      const me = useAuthStore.getState().user;
      if (me?.branch_id) {
        selectBranch(me.branch_id);
      } else if (!selectedBranchId) {
        selectBranch(1);
      }
      // After login, go to Store (Cashier POS view) with direct access to Admin dashboard
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Header */}
          <View style={styles.brandBlock}>
            <View style={styles.logoFrame}>
              <Image source={LOGO} style={styles.logo} resizeMode="cover" />
            </View>
            <Text style={styles.brandTitle}>الشارده ستور</Text>
            <Text style={styles.brandSubtitle}>النفار للألعاب • بلايستيشن و PC</Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardBadge}>
                <Icon name="lock" size={14} color="#2dd4bf" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>دخول الموظفين والكاشير</Text>
                <Text style={styles.cardDesc}>
                  سجّل دخولك لإصدار الفواتير وإدارة المتجر
                </Text>
              </View>
            </View>

            <View style={styles.fieldsWrap}>
              <AppInput
                label="اسم المستخدم"
                value={username}
                onChangeText={setUsername}
                placeholder="مثال: admin أو cashier"
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
              <View style={styles.errBox}>
                <Icon name="alert" size={16} color="#f87171" />
                <Text style={styles.errText}>{err}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={busy}
              style={[styles.loginBtn, busy && styles.btnDisabled]}
            >
              {busy ? (
                <ActivityIndicator color="#042f2e" />
              ) : (
                <View style={styles.btnRow}>
                  <Icon name="login" size={19} color="#042f2e" />
                  <Text style={styles.loginBtnText}>تسجيل الدخول للكاشير</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>أو تصفح المتجر كزبون</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Prominent Guest Button */}
          <Pressable onPress={handleGuest} style={styles.guestBtn}>
            <View style={styles.guestIconWrap}>
              <Icon name="store" size={20} color="#c4b5fd" />
            </View>
            <View style={styles.guestTextCol}>
              <Text style={styles.guestTitle}>دخول كضيف — تصفح المتجر الآن</Text>
              <Text style={styles.guestSubtitle}>
                استعرض جميع الألعاب والأسعار وأرسل طلبك عبر واتساب
              </Text>
            </View>
            <Icon name="arrow-left" size={18} color="#c4b5fd" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#090f1d',
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
  },
  logoFrame: {
    width: 84,
    height: 84,
    borderRadius: 24,
    padding: 3,
    backgroundColor: '#131d31',
    borderWidth: 2,
    borderColor: '#14b8a6',
    marginBottom: 10,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  brandTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 24,
    includeFontPadding: false,
  },
  brandSubtitle: {
    fontFamily: FONT.medium,
    color: '#2dd4bf',
    fontSize: 13,
    marginTop: 2,
    includeFontPadding: false,
  },
  card: {
    backgroundColor: '#131d31',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(20, 184, 166, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cardDesc: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
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
    backgroundColor: 'rgba(127, 29, 29, 0.35)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errText: {
    flex: 1,
    fontFamily: FONT.medium,
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  loginBtn: {
    marginTop: 18,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#14b8a6',
    borderWidth: 1,
    borderColor: '#5eead4',
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
    fontFamily: FONT.bold,
    color: '#042f2e',
    fontSize: 16,
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
    backgroundColor: '#1e293b',
  },
  dividerLabel: {
    fontFamily: FONT.medium,
    color: '#64748b',
    fontSize: 12,
    includeFontPadding: false,
  },
  guestBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#171430',
    borderWidth: 1.5,
    borderColor: '#7c3aed',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  guestIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    fontFamily: FONT.bold,
    color: '#f5f3ff',
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  guestSubtitle: {
    fontFamily: FONT.regular,
    color: '#c4b5fd',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
});
