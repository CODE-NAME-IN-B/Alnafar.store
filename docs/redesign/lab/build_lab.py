# -*- coding: utf-8 -*-
"""
Generator for docs/redesign/lab/index.html
Standalone Design Lab for Al-Sharida Store Redesign (v4 / Modern Minimalism)
Strict constraints:
- < 100 KB total file size
- 0 external network requests
- Light Cream (#F5F1E8) / Dark Forest (#121610)
- 12 comprehensive interactive screens
- 8 motion replay animations
"""

import os

html_content = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>مختبر تصميم الشاردة ستور — Design Lab v4</title>
<style>
/* CSS Reset & Tokens */
:root {
  --canvas: #F5F1E8;
  --canvas-grad: #EFEADD;
  --surface: #FBF9F3;
  --surface-raised: #F7F3EA;
  --surface-line: #E3DDCB;
  --text: #1B2A21;
  --text-sub: #5E6F63;
  --text-faint: #7A877C;
  --primary: #2D6A4F;
  --on-primary: #FFFFFF;
  --primary-pressed: #244F43;
  --accent: #C5DE8F;
  --on-accent: #1B2A21;
  --money: #1B2A21;
  --danger: #C0473A;
  --warning: #A8732A;
  --success: #2F7D46;
  --receipt-paper: #FFFFFF;
  --scrim: rgba(11, 13, 9, 0.45);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-pill: 9999px;
  --ease-signature: cubic-bezier(0.18, 0.7, 0.25, 1);
}

[data-theme="dark"] {
  --canvas: #121610;
  --canvas-grad: #121610;
  --surface: #1A2018;
  --surface-raised: #232B20;
  --surface-line: rgba(245, 241, 232, 0.10);
  --text: #F5F1E8;
  --text-sub: #9AA596;
  --text-faint: #7E8A7F;
  --primary: #C5DE8F;
  --on-primary: #121610;
  --primary-pressed: #244F43;
  --accent: #C5DE8F;
  --on-accent: #121610;
  --money: #F5F1E8;
  --danger: #E57A66;
  --warning: #E8B64C;
  --success: #7FBF8E;
  --receipt-paper: #FFFFFF;
  --scrim: rgba(0, 0, 0, 0.50);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: system-ui, -apple-system, 'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', sans-serif;
  background-color: #0b0f0c;
  color: #e5e7eb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  direction: rtl;
  line-height: 1.5;
}

/* Header & Controls */
.lab-header {
  width: 100%;
  max-width: 960px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #171d15;
  border: 1px solid rgba(197, 222, 143, 0.15);
  border-radius: var(--radius-lg);
  padding: 12px 18px;
}

.lab-title-group h1 {
  font-size: 18px;
  font-weight: 700;
  color: #f5f1e8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lab-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: #c5de8f;
  color: #121610;
  font-weight: 600;
}

.lab-desc {
  font-size: 12px;
  color: #9aa596;
}

.lab-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lab-btn {
  background: #232b20;
  color: #f5f1e8;
  border: 1px solid rgba(245, 241, 232, 0.15);
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.lab-btn:hover {
  background: #2d6a4f;
  color: #ffffff;
  border-color: #2d6a4f;
}

.lab-btn.active {
  background: #c5de8f;
  color: #121610;
  border-color: #c5de8f;
}

/* Screen Selector Navigation Bar */
.screen-nav {
  width: 100%;
  max-width: 960px;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 2px 14px 2px;
  scrollbar-width: thin;
}

.screen-nav::-webkit-scrollbar {
  height: 4px;
}
.screen-nav::-webkit-scrollbar-thumb {
  background: #2d6a4f;
  border-radius: 4px;
}

.nav-tab {
  white-space: nowrap;
  background: #1a2018;
  border: 1px solid rgba(245, 241, 232, 0.08);
  color: #9aa596;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  flex-shrink: 0;
}

.nav-tab:hover {
  color: #f5f1e8;
  border-color: rgba(197, 222, 143, 0.3);
}

.nav-tab.active {
  background: #2d6a4f;
  color: #ffffff;
  border-color: #2d6a4f;
  box-shadow: 0 2px 8px rgba(45, 106, 79, 0.35);
}

/* Phone Viewport Container */
.phone-viewport-wrap {
  position: relative;
  width: 390px;
  height: 844px;
  border-radius: 44px;
  padding: 10px;
  background: #1c221b;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65), 0 0 0 2px rgba(255, 255, 255, 0.07);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 24px;
}

.phone-screen {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--canvas);
  color: var(--text);
  border-radius: 36px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  direction: rtl;
  transition: background-color 0.25s var(--ease-signature), color 0.25s;
}

.phone-screen::-webkit-scrollbar {
  display: none;
}

/* Status Bar */
.phone-status-bar {
  height: 40px;
  padding: 8px 20px 4px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  color: var(--text);
  z-index: 50;
}

.status-time {
  font-family: system-ui, sans-serif;
  letter-spacing: 0.2px;
}

.status-icons {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Home Indicator Bar */
.phone-home-bar {
  position: absolute;
  bottom: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 130px;
  height: 4px;
  background: var(--text);
  opacity: 0.25;
  border-radius: 9999px;
  z-index: 100;
  pointer-events: none;
}

/* Screen Views */
.view-container {
  display: none;
  flex: 1;
  flex-direction: column;
  padding-bottom: 74px; /* Space for bottom navigation */
}

.view-container.active {
  display: flex;
}

/* Typography & Primitives */
.ltr-nums {
  direction: ltr;
  display: inline-block;
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
}

.bento-card {
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-lg);
  padding: 14px;
  margin-bottom: 12px;
  transition: transform 0.2s, border-color 0.2s;
}

.bento-card:active {
  transform: scale(0.99);
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--text-sub);
  border: 1px solid var(--surface-line);
}

.badge-lime {
  background: var(--accent);
  color: var(--on-accent);
  border: none;
}

.badge-forest {
  background: var(--primary);
  color: var(--on-primary);
  border: none;
}

.badge-warning {
  background: rgba(168, 115, 42, 0.15);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.badge-success {
  background: rgba(47, 125, 70, 0.15);
  color: var(--success);
  border: 1px solid var(--success);
}

.badge-danger {
  background: rgba(192, 71, 58, 0.15);
  color: var(--danger);
  border: 1px solid var(--danger);
}

.platform-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--surface-line);
  color: var(--text-sub);
  background: var(--surface);
}

/* Buttons */
.btn-primary {
  width: 100%;
  height: 48px;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: var(--radius-md);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.15s, opacity 0.15s;
}

.btn-primary:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.btn-secondary {
  height: 40px;
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-secondary:active {
  background: var(--surface-line);
}

.btn-danger {
  height: 38px;
  background: rgba(192, 71, 58, 0.12);
  color: var(--danger);
  border: 1px solid rgba(192, 71, 58, 0.3);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  padding: 0 12px;
  cursor: pointer;
}

/* Price Add / Counter Button */
.price-action-btn {
  background: var(--surface-raised);
  color: var(--text);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-pill);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s var(--ease-signature);
}

.price-action-btn.added {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}

/* Bottom Tab Bar */
.bottom-tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--surface);
  border-top: 1px solid var(--surface-line);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 4px 10px 14px 10px;
  z-index: 40;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-sub);
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  transition: all 0.2s;
  position: relative;
}

.tab-item.active {
  color: var(--primary);
}

.tab-item.active .tab-icon {
  transform: translateY(-2px);
}

