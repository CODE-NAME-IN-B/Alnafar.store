# 00b-web-reference.md — مرجع موقع التحميل البصري والحركي (المرحلة 1)

> **تنبيه مسار (مهم):** المسار المذكور في PLAN.md (`docs/redesign/web-reference`) **غير موجود في المستودع**.
> كود موقع التحميل الفعلي موجود بالكامل في: **`alnafar-store-download-app-site/`** (المصدر React+Vite في `src/`، بناء جاهز في `dist/`).
> كل القيم أدناه مستخرجة حرفياً من `alnafar-store-download-app-site/src/`، وتحققنا من مطابقتها مع مخرجات الـ build في `dist/assets/` (نفس الـ keyframes). أي قيمة غير موجودة في المصدر موسومة صراحة بـ«غير موجود في المصدر». حسابات التباين الوحيدة موسومة بأنها «حساب تقريبي».

---

## A. جرد الملفات + الإطار

| الملف | الحجم | الدور |
|---|---|---|
| `src/App.jsx` | ~10.8 KB | الصفحة كاملة: hooks الحركة (`useScrollReveal`، `usePageMotion`) + المكونات |
| `src/App.css` | ~9.7 KB | التخطيط + الألوان + الحركة الأساسية (`fade-up`، `phone-float` v1) |
| `src/animation.css` | ~14.6 KB | طبقة الحركة + **طبقة أداء أخيرة (س178-206) تتجاوز/تعطّل ما قبلها** |
| `src/index.css` | ~1.3 KB | tokens الألوان + الخطوط + ضجيج الخلفية |
| `src/main.jsx` | 237 B | React 19 StrictMode entry |
| `index.html` | 784 B | `lang="ar" dir="rtl"`، theme-color `#f4efe4` |
| `dist/index.html` + `dist/assets/*` | JS 235KB + CSS 24.6KB | build مطابق للمصدر (تحقق: نفس الـ keyframes) |
| `public/assets/` | — | `user-app-screenshot.png/webp` (لقطة التطبيق، ~1080×2254)، `user-logo.png/webp` |
| `previews/` | — | لقطات desktop/mobile رسمية |
| `app.config.ts` / `manus-routes.json` | — | بقايا توليد Manus (انظر F) |
| `docs/references/*.html` (داخل مجلد الموقع) | — | مرجعان قديمان بهوية تيل/قديمة — **ليسا المصدر** (انظر F.8) |

**الإطار:** **React 19.1.0 + Vite 6.4.1**، أيقونات **lucide-react 0.468.0** فقط. **لا Tailwind ولا أي مكتبة أنيميشن** — الحركة كلها CSS + IntersectionObserver ×2 + rAF ×5 من كود App.jsx نفسه. صفحة SPA واحدة، عربية بالكامل.

## B. جدول الألوان (القيم الحرفية)

**Tokens — `src/index.css` (`:root`):**

| Token | القيمة المصدرية | ملاحظة |
|---|---|---|
| `--bg` | `#f4efe4` | خلفية body + theme-color في index.html |
| `--paper` | `#fffdf8` | |
| `--paper-soft` | `#f7f3ea` | معرَّف، غير مستعمل فعلياً |
| `--ink` | `#242821` | |
| `--muted` | `#72766d` | ⚠️ تباين ~4.07:1 على `#f4efe4` (حساب تقريبي) — انظر F.5 |
| `--line` | `#ded8ca` | |
| `--green` | `#336b5a` | |
| `--green-dark` | `#244f43` | |
| `--lime` | `#c8d886` | |
| `--violet` | `#7667a7` | بقايا، غير مستعملة فعلياً |

**القيم المركّبة (كما وردت حرفياً):**

