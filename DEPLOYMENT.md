# 🚀 Deployment Guide - Alnafar Game Store

## Railway Deployment (Recommended - Free)

### 1. Prerequisites
- GitHub account
- Railway account (sign up at https://railway.app)

### 2. Environment Variables
Set these in Railway dashboard:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_here_change_this
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here
GEMINI_API_KEY=your_gemini_api_key_optional
```

### 3. Deployment Steps
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Railway will auto-detect Node.js and deploy
4. Set environment variables in Railway dashboard
5. Your app will be live at: `https://your-app-name.up.railway.app`

### 4. Features Included
- ✅ Full game store with 200+ games
- ✅ SQLite database with all data
- ✅ All game images included
- ✅ Invoice system with Sunmi V2 printer support
- ✅ Admin panel with full management
- ✅ Mobile-responsive design
- ✅ Custom invoice settings
- ✅ Authentication system
- ✅ AI-powered game classification

### 5. Cost Estimation
- **Free tier**: Up to $5/month usage
- **Expected usage**: ~$2-3/month
- **Result**: Completely free for several months!

## Alternative Platforms

### Render.com
- Free tier with limitations (spins down after 15 minutes)
- Good for testing

### Heroku
- Limited free tier
- More expensive for production

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Backend: http://localhost:5000
# Frontend: http://localhost:5001
# Admin: http://localhost:5001/#/admin
```

## Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Database
- SQLite database included with sample data
- No external database required
- Automatic backup on Railway

## File Structure
```
Alnafar.store/
├── backend/
│   ├── data/
│   │   ├── database.sqlite    # Main database
│   │   └── uploads/           # Game images
│   ├── server.js             # Main server
│   └── sunmi-printer.js      # Printer integration
├── frontend/
│   ├── src/                  # React components
│   └── dist/                 # Built files
└── package.json              # Dependencies
```

## Support
For deployment issues, check:
1. Environment variables are set correctly
2. Database file is included
3. All dependencies are installed
4. Port configuration is correct (5000 for backend)