.tab-badge {
  position: absolute;
  top: 1px;
  right: 8px;
  background: var(--primary);
  color: var(--on-primary);
  font-size: 9px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Header standard for store */
.app-header {
  padding: 8px 16px 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--surface-line);
  background: var(--canvas);
  position: sticky;
  top: 0;
  z-index: 30;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-logo {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
}

.header-title {
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}

.server-dot {
  width: 7px;
  height: 7px;
  background: var(--success);
  border-radius: 999px;
  display: inline-block;
  box-shadow: 0 0 6px var(--success);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* Search and Filter Row */
.search-row {
  padding: 10px 16px;
  display: flex;
  gap: 8px;
}

.search-input-box {
  flex: 1;
  height: 42px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  color: var(--text-sub);
  font-size: 13px;
}

.filter-btn-compact {
  height: 42px;
  padding: 0 14px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
}

/* Shelf & Cards */
.shelf-header {
  padding: 12px 16px 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shelf-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
}

.games-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 16px 16px 16px;
}

.game-card {
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.game-poster {
  width: 100%;
  aspect-ratio: 3/4;
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
}

.game-poster-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%);
}

.poster-top-badges {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
}

.poster-bottom-info {
  position: relative;
  z-index: 2;
  color: #ffffff;
}

.game-title-white {
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  line-height: 1.3;
}