| الاستعمال | القيمة الحرفية |
|---|---|
| خلفية hero | `linear-gradient(120deg,rgba(255,253,248,.88),rgba(238,231,217,.88))`، radius **32px**، حد `1px solid rgba(73,89,73,.13)`، ظل `0 24px 70px rgba(54,53,42,.055)` |
| ضجيج الخلفية | `radial-gradient(circle at 1px 1px,rgba(52,83,68,.08) .75px,transparent .9px)` grid 26px، mask يتلاشى عند 55% |
| **خط edge lime أسفل hero** | `height:3px; background:linear-gradient(90deg,transparent,var(--lime),var(--green),transparent); opacity:.62` |
| **تدرج العنوان الأخضر** | `linear-gradient(105deg,var(--green-dark) 0%,var(--green) 34%,#9caf6c 49%,var(--green) 62%,var(--green-dark) 100%)`، `background-size:230% 100%`، `background-clip:text` |
| شارة eyebrow | حد `rgba(51,107,90,.2)`، bg `rgba(255,253,248,.78)`، نص `var(--green-dark)` 13px/700، نقطة 8px `var(--green)` + حلقة `0 0 0 4px rgba(51,107,90,.1)` |
| زر رئيسي | bg `var(--green)`, نص `#fff`، ظل `0 8px 17px rgba(40,91,74,.16)`؛ hover: `var(--green-dark)` + `translateY(-2px)` |
| زر ثانوي (quiet) | bg `rgba(255,253,248,.75)`, حد `var(--line)`, نص ink؛ hover: bg `var(--paper)` + حد `#b9c8ae` |
| هالة الهاتف | `radial-gradient(circle,rgba(200,216,134,.32) 0,rgba(200,216,134,.15) 50%,transparent 74%)`؛ حلقتا دوران: dashed `rgba(51,107,90,.19)` و solid `rgba(51,107,90,.1)` |
| قالب الهاتف | جسم `#20241f`، حد `1px solid #333b32`، radius 34px، ظل كبير + inset `rgba(255,255,255,.4)`؛ شاشة خلف اللقطة `#08111d` |
| مسح الشاشة (scan) | `linear-gradient(180deg,transparent,rgba(255,255,255,.26),rgba(200,216,134,.15),transparent)`، `mix-blend-mode:screen` |
| قسم التثبيت | bg `linear-gradient(130deg,#eee8db,#e9e5d7)`، حد `rgba(73,89,73,.14)`، radius 26px؛ أيقونة: bg `var(--ink)` + لون `var(--lime)`؛ kicker `#336b5a`؛ نصوص ثانوية `#656b60`/`#6e736a` |
| شريط التقدم | `linear-gradient(90deg,var(--lime),#55bba0,var(--green))` (ملاحظة: `#55bba0` تيل خارج القاموس — انظر F.4) |
| selection / focus | `background:rgba(200,216,134,.55); color:var(--ink)` · `outline:3px solid #82a490` (أزرار: `rgba(51,107,90,.45)`) |

## C. جدول الخطوط

| العنصر | القيم الحرفية |
|---|---|
| العائلات | عربي: **IBM Plex Sans Arabic** (400/500/600/700) + Tahoma؛ لاتيني/أرقام وbrand: **Space Grotesk** (500/600/700) |
| التحميل | Google Fonts عبر `@import` في أول سطر من index.css — لا خطوط محلية |
| body | `line-height:1.7`، antialiasing |
| h1 (hero) | `clamp(46px,5.4vw,68px)`؛ line-height 1.23؛ letter-spacing -1.5px؛ weight 700؛ text-wrap:balance؛ السطر الثاني span بتدرج أخضر |
| h2 (قسم التثبيت) | `clamp(29px,3vw,39px)`، lh 1.4 |
| hero-lead | `17px`، lh 1.95، لون `#62685f`، max-width 430px |
| الأزرار | `700 14px`، min-height **52px**، padding `0 19px`، radius **13px** |
| الشعار اللاتيني | ALNAFAR 15px/700 بتباعد .06em (direction:ltr)؛ سطر الشريك 8px/700/.11em |
| أرقام الخطوات | `700 12px var(--latin)`, direction:ltr — بصيغة «01, 02…» |
| نصوص ثانوية | hero-footnote 12px، download-note 10px، خطوات 11px/1.6، فوتر 11px ⚠️ |
| موبايل | ≤850px: h1 `clamp(42px,8.2vw,57px)`؛ ≤480px: h1 42px، زر 12px/min-height 48px، نصوص تنخفض إلى 10px ⚠️ |

