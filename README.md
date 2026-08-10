# 🛒 نظام كاشير سوبر ماركت - الذكي والمحاسبي المتكامل

بوابة كاملة واحترافية لإدارة السوبر ماركت، المبيعات (POS)، المخازن، الحسابات، شؤون الموظفين، والتقارير المالية، مدعومة بالكامل بالذكاء الاصطناعي (Google Gemini) لتحليل البيانات المالية وإعطاء الاستشارات المحاسبية التلقائية.

---

## 🚀 دليل النشر والرفع على الإنترنت (GitHub & Vercel)

لقد تم إعداد المشروع وتجهيزه بالكامل ليكون متوافقاً مع النشر والرفع الاحترافي على منصة **GitHub** باسم مستودع **نظام كاشير سوبر ماركت** ومن ثم الاستضافة على **Vercel** مجاناً وبأعلى أداء وموثوقية.

### 🌟 الميزات المهيأة مسبقاً للنشر:
1. **دعم كامل لـ Vercel Serverless Functions:** تم إنشاء موديول API خاص في مجلد `/api` لتشغيل المساعد الذكي دون الحاجة لملفات خادم معقدة.
2. **ملف تهيئة `vercel.json` احترافي:** لحل مشاكل التوجيه وتحديث الصفحة (SPA Refresh) وإعادة توجيه المسارات بسلاسة.
3. **تكامل آمن لـ Google Gemini:** مفتاح الذكاء الاصطناعي محمي تماماً ولا يتم تسريبه للمتصفح.
4. **ملف `.gitignore` منظم:** لضمان رفع الكود النظيف فقط وتجنب رفع ملفات `node_modules` أو المفاتيح الخاصة بالخطأ.

---

### 1️⃣ الخطوة الأولى: رفع المشروع على GitHub

1. قم بتثبيت [Git](https://git-scm.com/) على جهازك إن لم يكن مثبتاً.
2. قم بإنشاء مستودع جديد (Repository) على [GitHub](https://github.com/) وقم بتسميته **`cashier-supermarket-system`** أو **`supermarket-cashier-system`** واجعله **خاصاً (Private)** أو **عاماً (Public)**.
3. افتح موجه الأوامر (Terminal) في مجلد المشروع وقم بتشغيل الأوامر التالية بالتتابع:

```bash
# تهيئة مستودع جيت محلي
git init

# إضافة جميع الملفات للمستودع المحلي
git add .

# تسجيل أول التزام (Commit) للكود
git commit -m "feat: initial commit for supermarket cashier system"

# تحديد الفرع الرئيسي
git branch -M main

# ربط المستودع المحلي بمستودع GitHub (استبدل USERNAME باسم حسابك على GitHub)
git remote add origin https://github.com/USERNAME/cashier-supermarket-system.git

# رفع الكود لأول مرة
git push -u origin main
```

---

### 2️⃣ الخطوة الثانية: الرفع والاستضافة على Vercel

1. توجه إلى موقع [Vercel](https://vercel.com/) وقم بتسجيل الدخول باستخدام حساب **GitHub** الخاص بك.
2. اضغط على زر **Add New...** ثم اختر **Project**.
3. ستظهر لك قائمة بمستودعات GitHub الخاصة بك؛ ابحث عن مستودع السوبر ماركت واضغط على **Import**.
4. **تهيئة الإعدادات (Configure Project):**
   * **Framework Preset:** سيقوم Vercel باكتشافه تلقائياً كـ **Vite**.
   * **Root Directory:** اتركه كما هو (الرئيسي `./`).
   * **Build and Output Settings:** اتركها افتراضية (Vercel سيتكفل بالبناء تلقائياً).
5. **المتغيرات البيئية (Environment Variables) 🔑:**
   * افتح قسم **Environment Variables** وأضف المتغير التالي لتفعيل المساعد الذكي:
     * **Name:** `GEMINI_API_KEY`
     * **Value:** *(ضع مفتاح Gemini API الخاص بك المستخرج من Google AI Studio)*
6. اضغط على زر **Deploy**.
7. انتظر أقل من دقيقة، وسيصبح تطبيقك متاحاً على الإنترنت برابط عام فائق السرعة! 🎉

---

## 💻 التشغيل والتطوير المحلي (Local Development)

إذا أردت تشغيل المشروع محلياً على جهازك للتطوير:

```bash
# 1. تثبيت الحزم والمكتبات
npm install

# 2. تشغيل خادم التطوير المحلي
npm run dev
```

سيفتح المشروع محلياً على المنفذ `http://localhost:3000`.

---

## 📁 الهيكل البرمجي للمشروع (Project Structure)

* `/src/components`: جميع الواجهات والتصاميم التفاعلية (POS, Accounts, Settings, AI, Reports, etc).
* `/api`: دوال الخادم السحابي لـ Vercel (Serverless Functions) للتعامل مع الذكاء الاصطناعي بشكل آمن.
* `vercel.json`: إعدادات وتوجيهات Vercel.
* `.gitignore`: لتحديد الملفات المستبعدة من الرفع.
* `.env.example`: نموذج لإعداد المتغيرات البيئية.

---

# 🛒 SuperMarket Pro - Smart Supermarket Management System

An all-in-one professional management system for supermarkets, featuring Point of Sale (POS), Inventory, Accounts, Shifts, Reports, and a smart AI Advisor integrated with Google Gemini API for accounting consultancies.

## 🚀 Deployment Guide (GitHub & Vercel)

This repository is optimized and configured for seamless deployment to **GitHub** and **Vercel** with maximum performance and security out of the box.

### 1️⃣ Step 1: Push to GitHub
1. Create a repository on [GitHub](https://github.com/).
2. Initialize and push your code:
```bash
git init
git add .
git commit -m "feat: initial commit with Vercel configuration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2️⃣ Step 2: Deploy to Vercel
1. Sign in to [Vercel](https://vercel.com/) with GitHub.
2. Import this repository.
3. Add the following **Environment Variable** under settings:
   * **Key:** `GEMINI_API_KEY`
   * **Value:** *(Your Google Gemini API Key)*
4. Click **Deploy**. Your app will be live in seconds!

---

## 🛠️ Tech Stack
* **Frontend:** React 19, Vite, Tailwind CSS, Motion (Framer), Lucide Icons.
* **Backend Integration:** Vercel Serverless Functions, @google/genai SDK, Firebase.