.game-info-bottom {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.game-series {
  font-size: 11px;
  color: var(--text-sub);
}

.game-price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.game-price-val {
  font-size: 14px;
  font-weight: 800;
  color: var(--money);
}

/* Linear List Row (Daftar 72dp) */
.linear-game-row {
  height: 72px;
  background: var(--surface);
  border: 1px solid var(--surface-line);
  border-radius: var(--radius-md);
  margin: 0 16px 8px 16px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.linear-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 11px;
}

.linear-content {
  flex: 1;
  min-width: 0;
}

.linear-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.linear-meta {
  font-size: 11px;
  color: var(--text-sub);
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Animation Replay Styles */
@keyframes bounceCart {
  0% { transform: scale(1); }
  40% { transform: scale(1.35) rotate(-5deg); }
  70% { transform: scale(0.92); }
  100% { transform: scale(1); }
}

@keyframes pulseGlow {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

@keyframes checkDraw {
  0% { stroke-dashoffset: 40; }
  100% { stroke-dashoffset: 0; }
}

@keyframes shimmerEffect {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.anim-bounce {
  animation: bounceCart 0.45s var(--ease-signature) !important;
}

.shimmer-box {
  background: linear-gradient(90deg, var(--surface) 25%, var(--surface-raised) 50%, var(--surface) 75%);
  background-size: 200% 100%;
  animation: shimmerEffect 1.5s infinite;
  border-radius: var(--radius-sm);
}

/* Modal and Sheets inside phone */
.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: var(--scrim);
  z-index: 80;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sheet-card {
  background: var(--surface);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  padding: 18px 16px 28px 16px;
  border-top: 1px solid var(--surface-line);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: var(--surface-line);
  border-radius: 999px;
  margin: 0 auto 14px auto;
}
</style>
</head>
<body>

<!-- Design Lab Header & Control Bar -->
<header class="lab-header">
  <div class="lab-title-group">
    <h1>
      <span>مختبر الشاردة ستور</span>
      <span class="lab-badge">v4 Modern Minimalism</span>
    </h1>
    <div class="lab-desc">تصميم كريمي أصلي، بطاقات Bento، 12 شاشة تفاعلية، صفر أزرق وتيل قديم</div>
  </div>
  <div class="lab-actions">
    <button class="lab-btn" id="themeToggleBtn" onclick="toggleTheme()">
      <span id="themeIcon">☀️</span>
      <span id="themeLabel">الوضع الفاتح</span>
    </button>
    <button class="lab-btn active" id="replayMotionBtn" onclick="replayApprovedMotions()">
      <span>⚡</span>
      <span>إعادة الحركات (8)</span>
    </button>
  </div>
</header>

<!-- Screen Navigation Tabs (12 Screens) -->
<nav class="screen-nav" id="screenNav">
  <button class="nav-tab active" onclick="switchScreen('s1_welcome', this)">1. بوابة الفرع والترحيب</button>
  <button class="nav-tab" onclick="switchScreen('s2_store_home', this)">2. رئيسية الزبون (شبكة / دفتر)</button>
  <button class="nav-tab" onclick="switchScreen('s3_cashier_home', this)">3. رئيسية الكاشير السريعة</button>
  <button class="nav-tab" onclick="switchScreen('s4_game_detail', this)">4. تفاصيل اللعبة والنسخ</button>
  <button class="nav-tab" onclick="switchScreen('s5_filter_sheet', this)">5. ورقة الفلترة A–Z</button>
  <button class="nav-tab" onclick="switchScreen('s6_cart', this)">6. سلة الزبون وتقدير الوقت</button>
  <button class="nav-tab" onclick="switchScreen('s7_packages', this)">7. باقات الألعاب ومعاينتها</button>
  <button class="nav-tab" onclick="switchScreen('s8_more', this)">8. شاشة «المزيد» Bento</button>
  <button class="nav-tab" onclick="switchScreen('s9_track_order', this)">9. تتبع الطلب والمراحل</button>
  <button class="nav-tab" onclick="switchScreen('s10_admin_invoices', this)">10. فواتير الإدارة وترتيب الأفعال</button>
  <button class="nav-tab" onclick="switchScreen('s11_daily_report', this)">11. الجرد اليومي والإحصاءات</button>
  <button class="nav-tab" onclick="switchScreen('s12_admin_games', this)">12. إدارة مكتبة الألعاب</button>
</nav>

<!-- Centered Phone Viewport (390 x 844) -->
<main class="phone-viewport-wrap">
  <div class="phone-screen" id="phoneContainer">
    
    <!-- Phone Status Bar -->
    <div class="phone-status-bar">
      <span class="status-time">3:21</span>
      <div class="status-icons">
        <span>5G</span>
        <span>📶</span>
        <span>64% 🔋</span>
      </div>
    </div>

    <!-- ==================== SCREEN 1: WELCOME & BRANCH PICKER ==================== -->
    <section class="view-container active" id="s1_welcome">
      <div style="padding: 24px 20px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="header-logo" style="width: 44px; height: 44px; border-radius: 14px; font-size: 20px;">ش</div>
            <span class="badge badge-forest">الشاردة للإلكترونيات</span>
          </div>

          <div style="margin-bottom: 24px;">
            <span class="badge badge-lime" style="margin-bottom: 10px;">أهلاً بك في المتجر الرسمي</span>
            <h2 style="font-size: 28px; font-weight: 800; line-height: 1.25; color: var(--text); margin-top: 8px;">
              عالم ألعابك،<br><span style="color: var(--primary);">بأعلى سرعة وتجهيز</span>
            </h2>
            <p style="font-size: 13px; color: var(--text-sub); margin-top: 10px;">
              اختر فرع الاستلام المفضل لتصفح الألعاب المتوفرة فوراً بأسعار الباقات الرسمية.
            </p>
          </div>

          <!-- Bento Branch Selector -->
          <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
            <div class="bento-card" style="border: 2px solid var(--primary); background: var(--surface-raised); cursor: pointer;" onclick="selectBranch(1)">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text);">الفرع الرئيسي — شارع القضائية</div>
                  <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">مفتوح الآن • تسليم خلال 15 دقيقة</div>
                </div>
                <span class="badge badge-forest">المحدد ✓</span>
              </div>
            </div>

            <div class="bento-card" style="cursor: pointer;" onclick="selectBranch(2)">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text);">الفرع الثاني — شارع جمال عبد الناصر</div>
                  <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">مفتوح الآن • ألعاب PS4 & PS5</div>
                </div>
                <span class="badge">اختيار</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button class="btn-primary" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">
            <span>تصفّح مكتبة الألعاب</span>
            <span>←</span>
          </button>
          <button class="btn-secondary" style="width: 100%; margin-top: 8px;" onclick="switchScreen('s3_cashier_home', document.querySelectorAll('.nav-tab')[2])">
            <span>دخول موظف الكاشير</span>
          </button>
          <div style="text-align: center; font-size: 11px; color: var(--text-faint); margin-top: 12px;">
            نسخة المتجر 4.2 • تطبيق مخصص للأجهزة الذكية
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SCREEN 2: STORE HOME (CUSTOMER) ==================== -->
    <section class="view-container" id="s2_store_home">
      <!-- Standard Store Header -->
      <header class="app-header">
        <div class="header-brand">
          <div class="header-logo">ش</div>
          <div>
            <div class="header-title">الشاردة ستور</div>
            <div style="font-size: 10px; color: var(--text-sub); display: flex; align-items: center; gap: 4px;">
              <span class="server-dot"></span>
              <span>شارع القضائية</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" title="المساعد الذكي" onclick="alert('المساعد الذكي للمتجر جاهز')">✨</button>
          <button class="icon-btn" title="مسح QR">📷</button>
          <button class="icon-btn" title="تنبيهات">🔔</button>
        </div>
      </header>

      <!-- Search & Mode Switcher -->
      <div class="search-row">
        <div class="search-input-box">
          <span>🔍</span>
          <span>ابحث عن لعبة أو سلسلة...</span>
        </div>
        <button class="filter-btn-compact" onclick="switchScreen('s5_filter_sheet', document.querySelectorAll('.nav-tab')[4])">
          <span>⚙️</span>
          <span>فلاتر</span>
        </button>
      </div>

      <!-- Mode Toggle: Shelves Grid vs Daftar List -->
      <div style="padding: 0 16px 8px 16px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 6px;">
          <span class="platform-pill" style="background: var(--primary); color: #fff; border-color: var(--primary);">الكل</span>
          <span class="platform-pill">PS5</span>
          <span class="platform-pill">PS4</span>
          <span class="platform-pill">PC</span>
        </div>
        <div style="display: flex; background: var(--surface); border: 1px solid var(--surface-line); border-radius: var(--radius-pill); padding: 2px;">
          <button id="viewGridBtn" style="border: none; background: var(--primary); color: #fff; padding: 3px 8px; border-radius: var(--radius-pill); font-size: 11px; cursor: pointer;" onclick="setStoreView('grid')">شبكة</button>
          <button id="viewListBtn" style="border: none; background: transparent; color: var(--text-sub); padding: 3px 8px; border-radius: var(--radius-pill); font-size: 11px; cursor: pointer;" onclick="setStoreView('list')">الدفتر (72dp)</button>
        </div>
      </div>

      <!-- GRID VIEW CONTENT -->
      <div id="storeGridView">
        <!-- Hero Best Seller Bento Card -->
        <div style="padding: 0 16px 12px 16px;">
          <div class="bento-card" style="background: linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%); padding: 12px; display: flex; gap: 12px; align-items: center; cursor: pointer;" onclick="switchScreen('s4_game_detail', document.querySelectorAll('.nav-tab')[3])">
            <div style="width: 75px; height: 100px; border-radius: 10px; background: linear-gradient(135deg, #1b3a2a, #2d6a4f); display: flex; flex-direction: column; justify-content: flex-end; padding: 6px; color: #fff; flex-shrink: 0;">
              <span class="badge badge-lime" style="font-size: 9px; align-self: flex-start;">#1 الأكثر طلباً</span>
              <span style="font-size: 10px; font-weight: 700;">GTA V</span>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span class="badge badge-forest">الأكثر مبيعاً</span>
                <span class="platform-pill">PS4 • PS5</span>
              </div>
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text); margin-top: 4px;">GTA V Libya Edition</h3>
              <p style="font-size: 11px; color: var(--text-sub);">النسخة الليبية المعدلة بالكامل • 90 GB</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <span class="game-price-val"><span class="ltr-nums">40</span> د.ل</span>
                <button class="price-action-btn added" onclick="event.stopPropagation(); triggerCartBounce();">
                  <span>✓ بالسلة</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Shelf Title -->
        <div class="shelf-header">
          <div class="shelf-title">
            <span>🔥</span>
            <span>أحدث الألعاب المضافة</span>
          </div>
          <span style="font-size: 11px; color: var(--text-sub);">420 لعبة متوفرة</span>
        </div>

        <!-- 2-Column Games Grid -->
        <div class="games-grid">
          <!-- Game 1 -->
          <div class="game-card" onclick="switchScreen('s4_game_detail', document.querySelectorAll('.nav-tab')[3])">
            <div class="game-poster" style="background: linear-gradient(135deg, #2b3a4a, #1a222d);">
              <div class="game-poster-scrim"></div>
              <div class="poster-top-badges">
                <span class="badge badge-lime">جديد</span>
                <span class="platform-pill" style="color: #fff; border-color: rgba(255,255,255,0.3);">PS5</span>
              </div>
              <div class="poster-bottom-info">
                <div class="game-title-white">WWE 2K26</div>
                <div style="font-size: 10px; opacity: 0.85;">150 GB • مصارعة</div>
              </div>
            </div>
            <div class="game-info-bottom">
              <div class="game-price-row">
                <span class="game-price-val"><span class="ltr-nums">25</span> د.ل</span>
                <button class="price-action-btn" onclick="event.stopPropagation(); togglePriceBtn(this)">
                  <span>+ أضف</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Game 2 -->
          <div class="game-card" onclick="switchScreen('s4_game_detail', document.querySelectorAll('.nav-tab')[3])">
            <div class="game-poster" style="background: linear-gradient(135deg, #4a2b2b, #2d1a1a);">
              <div class="game-poster-scrim"></div>
              <div class="poster-top-badges">
                <span class="platform-pill" style="color: #fff; border-color: rgba(255,255,255,0.3);">PS4 / PS5</span>
              </div>
              <div class="poster-bottom-info">
                <div class="game-title-white">EA SPORTS FC 27</div>
                <div style="font-size: 10px; opacity: 0.85;">65 GB • كرة قدم</div>
              </div>
            </div>
            <div class="game-info-bottom">
              <div class="game-price-row">
                <span class="game-price-val"><span class="ltr-nums">15</span> د.ل</span>
                <button class="price-action-btn" onclick="event.stopPropagation(); togglePriceBtn(this)">
                  <span>+ أضف</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- LIST VIEW CONTENT (Daftar 72dp) -->
      <div id="storeListView" style="display: none;">
        <div class="linear-game-row">
          <div class="linear-thumb" style="background: #2d6a4f;">GTA</div>
          <div class="linear-content">
            <div class="linear-title">GTA V Libya 82 Edition</div>
            <div class="linear-meta">
              <span class="platform-pill">PS4/PS5</span>
              <span>90 GB</span>
              <span class="ltr-nums">40 د.ل</span>
            </div>
          </div>
          <button class="price-action-btn added" onclick="triggerCartBounce()">✓ 1</button>
        </div>

        <div class="linear-game-row">
          <div class="linear-thumb" style="background: #3b4252;">WWE</div>
          <div class="linear-content">
            <div class="linear-title">WWE 2K26 Deluxe</div>
            <div class="linear-meta">
              <span class="platform-pill">PS5</span>
              <span>150 GB</span>
              <span class="ltr-nums">25 د.ل</span>
            </div>
          </div>
          <button class="price-action-btn" onclick="togglePriceBtn(this)">+ أضف</button>
        </div>

        <div class="linear-game-row">
          <div class="linear-thumb" style="background: #4c566a;">FC27</div>
          <div class="linear-content">
            <div class="linear-title">EA SPORTS FC 27</div>
            <div class="linear-meta">
              <span class="platform-pill">PS4/PS5</span>
              <span>65 GB</span>
              <span class="ltr-nums">15 د.ل</span>
            </div>
          </div>
          <button class="price-action-btn" onclick="togglePriceBtn(this)">+ أضف</button>
        </div>
      </div>
    </section>

    <!-- ==================== SCREEN 3: CASHIER HOME MODE ==================== -->
    <section class="view-container" id="s3_cashier_home">
      <header class="app-header" style="background: var(--surface-raised);">
        <div class="header-brand">
          <div class="header-logo" style="background: var(--accent); color: var(--on-accent);">⚡</div>
          <div>
            <div class="header-title">وضع الكاشير السريع</div>
            <div style="font-size: 10px; color: var(--text-sub);">الكاشير: أحمد • القضائية</div>
          </div>
        </div>
        <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">
          خروج للزبون
        </button>
      </header>

      <div style="padding: 10px 16px;">
        <div style="background: var(--surface); border: 1px solid var(--surface-line); border-radius: var(--radius-md); padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; font-weight: 700;">بحث باركود / الاسم السريع:</span>
          <span class="badge badge-lime">F2 للباركود</span>
        </div>
        <div class="search-input-box" style="margin-bottom: 8px;">
          <span>🔍</span>
          <span style="color: var(--text); font-weight: 600;">FIFA</span>
        </div>
      </div>

      <!-- Quick Compact Rows for Cashier (High Density) -->
      <div style="padding: 0 16px; flex: 1;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-sub); margin-bottom: 6px;">
          <span>اللعبة والمنصة</span>
          <span>السعر والإضافة</span>
        </div>

        <div class="linear-game-row" style="height: 60px; margin: 0 0 8px 0;">
          <div class="linear-content">
            <div class="linear-title">EA FC 27 • PS4</div>
            <div class="linear-meta"><span>65 GB</span> • <span>متوفر</span></div>
          </div>
          <span class="game-price-val" style="margin-left: 8px;"><span class="ltr-nums">10</span> د.ل</span>
          <button class="btn-primary" style="width: auto; height: 36px; padding: 0 16px; font-size: 12px;" onclick="triggerCartBounce()">+ أضف</button>
        </div>

        <div class="linear-game-row" style="height: 60px; margin: 0 0 8px 0;">
          <div class="linear-content">
            <div class="linear-title">EA FC 27 • PS5</div>
            <div class="linear-meta"><span>75 GB</span> • <span>متوفر</span></div>
          </div>
          <span class="game-price-val" style="margin-left: 8px;"><span class="ltr-nums">20</span> د.ل</span>
          <button class="btn-primary" style="width: auto; height: 36px; padding: 0 16px; font-size: 12px;" onclick="triggerCartBounce()">+ أضف</button>
        </div>

        <div class="linear-game-row" style="height: 60px; margin: 0 0 8px 0;">
          <div class="linear-content">
            <div class="linear-title">GTA V Libya 82 • PS4</div>
            <div class="linear-meta"><span>90 GB</span> • <span>شائع</span></div>
          </div>
          <span class="game-price-val" style="margin-left: 8px;"><span class="ltr-nums">40</span> د.ل</span>
          <button class="btn-primary" style="width: auto; height: 36px; padding: 0 16px; font-size: 12px;" onclick="triggerCartBounce()">+ أضف</button>
        </div>
      </div>

      <!-- Cashier Bottom Fast Bar -->
      <div style="background: var(--surface-raised); border-top: 1px solid var(--surface-line); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; color: var(--text-sub);">فاتورة الكاشير الحالية (3 ألعاب)</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--money);"><span class="ltr-nums">70.00</span> د.ل</div>
        </div>
        <button class="btn-primary" style="width: auto; padding: 0 20px;" onclick="switchScreen('s6_cart', document.querySelectorAll('.nav-tab')[5])">
          <span>إصدار الفاتورة</span>
          <span>⚡</span>
        </button>
      </div>
    </section>

    <!-- ==================== SCREEN 4: GAME DETAILS (BENTO) ==================== -->
    <section class="view-container" id="s4_game_detail">
      <header class="app-header">
        <button class="icon-btn" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">✕</button>
        <span style="font-size: 14px; font-weight: 700;">تفاصيل اللعبة</span>
        <button class="icon-btn">🔗</button>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- Large Poster Banner -->
        <div style="width: 100%; height: 210px; border-radius: var(--radius-xl); background: linear-gradient(135deg, #1b3a2a, #2d6a4f); position: relative; padding: 16px; display: flex; flex-direction: column; justify-content: flex-end; color: #fff; margin-bottom: 14px;">
          <div class="poster-top-badges">
            <span class="badge badge-lime">الأكثر طلباً #1</span>
            <span class="badge" style="background: rgba(0,0,0,0.5); color: #fff; border-color: rgba(255,255,255,0.2);">Grand Theft Auto</span>
          </div>
          <h2 style="font-size: 24px; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.6);">GTA V Libya 82 Edition</h2>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">عالم مفتوح • النسخة الليبية الحصرية الشاردة</div>
        </div>

        <!-- Bento Grid for Game Specs -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div class="bento-card" style="margin-bottom: 0;">
            <div style="font-size: 11px; color: var(--text-sub);">الحجم التقديري</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--text); margin-top: 2px;"><span class="ltr-nums">90 GB</span></div>
            <div style="font-size: 10px; color: var(--text-faint); margin-top: 2px;">وقت التنزيل: ~18 دقيقة</div>
          </div>
          <div class="bento-card" style="margin-bottom: 0;">
            <div style="font-size: 11px; color: var(--text-sub);">التقييم وسرعة الطلب</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--text); margin-top: 2px;">⭐ 4.9 <span style="font-size: 12px; font-weight: normal; color: var(--text-sub);">(178 طلب)</span></div>
            <div style="font-size: 10px; color: var(--success); margin-top: 2px;">جاهز للتثبيت الفوري</div>
          </div>
        </div>

        <!-- Version Selection Card (PS4 / PS5) -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 10px;">اختر نسخة المنصة المتاحة:</div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1; border: 2px solid var(--primary); background: var(--surface-raised); border-radius: var(--radius-md); padding: 10px; cursor: pointer;">
              <div style="display: flex; justify-content: space-between;">
                <span class="platform-pill" style="background: var(--primary); color: #fff; border: none;">PS4</span>
                <span style="font-size: 11px; color: var(--success);">متوفر</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; color: var(--money); margin-top: 6px;"><span class="ltr-nums">40</span> د.ل</div>
              <div style="font-size: 10px; color: var(--text-sub);">تعديل كامل v82</div>
            </div>

            <div style="flex: 1; border: 1px solid var(--surface-line); background: var(--surface); border-radius: var(--radius-md); padding: 10px; cursor: pointer;">
              <div style="display: flex; justify-content: space-between;">
                <span class="platform-pill">PS5</span>
                <span style="font-size: 11px; color: var(--text-sub);">متوفر</span>
              </div>
              <div style="font-size: 16px; font-weight: 800; color: var(--money); margin-top: 6px;"><span class="ltr-nums">60</span> د.ل</div>
              <div style="font-size: 10px; color: var(--text-sub);">أداء 60fps أصلي</div>
            </div>
          </div>
        </div>

        <!-- Add Action -->
        <button class="btn-primary" onclick="triggerCartBounce(); alert('تمت إضافة GTA V للسلة بنجاح')">
          <span>إضافة للسلة (40 د.ل)</span>
          <span>🛒</span>
        </button>
      </div>
    </section>

    <!-- ==================== SCREEN 5: FILTER SHEET (A-Z) ==================== -->
    <section class="view-container" id="s5_filter_sheet">
      <header class="app-header">
        <button class="icon-btn" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">✕</button>
        <span style="font-size: 14px; font-weight: 700;">تصفية الألعاب والمكتبة</span>
        <button style="border: none; background: transparent; color: var(--danger); font-size: 12px; font-weight: 600;">إعادة ضبط</button>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- A-Z Letter Filter Bar (In Filter Sheet, not blocking Store) -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px;">تصفح حسب الحرف الأبجدي:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; direction: ltr;">
            <span class="platform-pill" style="background: var(--primary); color: #fff;">ALL</span>
            <span class="platform-pill">A</span>
            <span class="platform-pill">B</span>
            <span class="platform-pill">C</span>
            <span class="platform-pill">D</span>
            <span class="platform-pill">E</span>
            <span class="platform-pill">F</span>
            <span class="platform-pill" style="border-color: var(--accent); color: var(--primary); font-weight: 800;">G</span>
            <span class="platform-pill">H</span>
            <span class="platform-pill">W</span>
            <span class="platform-pill">Z</span>
          </div>
        </div>

        <!-- Genre Selection -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px;">النوع والتصنيف:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <span class="badge badge-lime">عالم مفتوح ✓</span>
            <span class="badge">كرة قدم ورياضة</span>
            <span class="badge">أكشن وقتال</span>
            <span class="badge">أطفال ومغامرات</span>
            <span class="badge">رعب وتحدي</span>
          </div>
        </div>

        <!-- Platform & Size Slider Mock -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 8px;">المنصة والحد الأقصى للحجم:</div>
          <div style="display: flex; gap: 8px; margin-bottom: 12px;">
            <span class="badge badge-forest">PS4</span>
            <span class="badge badge-forest">PS5</span>
            <span class="badge">PC</span>
            <span class="badge">PS3</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); display: flex; justify-content: space-between;">
            <span>حجم اللعبة: حتى 100 GB</span>
            <span class="ltr-nums">&lt; 100 GB</span>
          </div>
        </div>

        <button class="btn-primary" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">
          <span>تطبيق الفلاتر (عرض 42 لعبة)</span>
          <span>✓</span>
        </button>
      </div>
    </section>

    <!-- ==================== SCREEN 6: CUSTOMER CART ==================== -->
    <section class="view-container" id="s6_cart">
      <header class="app-header">
        <span style="font-size: 16px; font-weight: 800;">سلة الألعاب والطلب</span>
        <button class="btn-secondary" style="height: 30px; font-size: 11px;">تفريغ السلة</button>
      </header>

      <div style="padding: 16px; overflow-y: auto; flex: 1;">
        <!-- Estimated Size & Time Bento Banner -->
        <div class="bento-card" style="background: linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: var(--text-sub);">الإجمالي الحجمي التقديري</div>
              <div style="font-size: 20px; font-weight: 800; color: var(--text);"><span class="ltr-nums">155 GB</span> <span style="font-size: 12px; font-weight: normal; color: var(--text-sub);">(لعبتان)</span></div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 11px; color: var(--text-sub);">زمن التثبيت التقديري</div>
              <div style="font-size: 16px; font-weight: 700; color: var(--primary);">~ 30 دقيقة</div>
            </div>
          </div>
        </div>

        <!-- Selected Games List -->
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">الألعاب المختارة:</div>

        <div class="linear-game-row" style="margin: 0 0 8px 0;">
          <div class="linear-content">
            <div class="linear-title">GTA V Libya 82 Edition</div>
            <div class="linear-meta"><span class="platform-pill">PS4</span> <span>90 GB</span></div>
          </div>
          <span class="game-price-val"><span class="ltr-nums">40</span> د.ل</span>
          <button style="border: none; background: transparent; color: var(--danger); font-size: 16px; cursor: pointer; padding: 4px;">✕</button>
        </div>

        <div class="linear-game-row" style="margin: 0 0 14px 0;">
          <div class="linear-content">
            <div class="linear-title">EA SPORTS FC 27</div>
            <div class="linear-meta"><span class="platform-pill">PS4</span> <span>65 GB</span></div>
          </div>
          <span class="game-price-val"><span class="ltr-nums">15</span> د.ل</span>
          <button style="border: none; background: transparent; color: var(--danger); font-size: 16px; cursor: pointer; padding: 4px;">✕</button>
        </div>

        <!-- Branch Selection -->
        <div class="bento-card">
          <div style="font-size: 12px; color: var(--text-sub); margin-bottom: 4px;">فرع الاستلام المعتمد:</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--text);">الفرع الرئيسي — شارع القضائية</div>
        </div>
      </div>

      <!-- Cart Total and Action Buttons -->
      <div style="background: var(--surface); border-top: 1px solid var(--surface-line); padding: 14px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 14px; font-weight: 600; color: var(--text-sub);">المبلغ الإجمالي المستحق:</span>
          <span style="font-size: 22px; font-weight: 800; color: var(--money);"><span class="ltr-nums">55.00</span> د.ل</span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="btn-primary" style="flex: 1;" onclick="switchScreen('s9_track_order', document.querySelectorAll('.nav-tab')[8])">
            <span>تأكيد الطلب والحجز</span>
            <span>✓</span>
          </button>
          <button class="btn-secondary" style="height: 48px;" onclick="alert('فتح محادثة واتساب الفرع')">
            <span>💬 واتساب</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== SCREEN 7: PACKAGES ==================== -->
    <section class="view-container" id="s7_packages">
      <header class="app-header">
        <span style="font-size: 16px; font-weight: 800;">باقات الألعاب والتوفير</span>
        <span class="badge badge-lime">عروض حصرية</span>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- Package 1 Bento Card -->
        <div class="bento-card" style="border: 2px solid var(--primary); background: var(--surface-raised);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge badge-forest">الباقة الذهبية PS4</span>
            <span class="game-price-val" style="font-size: 18px;"><span class="ltr-nums">100</span> د.ل</span>
          </div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text);">باقة 10 ألعاب كبرى مختارة</h3>
          <p style="font-size: 12px; color: var(--text-sub); margin-top: 4px;">
            تشمل GTA V وFC 27 وWWE وSpider-Man مع تجهيز فوري وتوفير 50 د.ل مقارنة بالسعر الفردي.
          </p>

          <div style="background: var(--surface); border-radius: var(--radius-sm); padding: 8px; margin: 10px 0; font-size: 11px; color: var(--text-sub);">
            📦 الألعاب المتضمنة: 10 ألعاب • الحجم الإجمالي: ~500 GB
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="btn-primary" style="flex: 1; height: 40px; font-size: 13px;" onclick="triggerCartBounce(); alert('تمت إضافة الباقة للسلة!')">
              + إضافة الباقة للسلة
            </button>
            <button class="btn-secondary" style="height: 40px; font-size: 12px;" onclick="alert('قائمة الألعاب: GTA V, FC27, WWE 2K26, God of War, Spider-Man, Crash...')">
              معاينة الألعاب
            </button>
          </div>
        </div>

        <!-- Package 2 Bento Card -->
        <div class="bento-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="badge">باقة الأطفال والمغامرات</span>
            <span class="game-price-val" style="font-size: 18px;"><span class="ltr-nums">50</span> د.ل</span>
          </div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--text);">باقة 5 ألعاب عائلية</h3>
          <p style="font-size: 12px; color: var(--text-sub); margin-top: 4px;">
            كراش وسيارات ومغامرات آمنة ومناسبة لجميع الأعمار.
          </p>
          <button class="btn-secondary" style="width: 100%; margin-top: 10px; height: 40px;" onclick="triggerCartBounce()">
            + إضافة للسلة (50 د.ل)
          </button>
        </div>
      </div>
    </section>

    <!-- ==================== SCREEN 8: MORE (BENTO) ==================== -->
    <section class="view-container" id="s8_more">
      <header class="app-header">
        <span style="font-size: 16px; font-weight: 800;">المزيد والمعلومات</span>
        <span class="badge badge-forest">زبون</span>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- Account Bento Block -->
        <div class="bento-card" style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--surface-raised); border: 1px solid var(--surface-line); display: flex; align-items: center; justify-content: center; font-size: 20px;">
            👤
          </div>
          <div style="flex: 1;">
            <div style="font-size: 15px; font-weight: 800; color: var(--text);">حساب الزبون (ضيف)</div>
            <div style="font-size: 11px; color: var(--text-sub);">الفرع النشط: شارع القضائية</div>
          </div>
          <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="switchScreen('s10_admin_invoices', document.querySelectorAll('.nav-tab')[9])">
            دخول إدارة
          </button>
        </div>

        <!-- Bento Grid Navigation Links -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="bento-card" style="margin-bottom: 0; cursor: pointer;" onclick="switchScreen('s9_track_order', document.querySelectorAll('.nav-tab')[8])">
            <div style="font-size: 22px; margin-bottom: 6px;">📦</div>
            <div style="font-size: 13px; font-weight: 700;">تتبع طلباتي</div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">آخر طلب قيد التجهيز</div>
          </div>

          <div class="bento-card" style="margin-bottom: 0; cursor: pointer;" onclick="alert('مركز الإشعارات: لا توجد إشعارات جديدة')">
            <div style="font-size: 22px; margin-bottom: 6px;">🔔</div>
            <div style="font-size: 13px; font-weight: 700;">مركز الإشعارات</div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">تنبيهات الألعاب الجديدة</div>
          </div>

          <div class="bento-card" style="margin-bottom: 0; cursor: pointer;" onclick="alert('مواعيد العمل: يومياً من 10 صباحاً إلى 11 مساءً')">
            <div style="font-size: 22px; margin-bottom: 6px;">📍</div>
            <div style="font-size: 13px; font-weight: 700;">الفروع والمواعيد</div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">شارع القضائية • جمال عبد الناصر</div>
          </div>

          <div class="bento-card" style="margin-bottom: 0; cursor: pointer;" onclick="toggleTheme()">
            <div style="font-size: 22px; margin-bottom: 6px;">🌗</div>
            <div style="font-size: 13px; font-weight: 700;">مظهر التطبيق</div>
            <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">تبديل فاتح / داكن</div>
          </div>
        </div>

        <!-- Store Contact & Policy -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px;">تطبيق الشاردة ستور الرسمي</div>
          <div style="font-size: 11px; color: var(--text-sub); line-height: 1.6;">
            رقم خدمة العملاء: <span class="ltr-nums">0920595447</span><br>
            حقوق النشر والتوزيع محفوظة لشركة الشاردة للإلكترونيات 2026.
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SCREEN 9: ORDER TRACKING ==================== -->
    <section class="view-container" id="s9_track_order">
      <header class="app-header">
        <button class="icon-btn" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">✕</button>
        <span style="font-size: 14px; font-weight: 700;">تتبع حالة الطلب</span>
        <button class="icon-btn" onclick="alert('تم تحديث الحالة')">🔄</button>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- Invoice Info Bento Card -->
        <div class="bento-card" style="border: 2px solid var(--primary); text-align: center;">
          <span class="badge badge-forest" style="margin-bottom: 8px;">طلب نشط</span>
          <div style="font-size: 13px; color: var(--text-sub);">رقم الفاتورة المرجعي:</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--text); margin: 4px 0;"><span class="ltr-nums">#20261030-001</span></div>
          <div style="font-size: 12px; color: var(--text-sub);">العميل: محمد الشيخي • فرع القضائية</div>
        </div>

        <!-- Step Timeline -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px;">مراحل تجهيز جهازك والألعاب:</div>

          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--success); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text);">تم استلام وتأكيد الطلب</div>
              <div style="font-size: 11px; color: var(--text-sub);">الساعة 03:15 م — الكاشير استلم الجهاز</div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">⏳</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--primary);">قيد التنزيل والتثبيت الآن</div>
              <div style="font-size: 11px; color: var(--text-sub);">اكتمل 60% • متبقي حوالي 12 دقيقة</div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; align-items: flex-start; opacity: 0.5;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--surface-line); color: var(--text-sub); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">3</div>
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text);">جاهز للاستلام والتسليم</div>
              <div style="font-size: 11px; color: var(--text-sub);">سيصلك إشعار فوري عند اكتمال الجهاز</div>
            </div>
          </div>
        </div>

        <button class="btn-secondary" style="width: 100%;" onclick="alert('تم نسخ رقم الفاتورة للمشاركة')">
          <span>مشاركة الفاتورة أو رمز الاستلام</span>
          <span>📋</span>
        </button>
      </div>
    </section>

    <!-- ==================== SCREEN 10: ADMIN INVOICES ==================== -->
    <section class="view-container" id="s10_admin_invoices">
      <header class="app-header" style="background: var(--surface-raised);">
        <div>
          <div style="font-size: 16px; font-weight: 800; color: var(--text);">لوحة الإدارة — الفواتير</div>
          <div style="font-size: 11px; color: var(--text-sub);">مدير النظام • كل الفروع</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">المتجر</button>
          <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="switchScreen('s11_daily_report', document.querySelectorAll('.nav-tab')[10])">الجرد</button>
        </div>
      </header>

      <!-- Branch & Period Chips -->
      <div style="padding: 10px 16px; display: flex; gap: 6px; overflow-x: auto;">
        <span class="badge badge-forest">كل الفروع</span>
        <span class="badge">اليوم</span>
        <span class="badge">الآجل فقط</span>
        <span class="badge">مع المرحّل</span>
      </div>

      <!-- Quick Metrics Bento -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding: 0 16px 10px 16px;">
        <div class="bento-card" style="margin-bottom: 0; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--text-sub);">فواتير اليوم</div>
          <div style="font-size: 16px; font-weight: 800; margin-top: 2px;">14</div>
        </div>
        <div class="bento-card" style="margin-bottom: 0; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--text-sub);">مبيعات اليوم</div>
          <div style="font-size: 16px; font-weight: 800; margin-top: 2px;"><span class="ltr-nums">540</span> د.ل</div>
        </div>
        <div class="bento-card" style="margin-bottom: 0; padding: 10px; text-align: center;">
          <div style="font-size: 10px; color: var(--warning);">آجل مرحّل</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--warning); margin-top: 2px;"><span class="ltr-nums">180</span> د.ل</div>
        </div>
      </div>

      <!-- Admin Invoices List -->
      <div style="padding: 0 16px; flex: 1; overflow-y: auto;">
        
        <!-- Clean Invoice Card 1 -->
        <div class="bento-card" style="border-right: 4px solid var(--warning); padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="ltr-nums" style="font-size: 15px; font-weight: 800; color: var(--text);">#20261030-001</span>
              <span class="badge badge-warning" style="margin-right: 6px;">آجل مرحّل</span>
            </div>
            <span class="game-price-val" style="font-size: 16px;"><span class="ltr-nums">20.00</span> د.ل</span>
          </div>

          <div style="font-size: 12px; color: var(--text); margin-top: 4px;">
            محمد الشيخي • <span class="ltr-nums">0922328428</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
            الألعاب: EA FC 27, NFS Heat (فرع القضائية)
          </div>

          <!-- Invoice Actions with clear hierarchy -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--surface-line);">
            <button class="btn-primary" style="height: 34px; padding: 0 14px; font-size: 12px; width: auto;" onclick="alert('تم تسديد المتبقي للفاتورة 20261030-001')">
              <span>تسديد المتبقي</span>
              <span>💵</span>
            </button>
            <div style="display: flex; gap: 6px;">
              <button class="btn-secondary" style="height: 34px; padding: 0 10px; font-size: 11px;" onclick="showReceiptMock()">طباعة / QR</button>
              <button class="btn-secondary" style="height: 34px; padding: 0 8px;" onclick="showSafeDeleteDialog('20261030-001', 'محمد الشيخي')">⋯</button>
            </div>
          </div>
        </div>

        <!-- Clean Invoice Card 2 -->
        <div class="bento-card" style="border-right: 4px solid var(--success); padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span class="ltr-nums" style="font-size: 15px; font-weight: 800; color: var(--text);">#20261030-002</span>
              <span class="badge badge-success" style="margin-right: 6px;">مدفوع بالكامل</span>
            </div>
            <span class="game-price-val" style="font-size: 16px;"><span class="ltr-nums">60.00</span> د.ل</span>
          </div>

          <div style="font-size: 12px; color: var(--text); margin-top: 4px;">
            عبد الرحمن أحمد • <span class="ltr-nums">0917097306</span>
          </div>
          <div style="font-size: 11px; color: var(--text-sub); margin-top: 2px;">
            الألعاب: GTA V Libya 82 (فرع جمال عبد الناصر)
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--surface-line);">
            <span style="font-size: 11px; color: var(--success); font-weight: 600;">✓ جاهز للتسليم</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn-secondary" style="height: 34px; padding: 0 10px; font-size: 11px;" onclick="showReceiptMock()">إعادة الطباعة</button>
              <button class="btn-secondary" style="height: 34px; padding: 0 8px;" onclick="showSafeDeleteDialog('20261030-002', 'عبد الرحمن أحمد')">⋯</button>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- ==================== SCREEN 11: DAILY REPORT ==================== -->
    <section class="view-container" id="s11_daily_report">
      <header class="app-header">
        <span style="font-size: 16px; font-weight: 800;">الجرد اليومي والمالي</span>
        <span class="badge badge-forest">اليوم: 2026-11-06</span>
      </header>

      <div style="padding: 16px; overflow-y: auto;">
        <!-- Hero Totals Bento Block -->
        <div class="bento-card" style="background: linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%);">
          <div style="font-size: 12px; color: var(--text-sub);">إجمالي التحصيل الفعلي (كاش ومصرفي)</div>
          <div style="font-size: 32px; font-weight: 800; color: var(--primary); margin: 6px 0;" id="countUpMetric">
            <span class="ltr-nums">720.00</span> د.ل
          </div>
          <div style="font-size: 11px; color: var(--success);">زيادة 14% مقارنة بنفس اليوم من الأسبوع الماضي</div>
        </div>

        <!-- Breakdown Bento Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div class="bento-card" style="margin-bottom: 0;">
            <div style="font-size: 11px; color: var(--text-sub);">المدفوع نقداً (كاش)</div>
            <div style="font-size: 18px; font-weight: 800; margin-top: 4px;"><span class="ltr-nums">540</span> د.ل</div>
            <div style="font-size: 10px; color: var(--text-sub);">18 فاتورة</div>
          </div>

          <div class="bento-card" style="margin-bottom: 0;">
            <div style="font-size: 11px; color: var(--text-sub);">سداد إلكتروني (موبي كاش)</div>
            <div style="font-size: 18px; font-weight: 800; margin-top: 4px;"><span class="ltr-nums">180</span> د.ل</div>
            <div style="font-size: 10px; color: var(--text-sub);">6 فواتير</div>
          </div>
        </div>

        <!-- Devices and Games Count Bento -->
        <div class="bento-card">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 8px;">إحصاءات الأجهزة والمنصات اليومية:</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>أجهزة بلايستيشن 4 تم تجهيزها:</span>
            <span class="ltr-nums" style="font-weight: 700;">14 جهاز</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
            <span>أجهزة بلايستيشن 5 تم تجهيزها:</span>
            <span class="ltr-nums" style="font-weight: 700;">9 أجهزة</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px;">
            <span>إجمالي الألعاب المثبتة:</span>
            <span class="ltr-nums" style="font-weight: 700;">64 لعبة</span>
          </div>
        </div>

        <button class="btn-primary" onclick="alert('جاري توليد ملف الجرد PDF وتصديره...')">
          <span>تصدير تقرير الجرد اليومي PDF</span>
          <span>📄</span>
        </button>
      </div>
    </section>

    <!-- ==================== SCREEN 12: ADMIN GAME MANAGEMENT ==================== -->
    <section class="view-container" id="s12_admin_games">
      <header class="app-header">
        <div>
          <div style="font-size: 16px; font-weight: 800;">إدارة مكتبة الألعاب</div>
          <div style="font-size: 11px; color: var(--text-sub);">420 لعبة مسجلة في النظام</div>
        </div>
        <button class="btn-primary" style="width: auto; height: 34px; padding: 0 12px; font-size: 12px;" onclick="alert('فتح نموذج إضافة لعبة جديدة')">
          + إضافة لعبة
        </button>
      </header>

      <div style="padding: 10px 16px;">
        <div class="search-input-box">
          <span>🔍</span>
          <span>بحث في المكتبة للتعديل أو الحذف...</span>
        </div>
      </div>

      <!-- Compact Rows with Clean Admin Actions -->
      <div style="padding: 0 16px; flex: 1; overflow-y: auto;">
        
        <div class="linear-game-row" style="margin: 0 0 8px 0;">
          <div class="linear-thumb" style="background: #2d6a4f;">GTA</div>
          <div class="linear-content">
            <div class="linear-title">GTA V Libya 82 Edition</div>
            <div class="linear-meta"><span>PS4: 40 د.ل</span> • <span>PS5: 60 د.ل</span></div>
          </div>
          <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="alert('تعديل لعبة GTA V')">تعديل</button>
          <button class="btn-danger" style="height: 32px;" onclick="showSafeDeleteDialog('GAME-01', 'GTA V Libya 82')">حذف</button>
        </div>

        <div class="linear-game-row" style="margin: 0 0 8px 0;">
          <div class="linear-thumb" style="background: #3b4252;">WWE</div>
          <div class="linear-content">
            <div class="linear-title">WWE 2K26</div>
            <div class="linear-meta"><span>PS5: 25 د.ل</span> • <span>150 GB</span></div>
          </div>
          <button class="btn-secondary" style="height: 32px; font-size: 11px;" onclick="alert('تعديل لعبة WWE')">تعديل</button>
          <button class="btn-danger" style="height: 32px;" onclick="showSafeDeleteDialog('GAME-02', 'WWE 2K26')">حذف</button>
        </div>

        <div class="linear-game-row" style="margin: 0 0 8px 0;">
          <div class="linear-content">
            <div class="linear-title">The Blood of Dawnwalker</div>
            <div class="linear-meta"><span>PS5: 25 د.ل</span> • <span>80 GB</span></div>
          </div>
          <button class="btn-secondary" style="height: 32px; font-size: 11px;">تعديل</button>
          <button class="btn-danger" style="height: 32px;" onclick="showSafeDeleteDialog('GAME-03', 'Dawnwalker')">حذف</button>
        </div>

      </div>
    </section>

    <!-- Bottom Tab Bar (Store Customer Tabs: 4 tabs) -->
    <nav class="bottom-tab-bar" id="storeTabBar">
      <div class="tab-item active" id="tabStore" onclick="switchScreen('s2_store_home', document.querySelectorAll('.nav-tab')[1])">
        <span class="tab-icon" style="font-size: 16px;">🏪</span>
        <span>المتجر</span>
      </div>
      <div class="tab-item" id="tabPackages" onclick="switchScreen('s7_packages', document.querySelectorAll('.nav-tab')[6])">
        <span class="tab-icon" style="font-size: 16px;">📦</span>
        <span>الباقات</span>
      </div>
      <div class="tab-item" id="tabCart" onclick="switchScreen('s6_cart', document.querySelectorAll('.nav-tab')[5])">
        <span class="tab-icon" style="font-size: 16px;" id="cartTabIcon">🛒</span>
        <span class="tab-badge" id="cartBadgeCount">2</span>
        <span>السلة</span>
      </div>
      <div class="tab-item" id="tabMore" onclick="switchScreen('s8_more', document.querySelectorAll('.nav-tab')[7])">
        <span class="tab-icon" style="font-size: 16px;">⚙️</span>
        <span>المزيد</span>
      </div>
    </nav>

    <!-- Bottom Safe Home Indicator -->
    <div class="phone-home-bar"></div>

    <!-- Receipt / Print Instant Modal Sheet (<200ms) -->
    <div class="sheet-backdrop" id="receiptModal" style="display: none;" onclick="closeReceiptMock()">
      <div class="sheet-card" style="background: var(--receipt-paper); color: #121610;" onclick="event.stopPropagation()">
        <div class="sheet-handle" style="background: #ccc;"></div>
        <div style="text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px;">
          <div style="font-weight: 800; font-size: 16px;">الشاردة ستور • Alnafar Store</div>
          <div style="font-size: 11px; color: #555;">الفرع الرئيسي — شارع القضائية • هاتف: 0920595447</div>
          <div style="font-size: 12px; font-weight: 700; margin-top: 4px;" class="ltr-nums">#20261030-001</div>
        </div>
        <div style="font-size: 12px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between;"><span>العميل: محمد الشيخي</span><span class="ltr-nums">0922328428</span></div>
          <div style="display: flex; justify-content: space-between;"><span>EA SPORTS FC 27 (PS4)</span><span class="ltr-nums">10.00 د.ل</span></div>
          <div style="display: flex; justify-content: space-between;"><span>NFS Heat (PS4)</span><span class="ltr-nums">10.00 د.ل</span></div>
        </div>
        <div style="border-top: 1px dashed #ccc; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px;">
          <span>المبلغ المستحق:</span>
          <span class="ltr-nums">20.00 د.ل</span>
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button class="btn-primary" style="flex: 1;" onclick="closeReceiptMock(); alert('تم إرسال أمر الطباعة للطابعة الحرارية فوراً!')">طباعة الإيصال 🖨️</button>
          <button class="btn-secondary" onclick="closeReceiptMock()">إغلاق</button>
        </div>
      </div>
    </div>

    <!-- Safe Delete Confirmation Sheet -->
    <div class="sheet-backdrop" id="deleteModal" style="display: none;" onclick="closeSafeDeleteDialog()">
      <div class="sheet-card" onclick="event.stopPropagation()">
        <div class="sheet-handle"></div>
        <div style="text-align: center; margin-bottom: 14px;">
          <div style="font-size: 32px; margin-bottom: 6px;">⚠️</div>
          <h3 style="font-size: 16px; font-weight: 800; color: var(--danger);">تأكيد إجراء الحذف الآمن</h3>
          <p style="font-size: 12px; color: var(--text-sub); margin-top: 4px;" id="deleteTargetText">
            هل أنت متأكد من حذف الفاتورة؟
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-danger" style="flex: 1; height: 44px; font-size: 14px;" onclick="confirmDeleteAction()">
            نعم، احذف نهائياً
          </button>
          <button class="btn-secondary" style="flex: 1; height: 44px;" onclick="closeSafeDeleteDialog()">
            إلغاء التراجع
          </button>
        </div>
      </div>
    </div>

  </div>
