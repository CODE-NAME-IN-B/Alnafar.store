# 00-audit.md — تدقيق الوضع الراهن (المرحلة 1)

> تدقيق كامل لهيكل التطبيق قبل إعادة التصميم. النسخة المثبتة حالياً: **v1.0.7-beta** (versionCode 7، APK 61.7–61.8MB على GitHub Releases).
> الحقيقة الأهم: التطبيق مرّ للتو بجولة tokenize شاملة (v1.0.6) — معظم الشاشات الرئيسية صارت تعمل بالرموز `colors.*`، لكن ليس كلها (القسم D).
> رقم APK: أيضاً هناك سلوك جديد أُضيف بقصد الطلب الأخير (شريط أحرف، footer ثابت للاستمارة، UpdateSheet، GuestBell…) — إعادة التصميم يجب أن **تحافظ على هذه الميزات** لا تحذفها.

---

## A. المجموعة التقنية

| البند | القيمة | المرجع |
|---|---|---|
| Expo | `exp ~58.0.22` (SDK 58)، React Native 0.88.1، React 19.3 | `package.json:12,39,36` |
| Router | `expo-router ~58.0.29` (Tabs + Stack) — التبويب السفلي للسلة بشارة | `package.json:28`؛ `(store)/_layout.tsx` |
| الأنيميشن |ريم `reanimated 4.7.1` + `worklets 0.13`؛ يتداخل مع `Animated` القديم في مكوّنات قليلة | `package.json:42,47`؛ `GameCard.tsx:59-70` |
| الحالة | `zustand ^5.0.16` (بلا persist) | `package.json:50` |
| البيانات | `@tanstack/react-query ^5.105` + `axios ^1.21`؛ `staleTime` 60 ثانيًا عام + إعدادات بيت 5د | `_layout.tsx:25`؛ `NativeReceiptModal.tsx:37` |
| Printing | `expo-print` (حوار الطباعة الأصلي) + `Sharing.shareAsync`؛ **لا يق적 Sunmi/ESC-POS** (الطبقة موجودة وشرك الوحيد `ExpoPrintDriver`)| `PrinterDriver.ts:33-68` |
| QR | `qrcode` (توليد SVG محلي للطباعة) + `react-native-qrcode-svg` (عرض) — **توليد كلي محلي، لا صورة من خادم** ✅ | `receiptQr.ts:18-42` |
| الحالات الميتة | تعيينًا من zod، react-hook-form، tailwindcss، nativewind: **استعمال صفر** — إزالةCandidates في مرحلة لاحقة | `package.json:34,38,48-49` |
| Backend | `https://alnafar-store.vercel.app/api` + `EXPO_PUBLIC_API_BASE` لبدَل؛ HTTPS ✅؛ reي 900ms أقة 503 | `app.config.ts:7`؛ `client.ts:60-64` |
| Push | `expo-notifications ~58.1.7` + أيقونة أحادية وقناة جاهزة + projectId EAS | `package.json:26`؛ `app.config.ts:69-89` |

---

## B. جرد الشاشات (14 ملفاً = 11 شاشة + 3 رحلات `_layout`)

### واجهة الزبون/الضيف
| الملف | الوظيفة |
|---|---|
| `(store)/_layout.tsx` | Tabs سفلي: المتجر / الباقات / السلة / المزيد + شارة السلة |
| `(store)/index.tsx` | الرئيسية: ترويسة + مضمر البحث + فلتر + شريط أحرف قائم (أُضيف في v1.0.7) + تصنيفات + Hero + الآبناء + شبكة ألعاب (شبكة/صف مضغط للكاشير) + QR درج |
| `(store)/packages.tsx` | الباقات (شريحة حسب التصنيف + تفاصيل باقة بو دي رُفْع) |
| `(store)/cart.tsx` | مزدوج الدور: سلة زبون (تقديم واتساب) أو فاتورة كاشير (InvoiceFormModal + إيصال مطبوع) |
| `(store)/more.tsx` | المزيد: بطاقة حساب، تتبع طلباتي (قائمة محلية تحفظ الطلبات بطابع)، روابط |
| `track/[id].tsx` | تتبع طلب: StatusCard + خطوات 3 + بنود مع «مثبت»/حالة تغيير (موظف) |
| `login.tsx` | دخول (اسم/كلمة) + «دخول كضيف» |
| `_layout.tsx` (جذر) | خطوط + QueryClient + Toast + تسجيل إشعارات + `TrackedOrderWatcher` |

