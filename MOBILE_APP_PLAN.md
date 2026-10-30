# MOBILE_APP_PLAN.md — تطبيق «الشارده ستور» (React Native + Expo)

> **اقرأ هذا الملف كاملاً قبل أي عمل.** هو الأمر والخطة معاً. ضعه في جذر مشروع الويب (بجانب `backend/` و`frontend/`) وأنشئ التطبيق في `mobile/`.

## 0. المطلوب بالضبط

بناء **تطبيق أندرويد أصلي بـ React Native + Expo** يحمل اسم **«الشارده ستور» (Alsharida Store)**، وبداخله نفس فكرة المتجر الحالي: هوية النفار ومتجر الألعاب ولوحة التحكم (الفواتير، التقارير، الألعاب، الباقات، المستخدمون، الفروع...). الباكند الحالي (Express على Vercel) **يبقى كما هو** والتطبيق يتصل به عبر الـ API.

- **اسم التطبيق تحت الأيقونة:** الشارده ستور
- **الاسم الإنجليزي:** Alsharida Store
- **معرّف الحزمة المقترح:** `store.alsharida.app` (يؤكده صاحب المشروع قبل أول بناء)
- **داخل التطبيق:** الشعار والألوان وأسماء الأقسام وفكرة المتجر كما هي في موقع النفار. اسم المتجر على الفواتير يأتي من `/api/invoice-settings` (الافتراضي في الكود «الشارده للإلكترونيات»)، فلا يُكتب ثابتاً في التطبيق.

## 1. القواعد الصارمة (لا استثناء)

1. **ممنوع WebView بكل أشكاله.** لا `react-native-webview`، ولا تحميل الموقع داخل التطبيق، ولا Capacitor ولا Cordova ولا TWA ولا iframe. كل شاشة تُبنى بمكونات React Native أصلية (`View` و`Text` و`FlashList`...).
   - مسموح فقط: توليد **HTML داخلياً لـ `expo-print`** لصنع PDF أو للطباعة. هذا ليس عرضاً لصفحة ويب، ولا يُعرض أي HTML للمستخدم داخل التطبيق. شاشة الفاتورة نفسها تُبنى أصلياً.
2. **Expo + TypeScript + Expo Router**، وبناء مخصص (Dev Client) بدل Expo Go. ممنوع Flutter ومهارات Dart/Flutter.
3. **لا أسرار في التطبيق.** لا `TURSO_*` ولا `CLOUDINARY_*` ولا `JWT_SECRET` ولا `GEMINI_API_KEY` ولا كلمات مرور. التطبيق يعرف فقط `EXPO_PUBLIC_API_BASE`. التحقق من الدور يبقى على الخادم.
4. **لا تعدّل `backend/` أو `frontend/`** إلا في بنود القسم 6، وبعد عرض الفرق (diff) على صاحب المشروع. لا تنسخ ولا تحوّل ملفات `frontend/src` كما هي. **اقرأها كمرجع** للمنطق والنصوص والتدفقات، ثم أعد بناءها أصلياً.
5. **ملف واحد لا يتجاوز نحو 300 سطر.** فكّك `App.jsx` و`Admin.jsx` إلى شاشات ومكونات.
6. **كود كامل بلا اختصارات** (`// ...` و`TODO` و«بقية الكود مشابه» ممنوعة).
7. **اعمل على فرع جديد** (مثل `feat/mobile-app`) وادفع بعد كل مرحلة، ولا تدفع إلى الفرع الرئيسي.

## 2. المهارات المثبتة (OpenCode): ماذا تستعمل ومتى

**استعمل:**