</main>

<script>
// Interactive Screen Switching Logic
function switchScreen(screenId, tabElement) {
  // Hide all screens
  document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
  
  // Show target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
  }

  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (tabElement) {
    tabElement.classList.add('active');
  }

  // Update bottom tab highlight if relevant
  const isCustomerStore = ['s2_store_home', 's4_game_detail', 's5_filter_sheet'].includes(screenId);
  document.getElementById('tabStore').classList.toggle('active', isCustomerStore);
  document.getElementById('tabPackages').classList.toggle('active', screenId === 's7_packages');
  document.getElementById('tabCart').classList.toggle('active', screenId === 's6_cart');
  document.getElementById('tabMore').classList.toggle('active', screenId === 's8_more');

  // Hide bottom tab bar in admin views & welcome
  const hideTabBar = ['s1_welcome', 's10_admin_invoices', 's11_daily_report', 's12_admin_games'].includes(screenId);
  document.getElementById('storeTabBar').style.display = hideTabBar ? 'none' : 'flex';
}

// Light / Dark Theme Toggle
let currentTheme = 'light';
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (currentTheme === 'dark') {
    icon.textContent = '🌙';
    label.textContent = 'الوضع الداكن';
  } else {
    icon.textContent = '☀️';
    label.textContent = 'الوضع الفاتح';
  }
}