## D. جدول الحركات (القيم حرفية)

**المنحنى التوقيعي: `cubic-bezier(.18,.7,.25,1)`.** ثانويات: `(.2,.7,.25,1)`, `(.2,.65,.25,1)`, `(.3,.05,.55,.95)`.
**بنية المصدر:** `animation.css` يحوي طبقة أخيرة (س178-206) تعطّل/تُبطئ تعريفات سابقة؛ كل ما يلي = **القيمة النهائية المفعّلة بعد الطبقات**.

### D.1 @keyframes النهائية ال... المفعّلة

| الاسم | الخصائص | المدة / Easing | أين | مقترح Reanimated |
|---|---|---|---|---|
| `phone-float` (النهائية) | `perspective(950px) translate3d(0,7px,0) rotateZ(-2deg)` ↔ `translate3d(0,-13px,0) rotateZ(2deg)` + tilt المؤشر عبر `--device-tilt-x/y` | `4.3s ease-in-out infinite` | mockup الهاتف | `withRepeat(withSequence(withTiming(-13,{duration:2150,easing:Easing.inOut(Easing.ease)}), withTiming(7,{duration:2150,easing:Easing.inOut(Easing.ease)})),-1,true)` + rotateZ متزامن |
| `text-light-sweep` | `background-position: 100% 0 → 0 0` على تدرج 230% | 8s `ease-in-out infinite` | السطر الثاني من h1 (span التدرج) | MaskedView + طبقة تدرج تنزلق `withTiming(width, {duration:8000})` |
| `edge-light-sweep` | `background-position: 100% 0 → -120% 0` (حجم 220%) | 8s `linear infinite` | خط edge lime أسفل hero | `translateX = withRepeat(withTiming(-1.2*w..w,{duration:8000,easing:Easing.linear}),-1)` + opacity .62 |
| `orbit-spin` / `orbit-counter-spin` | `rotate(360deg)` / `-360deg` | `23s / 31s linear infinite` | الحلقتان حول الهاتف | `withRepeat(withTiming(360,{duration:23000/31000,easing:Easing.linear}),-1)` باتجاهين |
| `halo-breathe` | `opacity:.72, scale:.97` ↔ `opacity:1, scale:1.03` | `4.8s ease-in-out infinite` | هالة الهاتف | حلقة opacity+scale 2400ms لكل نصف |
| `signal-beacon` (النهائية) | `opacity:.72→1→.72, scale(.94→1.08→.94)` | `2.4s ease-in-out infinite` | نقطة شارة eyebrow | حلقة opacity+scale 2.4s |
| `side-signal` | `opacity:.72→1` | `3.4s ease-in-out infinite` | زر الهاتف الجانبي | حلقة opacity 3.4s |
| `icon-lift` | `translateY(0→-3px→0)` | `2.8s ease-in-out infinite` | أيقونة chip الترويسة | withRepeat translateY -3 |
| `install-light-sweep` | `translateX(-150%) skewX(-18deg) → translateX(460%)`، opacity 0→.28→.18→0 | **9s ∞** (كانت 7s، بطّأتها طبقة الأداء) | مسح القسم السفلي | overlay + `withRepeat(withTiming(w*4.6,{duration:9000}),-1,true)` |
| `screen-scan` | `translateY(-20%→570%)`، opacity 0→.7→.42→0 | `7.4s cubic-bezier(.3,.05,.55,.95) infinite` | شريط فوق لقطة الشاشة (mix-blend screen) | `withRepeat(withTiming(h*5.7,{duration:7400,easing:Easing.bezier(.3,.05,.55,.95)}),-1,true)` |
| `header-arrive` | `opacity:0; translateY(-12px) → 1,0` | `.78s cubic-bezier(.18,.7,.25,1) both` | الترويسة (delay 0ms) | `FadeInDown.duration(780)` بنفس easing |
| `badge-arrive` | `translateY(8px) scale(.96) → 0/1` | `.65s … delay .08s both` | شارة eyebrow | `FadeInDown.duration(650).delay(80)` |
| `copy-arrive` | `translateY(15px) → 0` + opacity | h1 `.82s@.16s`؛ lead `.78s@.25s`؛ actions `.72s@.34s`؛ footnote `.72s@.42s` — كلها بنفس المنحنى | تسلسل دخول hero | stagger `FadeInDown` بـ duration/delay أعلاه |
| `fade-up` | `opacity:0; translateY(16px) → 1,0` | hero-copy `.75s`؛ hero-visual `.8s delay .12s` | الحاوية + العمود البصري | يُستغنى عنه عند أطفاله stagger (تكرار — انظر F.7) |
| `reveal` (scroll) | `opacity:0; translateY(16/30px) scale(.985) → is-visible` | `.6s/.8s cubic-bezier(.18,.7,.25,1)`، delay الفوتر .1s | قسم التثبيت + الفوتر (IntersectionObserver) | `entering={FadeInDown.duration(800) بنفس easing}` بمراقب تواجد |
| stagger التثبيت | `opacity:0; translateX(22px) → 0` | `.58s/.68s`، delays `.08/.18/.28/.38s` | خطوات التثبيت 1-4 | `FadeInDown.duration(680).delay(80+100*i)` |
| `brand-hover` | `translate 0 → 0 -2px` | `4.8s ease-in-out infinite` | ظل نعومة الشعار | withRepeat translateY -2 |
| `nexus-mark-sweep` | `translateX(-125%→125%) skewX(-12deg)`, opacity 0→.82→0 | `4.2s cubic-bezier(.2,.65,.25,1) infinite`, mix-blend screen | لمعة مربع الشعار | overlay + `withTiming(w*2,{duration:4200})` |
| `nexus-x-pulse` | `scale(1→1.18)` + توهج نص | `2.8s ease-in-out infinite` | علامة × | withRepeat scale |
| `number-pop` | `scale(1 → 1.16 @55%)` | `.34s ease` مرة واحدة | رقم الخطوة عند hover | `withSequence(withTiming(1.16,{duration:170}), withSpring(1))` |

