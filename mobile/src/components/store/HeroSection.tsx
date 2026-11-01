import React, { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Branch } from '@/api/types';
import Icon from '@/components/ui/Icon';
import { FONT } from '@/lib/fonts';
import { ROW } from '@/lib/rtl';

const BANNERS = [
  require('../../../assets/_brand/cover.png'),
  require('../../../assets/_brand/cover2.jpg'),
];

interface Props {
  branches: Branch[];
  selectedBranchId: number | null;
  onSelectBranch: (id: number) => void;
  isCashier?: boolean;
  onOpenAdmin?: () => void;
}

export default function HeroSection({
  branches,
  selectedBranchId,
  onSelectBranch,
  isCashier,
  onOpenAdmin,
}: Props) {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const callPhone = (phoneStr: string) => {
    const firstPhone = phoneStr.split('-')[0]?.trim();
    if (firstPhone) {
      Linking.openURL(`tel:${firstPhone}`).catch(() => {});
    }
  };

  return (
    <View style={styles.wrap}>
      {/* Promotional Hero Banner Slider */}
      <Pressable
        onPress={() => setSlideIdx((prev) => (prev + 1) % BANNERS.length)}
        style={styles.bannerCard}
      >
        <Image
          source={BANNERS[slideIdx]}
          style={styles.bannerImg}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerTextWrap}>
            <View style={styles.promoPill}>
              <Icon name="sparkles" size={12} color="#2dd4bf" />
              <Text style={styles.promoPillText}>الشاردة ستور — النفار للألعاب</Text>
            </View>
            <Text style={styles.bannerTitle}>اختر الألعاب التي تريدها</Text>
            <Text style={styles.bannerSub}>
              تصفّح المكتبة، أضف للسلة، وأكمل طلبك بسهولة
            </Text>
          </View>
          <View style={styles.dotsRow}>
            {BANNERS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === slideIdx && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </Pressable>

      {/* Cashier Mode Banner OR Guest Branches & Addresses Cards */}
      {isCashier ? (
        <View style={styles.cashierBar}>
          <View style={styles.cashierInfo}>
            <View style={styles.cashierBadge}>
              <Icon name="printer" size={14} color="#042f2e" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cashierTitle}>وضع الكاشير نشط</Text>
              <Text style={styles.cashierSub}>
                اختر الألعاب ثم افتح السلة لإصدار فاتورة فورية وطباعتها
              </Text>
            </View>
          </View>
          {onOpenAdmin ? (
            <Pressable onPress={onOpenAdmin} style={styles.adminQuickBtn}>
              <Icon name="invoice" size={14} color="#2dd4bf" />
              <Text style={styles.adminQuickText}>الفواتير والإدارة</Text>
            </Pressable>
          ) : null}
        </View>
      ) : branches.length > 0 ? (
        <View style={styles.branchesSection}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <Icon name="branch" size={15} color="#2dd4bf" />
              <Text style={styles.sectionTitle}>فروعنا وعناويننا</Text>
            </View>
            <Text style={styles.sectionHint}>اختر الفرع لإرسال طلبك</Text>
          </View>
          <View style={styles.branchesGrid}>
            {branches.map((b) => {
              const active = selectedBranchId === b.id;
              return (
                <Pressable
                  key={b.id}
                  onPress={() => onSelectBranch(b.id)}
                  style={[styles.branchCard, active && styles.branchCardActive]}
                >
                  <View style={styles.branchTopRow}>
                    <View style={styles.branchTitleRow}>
                      <View
                        style={[
                          styles.radioDot,
                          active && styles.radioDotActive,
                        ]}
                      />
                      <Text
                        style={[
                          styles.branchName,
                          active && styles.branchNameActive,
                        ]}
                        numberOfLines={1}
                      >
                        {b.name}
                      </Text>
                    </View>
                    {b.is_main ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>رئيسي</Text>
                      </View>
                    ) : null}
                  </View>

                  {b.address ? (
                    <Text style={styles.branchAddress} numberOfLines={2}>
                      📍 {b.address}
                    </Text>
                  ) : null}

                  {b.phone ? (
                    <Pressable
                      onPress={() => callPhone(b.phone!)}
                      style={styles.phoneRow}
                    >
                      <Icon name="phone" size={12} color="#2dd4bf" />
                      <Text style={styles.branchPhone} numberOfLines={1}>
                        {b.phone}
                      </Text>
                    </Pressable>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    gap: 10,
  },
  flex1: { flex: 1 },
  bannerCard: {
    height: 158,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#131d31',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(6, 11, 22, 0.52)',
    padding: 14,
    justifyContent: 'space-between',
  },
  bannerTextWrap: {
    alignItems: 'flex-end',
    gap: 3,
  },
  promoPill: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 2,
  },
  promoPillText: {
    fontFamily: FONT.bold,
    color: '#5eead4',
    fontSize: 10,
    includeFontPadding: false,
  },
  bannerTitle: {
    fontFamily: FONT.bold,
    color: '#ffffff',
    fontSize: 19,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  bannerSub: {
    fontFamily: FONT.medium,
    color: '#e2e8f0',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 20,
    backgroundColor: '#14b8a6',
  },
  cashierBar: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#072a28',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  cashierInfo: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 10,
  },
  cashierBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#2dd4bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashierTitle: {
    fontFamily: FONT.bold,
    color: '#5eead4',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  cashierSub: {
    fontFamily: FONT.regular,
    color: '#cbd5e1',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  adminQuickBtn: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#2dd4bf',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  adminQuickText: {
    fontFamily: FONT.bold,
    color: '#2dd4bf',
    fontSize: 11,
    includeFontPadding: false,
  },
  branchesSection: {
    backgroundColor: '#0d1629',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  sectionHead: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
    fontSize: 14,
    includeFontPadding: false,
  },
  sectionHint: {
    fontFamily: FONT.medium,
    color: '#94a3b8',
    fontSize: 11,
    includeFontPadding: false,
  },
  branchesGrid: {
    gap: 8,
  },
  branchCard: {
    backgroundColor: '#131d31',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  branchCardActive: {
    backgroundColor: '#082f2d',
    borderColor: '#14b8a6',
  },
  branchTopRow: {
    flexDirection: ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  branchTitleRow: {
    flex: 1,
    flexDirection: ROW,
    alignItems: 'center',
    gap: 8,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#475569',
  },
  radioDotActive: {
    borderColor: '#2dd4bf',
    backgroundColor: '#14b8a6',
  },
  branchName: {
    flex: 1,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  branchNameActive: {
    color: '#5eead4',
  },
  defaultBadge: {
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    borderWidth: 1,
    borderColor: '#14b8a6',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontFamily: FONT.bold,
    color: '#5eead4',
    fontSize: 10,
    includeFontPadding: false,
  },
  branchAddress: {
    fontFamily: FONT.regular,
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  phoneRow: {
    flexDirection: ROW,
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  branchPhone: {
    fontFamily: FONT.semibold,
    color: '#2dd4bf',
    fontSize: 12,
    textAlign: 'right',
    includeFontPadding: false,
  },
});