// Switch between Grid and Daftar List (72dp) in Store
function setStoreView(view) {
  const gridView = document.getElementById('storeGridView');
  const listView = document.getElementById('storeListView');
  const gridBtn = document.getElementById('viewGridBtn');
  const listBtn = document.getElementById('viewListBtn');

  if (view === 'grid') {
    gridView.style.display = 'block';
    listView.style.display = 'none';
    gridBtn.style.background = 'var(--primary)';
    gridBtn.style.color = '#fff';
    listBtn.style.background = 'transparent';
    listBtn.style.color = 'var(--text-sub)';
  } else {
    gridView.style.display = 'none';
    listView.style.display = 'block';
    listBtn.style.background = 'var(--primary)';
    listBtn.style.color = '#fff';
    gridBtn.style.background = 'transparent';
    gridBtn.style.color = 'var(--text-sub)';
  }
}

// Replay Approved Motions (The 8 Approved Motion Moments)
function replayApprovedMotions() {
  triggerCartBounce();

  // Price button state animation
  document.querySelectorAll('.price-action-btn').forEach(btn => {
    btn.classList.add('anim-bounce');
    setTimeout(() => btn.classList.remove('anim-bounce'), 450);
  });

  // Animated Count-Up for daily totals
  const el = document.getElementById('countUpMetric');
  if (el) {
    let start = 0;
    const target = 720;
    const timer = setInterval(() => {
      start += 60;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      el.innerHTML = '<span class="ltr-nums">' + start.toFixed(2) + '</span> د.ل';
    }, 30);
  }
}