### D.2 الحركات المعطّلة عمداً (لا تُنقل)

`caption-glow`، `nexus-mark-glow`، `ambient-wander`، `cta-aura`، `cta-sheen` — معرّفة ثم `animation:none` في طبقة الأداء. المصدر القائم = بدونها.

### D.3 كل transition بقيمه الحرفية

| العنصر | transition |
|---|---|
| `.button` | `transform .18s ease, background-color .18s ease, border-color .18s ease, box-shadow .18s ease` |
| `.reveal` (عام) | `opacity .6s ease, transform .6s cubic-bezier(.18,.7,.25,1)` |
| قسم التثبيت | نفس النمط بمدة `.8s` |
| خطوات التثبيت | `opacity .58s ease, transform .68s cubic-bezier(.18,.7,.25,1)` + bg/transform `.25s ease` |
| underline مخصص (li:after) | `transform .4s cubic-bezier(.2,.7,.25,1)` — `scaleX(0→1)` بـ **transform-origin: right center** (RTL) |
| `.device-shell` | `filter .35s ease` |
| `.install-icon` | `transform .35s cubic-bezier(.2,.7,.25,1), box-shadow .35s ease` |
| شريط التقدم القراءة | `transform .08s linear` — `scaleX(var(--scroll-progress))`، origin right center |
| رابط الفوتر | svg `transform .25s ease` + gap 5→9px |

### D.4 الحركة عبر JS (App.jsx، بلا مكتبات)

