# 🚀 دليل نشر Alnafar Store على Render

## 📋 المتطلبات الأساسية

✅ حساب Turso مع قاعدة بيانات جاهزة  
✅ حساب Cloudinary مع الصور المرفوعة  
✅ حساب Render (مجاني)

---

## 🗄️ الخطوة 1: نقل البيانات إلى Turso

### 1.1 تأكد من بيانات Turso في `.env.render`

```bash
# تحقق من الملف
cat .env.render
```

يجب أن يحتوي على:
```
TURSO_DATABASE_URL=libsql://alnafar-store-code-name-in-b.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
```

### 1.2 قم بتعطيل VPN مؤقتاً (إن وجد)

```bash
# إيقاف VPN للسماح بالاتصال بـ Turso
```

### 1.3 نفذ سكريبت النقل

```bash
node migrate-to-turso.js
```

**ملاحظة**: إذا فشل الاتصال بسبب VPN/Proxy، يمكنك:
- تعطيل VPN مؤقتاً
- أو تنفيذ السكريبت من جهاز آخر
- أو رفع الكود مباشرة وسيتم إنشاء الجداول تلقائياً على Render

---

## 🌐 الخطوة 2: إعداد Render

### 2.1 إنشاء Web Service جديد

1. اذهب إلى [Render Dashboard](https://dashboard.render.com/)
2. اضغط على **"New +"** → **"Web Service"**
3. اختر **"Build and deploy from a Git repository"**
4. اربط حساب GitHub الخاص بك
5. اختر repository: `Alnafar.store`

### 2.2 إعدادات الخدمة

```
Name: alnafar-store
Region: Frankfurt (EU Central)
Branch: main
Runtime: Node
Build Command: npm install
Start Command: node backend/server.js
Instance Type: Free
```

### 2.3 إضافة Environment Variables

اذهب إلى **Environment** وأضف المتغيرات التالية من ملف `.env.render`:

#### قاعدة البيانات - Turso
```
TURSO_DATABASE_URL=libsql://alnafar-store-code-name-in-b.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjI1NjgxMjgsImlkIjoiNDExNjE2NzctNTNkNy00YzhhLWJmNjctN2E5ZDIzYTE1ZGNlIiwicmlkIjoiNGM2YWVjODMtNzFhMC00ZmI3LTg1M2QtOTJhYjgzZmJkNDUxIn0.JF06pU4FG-ZtEHm4NyPIremplUG-n51E2kdpEU9OswqjKl1SO57cMKGexH4yjFCkooevK254v-7CmhaU_JTvDQ
```

#### تخزين الصور - Cloudinary
```
CLOUDINARY_CLOUD_NAME=da2mztpdu
CLOUDINARY_API_KEY=583648314389879
CLOUDINARY_API_SECRET=mIP6V424gjxCRInXHBJPbAe9SjE
```

#### الإعدادات الأساسية
```
NODE_ENV=production
PORT=5000
```

#### الأمان
```
JWT_SECRET=alnafar_store_secure_jwt_secret_2024_change_this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

#### Gemini AI (اختياري)
```
GEMINI_API_KEY=AIzaSyAM_q1ogOjMsyRyER0k-EnMkQdxkkHOpGo
```

---

## 🚀 الخطوة 3: النشر

1. اضغط على **"Create Web Service"**
2. انتظر حتى يكتمل البناء والنشر (5-10 دقائق)
3. ستحصل على رابط: `https://alnafar-store.onrender.com`

---

## ✅ الخطوة 4: التحقق من النشر

### 4.1 اختبار API

```bash
# اختبار الفئات
curl https://alnafar-store.onrender.com/api/categories

# اختبار الألعاب
curl https://alnafar-store.onrender.com/api/games
```

### 4.2 اختبار الواجهة

افتح المتصفح واذهب إلى:
```
https://alnafar-store.onrender.com
```

### 4.3 تسجيل الدخول

```
Username: admin
Password: admin123
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: قاعدة البيانات فارغة

**الحل**: قم بتنفيذ سكريبت النقل أو أضف البيانات يدوياً:

```bash
# من جهازك المحلي
node migrate-to-turso.js
```

### مشكلة: الصور لا تظهر

**الحل**: تأكد من:
1. ✅ متغيرات Cloudinary صحيحة
2. ✅ الصور تم رفعها على Cloudinary
3. ✅ روابط الصور في قاعدة البيانات تبدأ بـ `https://res.cloudinary.com/`

### مشكلة: خطأ 500 Internal Server Error

**الحل**: 
1. افحص Logs في Render Dashboard
2. تأكد من جميع Environment Variables
3. تأكد من اتصال Turso

---

## 📊 مراقبة الأداء

### Render Dashboard
- **Logs**: لمشاهدة سجلات الخادم
- **Metrics**: لمراقبة الأداء
- **Events**: لمتابعة عمليات النشر

### Turso Dashboard
- **Database**: لمراقبة الاستعلامات
- **Usage**: لمتابعة الاستخدام

### Cloudinary Dashboard
- **Media Library**: لإدارة الصور
- **Usage**: لمتابعة استهلاك النطاق الترددي

---

## 🔄 تحديث التطبيق

عند إجراء تغييرات على الكود:

```bash
git add .
git commit -m "وصف التحديث"
git push origin main
```

سيتم إعادة النشر تلقائياً على Render.

---

## 🎯 نصائح مهمة

1. **النسخ الاحتياطي**: احتفظ بنسخة احتياطية من قاعدة البيانات المحلية
2. **الأمان**: غيّر `JWT_SECRET` و `ADMIN_PASSWORD` في الإنتاج
3. **المراقبة**: راقب Logs بانتظام
4. **التحديثات**: حدّث التبعيات بانتظام

---

## 📞 الدعم

- **Render Docs**: https://render.com/docs
- **Turso Docs**: https://docs.turso.tech
- **Cloudinary Docs**: https://cloudinary.com/documentation

---

✅ **تم! متجرك الآن مباشر على الإنترنت** 🎉