// Cart Icon Bounce Effect
function triggerCartBounce() {
  const icon = document.getElementById('cartTabIcon');
  const badge = document.getElementById('cartBadgeCount');
  if (icon) {
    icon.classList.remove('anim-bounce');
    void icon.offsetWidth;
    icon.classList.add('anim-bounce');
  }
  if (badge) {
    badge.textContent = parseInt(badge.textContent || '0') + 1;
  }
}

// Interactive Price Button toggle
function togglePriceBtn(btn) {
  if (btn.classList.contains('added')) {
    btn.classList.remove('added');
    btn.innerHTML = '<span>+ أضف</span>';
  } else {
    btn.classList.add('added');
    btn.innerHTML = '<span>✓ بالسلة</span>';
    triggerCartBounce();
  }
}

// Branch Selection helper
function selectBranch(num) {
  alert(num === 1 ? 'تم اختيار الفرع الرئيسي — شارع القضائية' : 'تم اختيار الفرع الثاني — شارع جمال عبد الناصر');
}

// Instant Receipt Modal (<200ms preview)
function showReceiptMock() {
  const modal = document.getElementById('receiptModal');
  modal.style.display = 'flex';
}
function closeReceiptMock() {
  document.getElementById('receiptModal').style.display = 'none';
}

// Safe Delete Confirmation Dialog
let deleteTargetId = '';
function showSafeDeleteDialog(id, name) {
  deleteTargetId = id;
  const modal = document.getElementById('deleteModal');
  document.getElementById('deleteTargetText').innerHTML = 'هل أنت متأكد من حذف السجل المرجعي: <br><strong class="ltr-nums" style="color:var(--text);">' + id + '</strong> (' + name + ')؟<br>هذا الإجراء لا يمكن التراجع عنه.';
  modal.style.display = 'flex';
}
function closeSafeDeleteDialog() {
  document.getElementById('deleteModal').style.display = 'none';
}
function confirmDeleteAction() {
  alert('تم حذف العنصر ' + deleteTargetId + ' بنجاح بعد التأكيد.');
  closeSafeDeleteDialog();
}
</script>
</body>
</html>
"""

output_path = os.path.join(os.path.dirname(__file__), 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html_content.strip())

file_size_kb = os.path.getsize(output_path) / 1024
print(f"Generated {output_path} successfully!")
print(f"File size: {file_size_kb:.2f} KB (Must be < 100 KB)")