1. **`useScrollReveal`**: `IntersectionObserver` (threshold 0.12، rootMargin `0px 0px -28px 0px`) يضيف `.is-visible` مرة واحدة ثم unobserve — مشروط بعدم `prefers-reduced-motion`.
2. **`usePageMotion`**:
   - شريط تقدم التمرير: scroll listener passive عبر rAF → `--scroll-progress` (0→1) على `<html>`؛ CSS يطبقه `scaleX`.
   - وهج المؤشر (cursor spotlight) على hero: `pointermove` للماوس فقط عبر rAF → `--pointer-x/y`؛ مخفي على اللمس.
   - tilt الهاتف بالمؤشر: rAF → `--device-tilt-x = x*9deg`، `--device-tilt-y = -y*8deg`، يُستهلك داخل `phone-float` مع perspective 950px؛ يعود للصفر عند الخروج.
3. **prefers-reduced-motion**: يُعطِّل كل الحركات (ائر decoded في useScrollReveal + media query).

### D.5 hover states (القيم الحرفية)

| العنصر | عند hover |
|---|---|
| زر رئيسي | `translateY(-2px)` + bg `--green-dark` (+ saturate 1.08 على المؤشر الدقيق) |
| زر ثانوي | `translateY(-2px)` + bg `--paper` + حد `#b9c8ae` |
| زر معطل | `opacity:.64; cursor:not-allowed; box-shadow:none` |
| الهاتف | `filter: drop-shadow(0 30px 40px rgba(36,40,33,.23))` + tilt المؤشر |
| خطوة تثبيت | bg `rgba(255,253,248,.45)` + `translateX(-4px)` + underline gradient green→lime `scaleX(1)` origin right |
| أيقونة تثبيت | `translateY(-3px) rotate(-7deg)` + ظل `0 8px 18px rgba(36,40,33,.18)` |
| رابط فوتر | svg `translateX(-4px)`, gap 5→9px |

## E. مكونات اللغة البصرية (الوصف)

1. **hero**: عمودان (نص يمين بـ RTL / هاتف يسار)، min-height ~625px، padding سخي، radius **32px**، حد رفيع شبه شفاف على تدرج كريمي، ضجيج نقاط بشبكة، خط edge lime 3px أسفله بمسح ضوئي慑، دخول متتالٍ (شارة→عنوان→نص→أزرار→ثقة).
2. **شارة pill (eyebrow)**: «تطبيق Alnafar Store ●» — pill بحد ناعم، نقطة خضراء نابضة بحلقة هالة.
3. **الزران**: رئيسي أخضر ممتلئ بنص أبيض + سهم تنزيل؛ ثانوي شبه شفاف بحد رفيع وسهم اتجاهي (يعكس في RTL).
4. **سطر الثقة**: درع أخضر 16px + نص 12px هادئ «ملف تثبيت Android بصيغة APK».
5. **mockup الهاتف العائم**: جسم داكن radius 34px بحد وinset hint، لقطة تطبيق حقيقية بداخله، زر جانبي متوهج، طفو 4.3s بميل ±2°، tilt يتبع المؤشر ±9°/8°، هالة lime تتنفس، حلقتان تدوران 23s/31s، شعاع مسح 7.4s فوق الشاشة.
6. **الترويسة**: ارتفاع ~86px، شعار (مربع radius 14 بلامعة ماسحة + ALNAFAR لاتيني + سطر شريك صغير بعلامة × نابضة) مقابل chip «تطبيق Android» بأيقونة تتأرجح خفيفاً.
7. **قسم التثبيت**: حاوية radius 26px بتدرج كريمي أغمق قليلاً، kicker لاتيني ltr، h2 كبير، خطوات 01-04 بأرقام لاتينية خضراء + نص bold + سطر صغير + صح، فواصل خفيفة، underline يتكشّف من اليمين عند hover، ومسح ضوئي بطيء 9s يمر على الحاوية.
8. **الفوتر**: شعار صغير + نص 11px + رابط «العودة إلى الأعلى» أخضر بسهم، hover يباعد السهم.
9. **شريط تقدم القراءة** رفيع أعلى الصفحة يتقدم مع التمرير (scaleX، origin يمين).

## F. العيوب — يُمنع نسخها (PLAN §2.5)