| المهارة | متى |
| --- | --- |
| `audit-context-building` | قبل أي كود: قراءة مسارات الباكند وتدفقات الواجهة سطراً بسطر لبناء السياق |
| `grill-with-docs` | بعد قراءة المشروع وقبل المرحلة 0: تحدَّ هذه الخطة بأسئلة، وأنشئ `CONTEXT.md` بمصطلحات المجال (فاتورة، طلب، باقة، فرع، ضيف...) |
| `brainstorming` | قبل تصميم كل مجموعة شاشات جديدة (خاصة لوحة الإدارة على الموبايل) |
| `autonomous-software-engineering` | في كل مرحلة: فحص الجذور، تخطيط آمن، تنفيذ كامل، اختبار |
| `full-output-enforcement` | دائماً: ملفات كاملة بلا نماذج مؤقتة |
| `impeccable` و`ui-ux-pro-max` | تصميم الشاشات وصقلها، وإمكانية الوصول، والحركة |
| `design-taste-frontend` | تجنّب الشكل القالبي، والحفاظ على هوية النفار الداكنة |
| `arabic-uiux-master` | RTL والمحتوى ثنائي الاتجاه والنماذج والتنقل |
| `arabicskill` | نصوص الأزرار والأخطاء والحالات الفارغة بالعربية |
| `backend-architect` و`database-design-engineering` | تعديلات الباكند في القسم 6 (جدول `device_tokens` وغيره) |
| `api-audit` و`owasp-audit` | قبل النشر: مراجعة المسارات الحساسة (`backup/restore/seed/debug/clear`) والصلاحيات |
| `dependency-audit` | على `mobile/package.json` قبل كل إصدار |
| `code-review` و`differential-review` | بعد كل مرحلة وقبل الدفع |
| `code-documentation` و`natural-writing` | `mobile/README.md` وتعليقات الكود والـ commits |

**لا تستعمل:** كل مهارات `dart-*` و`flutter-*` (المشروع React Native وليس Flutter)، و`odoo`، و`accounting-*` و`saas-accounting-system`، و`modular-saas-*` و`multi-tenant-*`، و`daftar-press` (هويتها لتطبيقات المالية وليست هوية النفار). و`pci-audit` فقط إن ظهر في المشروع دفع ببطاقات.

## 3. ما تقرأه من مشروع الويب قبل البدء (بهذا الترتيب)

1. `README.md` و`docs/ARCHITECTURE_AUDIT.md` و`.env.example` (للأسماء فقط، لا قيم)
2. `backend/server.js`: كل مسارات `/api/*` (نحو 105)، والمصادقة في `backend/middleware/auth.js`، والتحقق من الأدوار والفرع (`branch_id`)
3. `frontend/src/api.js`: معترضات التوكن والفرع و401
4. `frontend/src/App.jsx`: المتجر، وضع الضيف، اختيار الفرع، الفئات، البحث والفرز، السلة، الطلب
5. `frontend/src/OrderTracking.jsx` و`Invoice.jsx` و`utils/invoicePrint.js`: تتبع الطلب والفاتورة وقالب الطباعة
6. `frontend/src/Admin.jsx` وكل `*Tab.jsx` (`InvoicesTab` و`DailyReportTab` و`GamesTabNew` و`PackagesTab` و`UsersTab` و`BranchesTab` و`GenreSeriesManager` و`InvoiceSettings`): لوحة الإدارة
7. `frontend/src/styles.css` و`tailwind.config.js` و`index.html`: الألوان والخط (Cairo) وأسلوب الهوية، لتُنقل إلى ثيم التطبيق
8. `frontend/assites/` و`frontend/public/`: الشعار والأيقونات (مرجع لأيقونة التطبيق وشاشة البدء)

**حقائق تحققنا منها في المستودع** (لا تفترض غيرها):

- الباكند يسمح صراحة بالطلبات بلا Origin، فالـ CORS لا يعيق التطبيق.
- رفع الصور يقبل JSON `{filename, data(base64)}` عبر `POST /api/uploads` (يتطلب توكن)، فلا حاجة لـ multipart.
- `socket.js` محاكاة فارغة: لا تنقل Socket.io.
- الطباعة عبر `sunmi-printer.js` ترسل HTTP إلى IP محلي ولا تعمل من Vercel. **لا تعتمد على `/api/print-invoice`** (انظر القسم 5).
- التوكن JWT يُرسل في `Authorization: Bearer`، وكل مستخدم له `role` و`branch_id`.
- `GET /api/orders` وقوائم الإدارة تتطلب توكناً، بينما `POST /api/orders` عام ومحدود المعدل.