### لوحة الإدارة والكاشير
| الملف | الوظيفة |
|---|---|
| `(admin)/_layout.tsx` | Tabs + ترويسة (المستخدم، «كاشير المتجر»، **«خروج»**) + شريط فرع |
| `(admin)/index.tsx` | الفواتير: بحث (**+ «تسديد الكل» داخله**) + درج فلترة/تاريخ/إحصاء + بطاقات + إيصال |
| `(admin)/daily-report.tsx` | الجرد اليومي: تقويم يوم/ Africans (DatePickerSheet جديد) + إغلاق + تاريخ |
| `(admin)/games.tsx` | الألعاب: جدول + بحث/فلترة + محرّر لعبة (كاميرا + ذكاء تصنيف) |
| `(admin)/catalog.tsx` | الأقسام: تُسبة + خدمات + باقات |
| `(admin)/more.tsx` | الإعدادات: إحصاءات، إعدادات إيصال، تدقيق، مستخدمون/فروع |

---

## C. المكونات المشتركة والتكرار

**جذري:** `ui/` نظام (AppButton, AppInput, Badge, Card, Chip, DatePickerSheet, Icon: 46 أيقونة SVG يدوية, ModalSheet مع `footer`, StateView: Loading/Empty/Error, LtrText, motion: ScalePressable, ToastHost…).
**النطاقات:** store/ (AccountCard, BranchGate, CartRow, FilterSheet, GuestBell, HeroSection, PackageDetailsSheet, ServicesSheet, TopList, TrackedOrdersList, UpdateSheet*, VersionPickerModal)، admin/ (AdminInvoiceCard, GameEditorModal, PackageEditorModal, TaxonomySection, UsersBranchesSection)، invoice/ (InvoiceFormModal*, NativeReceiptModal)، track/ (QrScannerModal, TrackCards, TrackSteps, TrackedOrderWatcher).

\* مكونات جديدة أُضيفت في v1.0.6/1.0.7 وسّتر تُحاح الحفظ وتضاف إعادة التصميم.

### التكرار (يجب أن يُوحّد في إعادة التصميم)
1. **أزرار محلية بدل AppButton:** «تسديد الكل» `admin/index.tsx:195-205`؛ ترويسة الأدمن `(admin)/_layout.tsx:60-79`؛ QuickPayBtn `InvoiceFormModal.tsx:314-355`؛ IconButton `AdminInvoiceCard.tsx:149-171`.
2. **حساب المبالغ المشتح يُعاد يدوياً أربع مرات** (total − discount / paid / remaining): `AdminInvoiceCard.tsx:36-39`، `NativeReceiptModal.tsx:86-93`، `receiptHtml.ts:60-74`، `TrackCards.tsx:214-217` — ومن هنا تنطلق المشكلات الوظيفية (F).
3. **2 أزرار «طباعة/QR» في نفس البطاقة** (أساسي + chip) — إجراء واحد بثبت نامين `AdminInvoiceCard.tsx:101-125`.
4. صندوق بحث يدوي ×3: `admin/index.tsx:178-193`، `store/index.tsx:220-240`، `admin/games.tsx`.
5. الشارات المكرر: «آجل مرحّل»، شارات GuestBell — بدل ui/Badge.

---

## D. الألوان والخطوط والأيقونات

