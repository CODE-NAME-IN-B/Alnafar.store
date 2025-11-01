# 🚀 Render Deployment - FREE

## Quick Deploy to Render (100% Free)

### 1. One-Click Deploy
Click this button to deploy instantly:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/CODE-NAME-IN-B/Alnafar.store)

### 2. Manual Deploy Steps
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo: `CODE-NAME-IN-B/Alnafar.store`
5. Use these settings:
   - **Name**: `alnafar-store`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3. Environment Variables
Add these in Render dashboard:
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
GEMINI_API_KEY=optional
```

### 4. Free Plan Limitations
- ✅ **Completely FREE** - No credit card required
- ⚠️ **Sleeps after 15 minutes** of inactivity
- ⚠️ **Cold start** - Takes 30-60 seconds to wake up
- ✅ **750 hours/month** - Enough for most projects
- ✅ **Custom domain** supported
- ✅ **HTTPS** included

### 5. Your App URLs
After deployment:
- **Main Site**: `https://alnafar-store.onrender.com`
- **Admin Panel**: `https://alnafar-store.onrender.com/#/admin`

### 6. Features Included
- 🎮 **Full game store** with 200+ games
- 💾 **SQLite database** with all data
- 🖼️ **All game images** included
- 🧾 **Invoice system** (printer may need local network)
- ⚙️ **Admin panel** with full management
- 📱 **Mobile-responsive** design
- 🔐 **Authentication** system

### 7. Wake Up Service (Optional)
To prevent sleeping, you can use:
- **UptimeRobot** (free) - Pings your site every 5 minutes
- **Cron-job.org** (free) - Scheduled requests

### 8. Database Persistence
- ✅ **SQLite file** is included in the repo
- ✅ **Data persists** between deployments
- ⚠️ **New data** added via admin panel may be lost on redeploy
- 💡 **Solution**: Export/backup important data regularly

## Cost: $0.00 Forever! 🎉

Perfect for:
- ✅ Personal projects
- ✅ Portfolios
- ✅ Small business sites
- ✅ Testing and development
- ✅ Learning projects