## 4. المعمارية والتقنيات

| المجال | الاختيار |
| --- | --- |
| الإطار والتوجيه | Expo SDK الحديث + TypeScript + Expo Router |
| التنسيق | NativeWind (Tailwind) بثيم داكن من `tailwind.config.js` الحالي |
| البيانات | TanStack Query + axios |
| الحالة | Zustand + AsyncStorage (ضيف، فرع، فئة، سلة، فاتورة قيد التعديل) |
| التوكن | `expo-secure-store` |
| القوائم والصور | FlashList + expo-image |
| النماذج | react-hook-form + zod |
| العربية | `I18nManager.forceRTL` + خط Cairo (`expo-font`) |
| الإشعارات | expo-notifications + FCM |
| الطباعة | expo-print + expo-sharing، وطباعة حرارية من الجهاز (القسم 5) |
| QR | react-native-qrcode-svg + expo-camera للمسح |
| الاختبار | Jest + Maestro |

```text
mobile/
  app/
    (store)/            # رئيسية، فئات، بحث، باقات، سلة
    track/[id].tsx      # تتبع الطلب
    (admin)/            # لوحة الإدارة: تبويبات سفلية
    login.tsx
  src/
    api/  stores/  components/  features/  lib/  print/
  assets/               # خط Cairo، شعار النفار، أيقونة الشارده ستور
  app.config.ts         # name: "الشارده ستور"، الحزمة، EXPO_PUBLIC_API_BASE
  eas.json
```

مطابقة سريعة: `localStorage` ← SecureStore/Zustand، و`window.location.hash` ← Expo Router، و`window.print` ← expo-print، و`qrcode` ← react-native-qrcode-svg، وWeb Push ← expo-notifications، و`InstallPrompt`/PWA/`sw.js` ← تُحذف.

## 5. الطباعة الحرارية (أكبر مخاطرة)

لا تُرسل الفاتورة إلى `/api/print-invoice`. اطبع من **الجهاز نفسه**. اسأل صاحب المشروع أولاً عن نوع الجهاز:

- **Sunmi مدمجة:** مكتبة أصلية للطابعة المدمجة (تحتاج Dev Client).
- **طابعة Bluetooth:** مكتبة ESC/POS (تحتاج Dev Client).
- **بلا طابعة:** PDF عبر `expo-print` ومشاركة.

العربية على الطابعات الحرارية مشكلة (تشكيل واتجاه)، والأفضل **طباعة الفاتورة كصورة** لا كنص. عرض الورق 58 أو 80 مم من `invoice-settings`. واجعل الكود وراء واجهة واحدة `PrinterDriver` حتى تُبدَّل الطابعة دون المساس بالشاشات.

## 6. تعديلات الباكند المسموحة (بعد موافقة صاحب المشروع على الفرق)

1. **إشعارات الجوال:** جدول `device_tokens (order_id, expo_push_token)` ومسار `POST /api/notifications/register-device`، وإرسال الإشعار عند تغيير الحالة في `PUT /api/orders/:id/status` و`PUT /api/invoices/:id/status`. يبقى Web Push كما هو.
2. **رابط QR بمسار عادي:** مسار `/t/:رقم` على Vercel يفتح التطبيق إن كان مثبتاً أو يعيد التوجيه إلى `/#/track/:رقم`، مع `/.well-known/assetlinks.json`. حافظ على الرابط القديم لأن الفواتير المطبوعة تستعمله.
3. **اختياري:** `GET /api/app-version` لأدنى إصدار مسموح.
4. **اختياري:** حذف المسارات المكررة في آخر `server.js` (نحو السطرين 4396 و4529) بعد التأكد أي نسخة هي المنفّذة.
5. **يُفحص:** حجم رد `GET /api/games`، وإن كان يعيد المكتبة كلها فأضف ترقيم صفحات.
6. **أمن:** تأكد أن `/api/debug/db-schema` و`/api/backup-database` و`/api/restore-database` و`/api/seed-*` و`/api/clear-classifications` محمية بـ `requireAdmin`، ولا تظهر في التطبيق لغير المدير الرئيسي.