### D.1 خريطة الاستهلاك اليدوي للاعبين (hex/rgba) — أعلى ملفات
| الملف | عدد |
|---|---|
| `src/app/login.tsx` | 31 |
| `src/app/(store)/packages.tsx` | 24 |
| `src/app/(admin)/_layout.tsx` | 22 |
| `src/app/(admin)/index.tsx` | 22 |
| `ui/StateView.tsx` | 19 |
| `store/TopList.tsx` | 16 |
| `store/TrackedOrdersList.tsx` | 15 |
| `store/BranchGate.tsx` | 14 |
| `ui/AppInput.tsx` | 11 |
| `GameCard.tsx` | 11 |
| `admin/AdminInvoiceCard.tsx` | 10 |
| `ui/ModalSheet.tsx` | 9 |
+ إمبراطورية المصدر `lib/colors.ts` (30+ رموز: brand(teal)، سطوح 6 مستويات، نصوص، دلالية بكتلة (success/danger/warning/info)، ps4Badge/ps5Badge، receiptColors…) و`lib/fonts.ts` (Cairo بأوزان 4). أيقونات SVG يدوية (46، أيقونات بلا 3د).

> **ملاحظة إعادة التصميم:** استبدال TN/تيل بالخضري CBB لم `grep '#14b8a6\|#2dd4bf\|#042f2e'` صفر، وفما فا العد 40+ ملف لـ tokens. الألسنة 15 أعلاه هي مخطط التحويل المرحلي.

---

## E. مسار الطباعة (تتبّع حرفياً) — [فقرة 7 من الخطة]

### E.1 الامتداد الحالي (من cart، كاشير)
```
زر «إنشاء فاتورة» → setInvoiceOpen(true)        cart.tsx:313-320
    ↓ InvoiceFormModal + onSaved
setInvoiceOpen(false) → clear()                 cart.tsx:348-350
    ↓ setTimeout 180ms (تجنب سباق Modal/Android)
setReceiptInvoice(inv)                          cart.tsx:353
    ↓ NativeReceiptModal (visible + autoPrint)  cart.tsx:357-362
```