1. **زر التنزيل معطل في المصدر**: `APK_DOWNLOAD_URL = ""` يجعل الزر `disabled` بنص «سيُفعّل زر التنزيل عند إضافة رابط…» — حالة placeholder منجمية لمستخدم حقيقي. في التطبيق: لا حالة «زر ميت» أبداً؛ زر التحديث موصول بـ Releases دائماً (سلوك UpdateSheet الحالي).
2. **رسائل «لم يُضف بعد» في المرجعين القديمين** (`href="#"` + شعار placeholder) — ليست مصدراً ولا يُقلَّ عنصرها.
3. **بقايا Manus**: `manus-routes.json` في public/dist، وإشارات CDN خارجي هش (`files.manuscdn.com`) — لا يجوز بناء أي شيء عليها.
4. **لونان خارج الهوية هربا إلى المصدر**: `#08111d` (خلفية شاشة الهاتف قبل اللقطة) و`#55bba0` (تيل في شريط التقدم) — استُبدلان بدرجات green/lime في التطبيق.
5. **تباين دون 4.5 (حساب تقريبي)**: `--muted #72766d` ≈ 4.07:1 يستعمل لنصوص 10–12px (footnote، خطوات، فوتر؛ وفي ≤480px يهبط بعضها إلى 10px). التطبيق: النص الثانوي ≥ 4.5:1 دائماً، وأصغر مقاس 12sp.
6. **حركة زر ميتة**: تأثيرات الزر `cta-aura/cta-sheen` معطلة عمداً في طبقة الأداء — لا تُعاد إضافتها.
7. **ازدواج دخول hero**: الحاوية `fade-up` وأطفالها `copy-arrive` معاً — في RN يكفي stagger الأطفال.
8. **المرجعان القديمان** (HTML بتيل/هوية قديمة وألوان مختلفة) ليسا المصدر؛ المصدر = `src/` حصراً.

## G. ملاحظات مهمة

- **تسلسل الظهور الأول (من المصدر)**: الترويسة 0ms (780ms) → الهاتف يطفو فوراً (4.3s ∞) → العمود البصري 120ms → شارة 80ms → h1 160ms (820ms) → lead 250ms → أزرار 340ms → سطر الثقة 420ms → الأقسام الأخرى بأمرٍ scroll-reveal عند الدخول. الانطباع الأول مكتمل خلال أقل من نصف ثانية.
- **الخطوط webfont خارجية** — render-blocking في الويب؛ التطبيق يحمّلها محلياً (`@expo-google-fonts/ibm-plex-sans-arabic` + Space Grotesk) قبل أول رسم، أي كاملاً للsplash.
- **لقطة الهاتف** تُحمَّل بأولوية عالية (`loading eager / fetchPriority high`، WebP أولاً) — الحرف RN: `expo-image` مع placeholder + cachePolicy.
- **RTL كامل**: `dir="rtl"` من الجذر؛ الشعارات والأرقام والkicker معزولة `direction:ltr`؛ شريط التقدم وunderlines بـ transform-origin **right** (يُقلب في LTR) — في RN: `allowRTL(true)` + ROW من `lib/rtl.ts`.
- **reduced motion كامل من المصدر**: كل keyframes/transition معطلة + تعطيل tilt/spotlight — الحرف RN: `useReducedMotion()`.
- **تعارض الطبقات**: أخذنا آخر طبقة فعّالة (animation.css س178-206) عند أي تعارض. الحركات «المراهنة» كُتبت ثم خُفّضت (مثلاً 7s→9s، 4s→8s) — الإيقاع النهائي بطيء وهادئ عمداً.
- **impact مقترح نقل التوقيع**: خط edge lime أسفل الحاويات (لمسة توقيع قابلة للاستخدام في RN عبر تدرج Reanimated ثابت ومسح mask افتراضي).

---

*المصدر: `alnafar-store-download-app-site/src/index.css` + `App.css` + `animation.css` + `App.jsx`، وتحقّقت المطابقة مع `dist/assets/`. لم تؤخذ أي قيمة من `docs/references/*` القديمين.*