## 7. المراحل (المدد تقريبية لمطوّر واحد)

لكل مرحلة: افتح بـ `brainstorming` للشاشات الجديدة، نفّذ بـ `autonomous-software-engineering`، وأغلق بـ `code-review` ثم commit ودفع.

0. **التجهيز (2–3 أيام).** `mobile/` بـ Expo وTypeScript، `app.config.ts` باسم «الشارده ستور»، EAS، Firebase، `.env` للتطبيق. *المخرج: تطبيق فارغ على هاتف حقيقي يقرأ `/api/health`.*
1. **الأساس (3–4 أيام).** عميل الـ API (معترض التوكن والفرع و401)، المخازن، RTL وCairo، الثيم الداكن، شاشة البدء بشعار النفار، مكونات مشتركة.
2. **متجر الزبون (2–3 أسابيع).** الفرع، وضع الضيف، الفئات، شبكة الألعاب مع البحث والفرز بالسلسلة والنوع وتقسيم الشاشة، `TopList`، الباقات وزر «عرض الألعاب»، السلة، إرسال الطلب.
3. **تتبع الطلب والإشعارات (4–5 أيام).** `track/[id]`، رابط عميق من QR، ماسح QR، إشعارات الحالة.
4. **نشر إصدار الزبائن (أسبوع).** اختبار أجهزة، تصليحات، `api-audit` و`dependency-audit`، متجر Google Play (اختبار داخلي).
5. **الفواتير والطباعة (1–2 أسبوع).** دخول الموظف والمدير، إنشاء الفاتورة وتعديلها، شاشة الفاتورة أصلية، PDF و`PrinterDriver`، الدفع المجمّع وتغيير الحالة.
6. **لوحة الإدارة (3–4 أسابيع).** تبويبات سفلية. الأهمية: الفواتير والتقرير اليومي ← الألعاب (إضافة وتعديل ورفع صور وGemini) ← الباقات والفئات والخدمات والأنواع والسلاسل ← المستخدمون والفروع ← الإحصائيات وسجل النشاط وإعدادات الفاتورة. الجداول العريضة تتحول إلى بطاقات.
7. **التصليب (أسبوع).** Maestro، أداء القوائم على أجهزة ضعيفة، انقطاع الإنترنت، صلاحيات كل دور، `owasp-audit`.
8. **النشر (3–5 أيام).** إصدار الإدارة، EAS Update، Sentry. Google Play قد يطلب فترة اختبار مغلقة للحسابات الشخصية الجديدة.

## 8. معايير الإنجاز (Definition of Done)

- لا يوجد `react-native-webview` ولا أي تحميل لصفحة ويب في `mobile/` (تحقق بـ `grep -ri webview mobile/ --include=*.{ts,tsx,json}`).
- الاسم تحت الأيقونة «الشارده ستور»، والشعار والهوية الداخلية للنفار.
- كل المسارات الظاهرة في التطبيق تعمل على جهاز أندرويد حقيقي، بالعربية RTL وبدون نصوص مقطوعة.
- لا أسرار في الحزمة، ولا ثغرات حرجة في `dependency-audit`.
- كل شاشة جديدة لها اختبار أو مسار Maestro.
- `mobile/README.md` يشرح التشغيل والبناء والمتغيرات.

## 9. ابدأ هكذا

1. نفّذ `audit-context-building` على `backend/server.js` و`frontend/src`.
2. نفّذ `grill-with-docs` على هذه الخطة، واكتب `CONTEXT.md`، واسأل صاحب المشروع عن: نوع طابعة الموظف، ومعرّف الحزمة، وحساب Expo وGoogle Play وFirebase، والنطاق الأول (الزبائن فقط أم مع الإدارة).
3. ابدأ المرحلة 0.