### E.2 داخل NativeReceiptModal (قراءة كاملة)
1. `useQuery(invoice-settings)` بـ `staleTime: 5min` — من cart الكاشير يكون من cached (شريط cart fetches نفسه) → فوري غالباً ملاك `:34-39`.
2. الإيصال Native رسم فوري: بلا شبكة، بلا صور، QR محلي ضرب `trackUrl` ✅.
3. autoPrint مشروط بـ `settingsQuery.data` — المسار الافتراض يفتح الطباعة فقط بعد وجود الإعدادات `:69-75`.
4. عند الطباعة: `ExpoPrintDriver.printInvoice` → `composeReceiptHtml` **وها هنا الخللة**: تخزن **fetchInvoiceSettings() جديد من الشبكة** مرة ثانية غير مخزن داخل مسار الرسم! `PrinterDriver.ts:23`, وطباعة `Print.printAsync({html}) — Dialogue يُفتح بعد جلب الإعدادات → هذه هي انتظار شبكة المتوقعة ~0.1–1s+ على 3G.
5. بعد الطباعة: PUT `/invoices/:num/mark-printed` (فشل مبتلع) `:44-46`.
6. مشاركة PDF: `printToFileAsync` + `Sharing.shareAsync` `:49-64`.

### E.3 المسار من لوحة الأدمن
- نفس `NativeReceiptModal` بدون autoPrint (الطباعة بخط يدوي) `(admin)/index.tsx:342-346`؛ الزر الأساسي في البطاقة «طباعة/QR» أو «تسديد المتبقي» `AdminInvoiceCard.tsx:89-125`.

### E.4 مخاطر أول 300ms (من أسوأ إلى الأخف)
| # | الخطر | الموضع |
|---|---|---|
| 1 | **جلب سن المظهر داخل مسار الطباعة** (شبكة عشانية غير مخزنة) | `PrinterDriver.ts:23` |
| 2 | autoPrint مشروط为孩子 await الإعدادات أن كانت غائبة (أول فاتورة بعد restart) | `NativeReceiptModal.tsx:69-75` |
| 3 | إعادة جلب قائمة الفواتير بعد تسديد/إلغاء/حذف (**await refetches حجاب UI**) | `admin/index.tsx:114-126,165-166` |
| 4 | setTimeout 180ms قبل فتح الإيصال (ضروري لسلوك الأم أنَ onPress فتح فوري) | `cart.tsx:353` |
| 5 | إرسال mark-printed داخل مسار (غير حاجب للعرض) | `:44-46` |

✅ الإيجاب الكثير: QR محلي، إيصال بلا صور أو شبكة، طباخت مسار تتبعب في أعلى قبل طباعة dialog.

> **القرار:** مسار الفتح نفسه (فياتورا Modal عبر onSaved) يعمل ممتاز اليوم بعد v1.0.6 — ما يحتاج إصلاحاً في إعادة التصميم: (1) إسقاط second fetch من composeReceiptHtml واستخدامJECTION مخزن، (2) النقطة (1)(2) فوق، (3) الحدّة optimistic من الخطة الخامسة (§7) تبقىَا هدفًا، لا أيضاً إصلاح «الفاقد» ك Svg发生率 setTimeout 180ms.

---

## F. منطق الدفع والجاهزية — **المشاكل الوظيفية الملفّ عليا من المالك** [المرحلة 2 الأولوية]

### F.1 «زبون دفع 50 والسعر 60 — لا است、متعا للنإدخال الجزئي» (مشكلة تحرير المبلغ دفع)
**الظاهرة الحقيقية** (المصدق بالكامل في ق):

1. **القسم سريع يسلح E المستفيد النصي:** QuickPay (آجل/نصف/كامل) `InvoiceFormModal.tsx:257-273` — تضغط تلقائياً يعيّن `paidText` لنفس الاد员工的 القمة. الحقل النصي موجود وتقنيياً مقبول `:244-252`، لكنه يُعيد حماية دائمة:
2. **تعديل الخصم يدوّف أر المبلغ المدفوع أفوياً إلى «كامل»:** عند onChangeText الخصم → `setPaidText(String(nextFinal))` يُفرغ الضغطة اليدويه `.237-241`.
3. **useEffect بتاع `total` يد 因此 إعادة كل شيء إلى «كامل»:** `[visible, editingDraft, total]` `:75-91` — أي تغيير في total يعيد `initPaid = editingDraft?.paid_amount ?? (total − disc)` — يعني دفع جزئ tay عن قصد يُمسَح (هذا يجعل إدخال 50 مع 60 من الإدحاء، بص Ironically أن الحقل حراً).
4. **أفضل لا حدود عل越し المبلغ المدفوع:** `paidAmount = max(0, Number(paidText))` `:68` — يجاز الباً بدون جديد finalTotal؛ وpayload الرسالة ترسل هذه القيمة كما هي `:132-133`.
5. **من قائمة الفواتير لا يوجد دفع جزئي إطلاقاً:** `handleSettleSingle` يسدد **بقية كامل** دائماً `admin/index.tsx:107-119`، وAPI `PUT /invoices/{id}/payment {amount}` يتيح أي مبلغ نظرياً (invoices.ts:153-162) لكن الأ🔐يار يرسل كامل المتبق بغض عين. «تسديد الكل» أيضاً عسود جزئي: `POST /invoices/pay-all` `:90-105`.

**الخطة (مرجع 01):** تستقر طاولة التسديد (ناتج= المتبقي، دفع جزئي يدوي، clamp التراكم)، وإصلاح الماليات في الاستمارة (لا تصافير اليدوي، دفع مقفل بالمدفوعة السابقة، clamp paid ≤ finalTotal).

### F.2 «إذا دفع كامل لا تجعل جهازه جاهزاً» (دفع مسبق ≠ تجهيز)
**المأجورد:** عند الحفظ، الواجهة ترسل دخال منطق فوراً `status: paidAmount >= finalTotal ? 'completed' : 'pending'` — `InvoiceFormModal.tsx:134`.
**الأثر:** في التتبع، `completed` يُعامل كإنجاز الخطوات الأخيرة: `statuses.ts:33` → الخطوة 3 «جاهز للاستلام» تعتبر منجزة، والشارة نقطة خضراء (`TrackCards.tsx:30-37`)، و`statusLabel → 'مكتمل'`. أي **التدفع مسبقاً كاملاً ⇒ التطبيق يُظهر جهاز الزبون «جاهزاً»** دون أي تجهيز فعلي.
زر الزا «جاهzeniu» موجود في شاشة تتبع فقط (`STAFF_STATUSES` شacomment `ready`؛ PUT `/orders/{id}/status` — `orders.ts:25-34`)، لكنه ملغي بما ترسله الواجهة عند الحفظ.

**الخطة:** فصل الاشتقاق: لا الحفظ لم يرسل `'completed'` كجاهزية (مرجع خادم بالتطبل على: الحقل الفعلي في الدفع يجب أن يبقاء 'pending' حتى جاهزية؛ ثم بخش «الجهating توسط» يحول من الصورة الدفعية المكتملة وجوابه مسوى في demo) + عرض الحطأين في الفواتير مقسومان: **حالة الدفع ≠ حالة الطلب**.

### F.3 «زر جعل جميع الأجهزة جاهزة بجانب تسديد الكل»
**الموجد اليوم:** لا يوجد أي إجراء إجماعيان للجاهزية. الأحواج الحالية بالبطاقة: تسديد/إرجاع/طباعة/الطباعة/تعديل/حذف `AdminInvoiceCard.tsx:87-144`. تاجر «تسديد الكل» موجد للدفع `admin/index.tsx:90-105`.
**الخطة:** زر «جَهّز الكل» في صف الأدمن (جوار تسديد الكل) بعد تأكيد واضح + عرض عدد. يتطلب بر']))

---

## G. الإشعارات [فقرة 8 من الخطة]

### الموجود (v1.0.6/1.0.7)
| المكوّن | الحالة |
|---|---|
| `expo-notifications` + config plugin (channel `orders` بشدة HIGH + أيقونة أحادية + projectId EAS) | ✅ مُهيّأ بالكامل `app.config.ts:69-89` |
| تسجيل push token: إذن + `getDevicePushTokenAsync` + **POST /devices/register {token, platform, orderId}** (دفع فاشل التصرف صامت) | ✅ `notifications.ts:29-65` |
| استقبال إشعارات أمامية → Toast; sheeted schedule محلية عند تغيّر الحالة أثناء التتبع | ✅ `:71-172` |
| «نبّهني عند جاهزية» in-track Cannot | ✅ `:84-97`، تستدعي من `track/[id].tsx:64-73` |
| `TrackedOrderWatcher`: polling حالات الطلبات المحفوظة **كل 60ث** → إشعار محلي مجدول عند جاهز | ✅ `TrackedOrderWatcher.tsx:18,47-49` |
| `GuestBell`: ألعاب جديدة بـ polling **5 د** → Toast + درج (لا push servicesReally) | ✅ `GuestBell.tsx:29,65-111` |
| الخادم يبعث push فعلي مربوط لإضافة/تعديل/حذف لعبة | ❓ لا يمكن التأثير من الواجهة؛ التسجيل موجود لكن ما بعد `/devices/register` (منشأ الخادم) خارج ذكرة هذه الواجهة |

> **الخدمة المتبقية** (مرجع خطة 01 §إشعارات): ضمان سلسلة خادم (insert/export/تعديل) → Expo Push دفعات ≤ 100، aggregated للبيانات أبيط، مركز إشعارات داخل التطبيق غير موجود (مجرد درج GuestBell)، جرح دلاله: deep link لتوطيل التفاصيل.

---

## H. مشاكل UX حات المالك ومؤكدة (اعتمدت بأسطر)

| # | المشكلة | التأكيد | الموضع |
|---|---|---|---|
| 1 | Chrome يأكل الشاشة: 4 طبقات sticky قبل أول لعبة (ترويسة+بحث+أحرف+تصنيفات) | ✅ | `store/index.tsx:173-306` |
| 2 | الأدمن 3 شرائط sticky قبل القائمة | ✅ | `admin/_layout.tsx:46-108` + `admin/index.tsx:176-217` |
| 3 | بطاقة الفاتورة: 4 إجراءات بموازين متسوية؛ **الحذف الأحمر جوار اليومية بلا مؤشر خطر** (تأكيد system فقط) | ✅ | `AdminInvoiceCard.tsx:87-144,333-336` |
| 4 | زر «خروج» في ترويسة الأدمن بجوار «كاشير المتجر» | ✅ | `admin/_layout.tsx:69-79` |
| 5 | «تسديد الكل» داخل شريط البحث (mutation كبير بجوار حفل بسيط) | ✅ | `admin/index.tsx:195-205` |
| 6 | نص ملتبس «المتبقي: X (مكتمل)» — عرض الحالتين الأساسيين مُخّلطين | ✅ | `AdminInvoiceCard.tsx:73-84` |
| 7 | شارات فوق أغطية الألعاب (حجم 10sp على `rgba(15,23,42,.88)`+نص ضعيف) قراءة دونيت | ✅ | `GameCard.tsx:339-355` |
| 8 | السعر في البطاقة يشبه حقل إدخال (مستطيل بإطار) بدل زر إجراء | ✅ | `GameCard.tsx:399-457` |
| 9 | حالات loading/empty/error شبه كاملة؛ الناقص: more.tsx، login، خطأ الطباعة داخل الإيصال (Toast فقط) | ~ | StateView importances |
| 10 | غالباً: الإيصال لا عرض البانào (سعر نهائي فقط) — قرار موثّق الناسباب؛ دزsplح إعادة تصميم بَعِثة للعرض غسان (الطباعة incumbentF للشركة) | — | `NativeReceiptModal.tsx:146-149` |

---

## I. الأمان [نظرة سريعة]

| النقطة | الحالة | المرجع |
|---|---|---|
| ثواني التمهيد في التوكن: **SecureStore** | ✅ كما هو | `auth.ts:8,36-40`؛ `storage.ts:8-31` |
| **لكن** fallback:ع� `SecureStore` يفشل ⇒ `AsyncStorage.setItem` عادي (توكن نصي) | ⚠️ يجب إزالة السبب المسبب أو تنبيه | `storage.ts:16-23` |
| لا وسواس مفاتيح سكريت في البندل (ذهب بديل هست EXPO_PUBLIC_API_BASE + projectId Push العام) | ✅ | `app.config.ts:5,86-89` |
| لا console.log حساس بصف معولم | ✅ | grep صفر |
| 401 → تسجيل خروج تلقائي | ✅ `client.ts:66-68`، `_layout.tsx:51-53` |
| HTML الطباعة `escapeHtml` على الحقول | ✅ `receiptHtml.ts:132-138` |
| رقم هاتف افتراضي hardcode `'0910683599'` في cart (بيانات تحكم — نقاش عام) | ⚠️ | `cart.tsx:136,151` |
| APK خارج Play Store (تثبيت خارجي + UpdateSheet) | ملاحظة: تحذير دائم بِ«مصادر غير معروفة» موجود — يجب الحفاظ عليه | `UpdateSheet.tsx` |

---

## J. خلاصة المرحلة الأولى

1. **بنية صحية تقنياً** (SDK 58 حديث، RQ+Zustand+Reanimated، tokens جزئية).
2. **الطباعة تعمل فوراً عملياً**؛ يلزم فقط إسقاط fetch المكرر داخل `composeReceiptHtml` + تحسين حس الشبكة (audit-log مهم في §7).
3. **الجاهزية مشتبهة بالدفع (F.2)** — الاشتقاق في نقطة واحدة `InvoiceFormModal.tsx:134` + عرض تتبع يعامل `completed` كجاهز. الإصلاح يتطلب فصلاً (واجهة أولاً + توثيق سلوك الخادم).
4. **الدفع الجزئي مسدود من قائیمتين** (الاستمارة تعيد ذاته، البطاقة تسدد كامل) —IntegerField ثلاثية في F.1.
5. **إشعارات push شبه مكتملة من جهة العميل**؛ المتبقي خادم + مركز إشعارات UI.
6. **إعادة التصميم** تستبدل الثيم الداكن/التيل بالثيم الفاتح الكريمي الجديد عبر 40+ ملف لون، والشريط الأصعب هو أعلى 15 ملفاً في المقطع D.1.
