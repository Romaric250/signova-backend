# SignNova Backend - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

1. **MongoDB Atlas Account** - [Create free cluster](https://www.mongodb.com/cloud/atlas)
2. **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys)
3. **UploadThing Account** - [Sign up](https://uploadthing.com/)
4. **Hosting Platform** account (Railway, Render, Heroku, or your own server)

## 🔧 Environment Variables

Set these environment variables in your hosting platform:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/signova
BETTER_AUTH_SECRET=<generate-secure-secret>
BETTER_AUTH_URL=https://your-api-domain.com
OPENAI_API_KEY=sk-<your-openai-key>
UPLOADTHING_SECRET=sk_live_<your-secret>
UPLOADTHING_APP_ID=<your-app-id>
FRONTEND_URL=https://your-frontend-domain.com
```

### Generate BETTER_AUTH_SECRET

```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

1. **Connect GitHub repo**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `signova-backend` folder

2. **Add environment variables**
   - Go to project settings → Variables
   - Add all required environment variables

3. **Deploy**
   - Railway auto-deploys on push to main branch
   - Custom domain available in settings

```bash
# Or use Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### Option 2: Render

1. **Create new Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repo

2. **Configure settings**
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Start Command: `npm run start`
   - Environment: `Node`

3. **Add environment variables**
   - Go to "Environment" tab
   - Add all required variables

### Option 3: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create signova-backend-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=<your_mongodb_url>
heroku config:set BETTER_AUTH_SECRET=<your_secret>
heroku config:set OPENAI_API_KEY=<your_key>
heroku config:set UPLOADTHING_SECRET=<your_secret>
heroku config:set UPLOADTHING_APP_ID=<your_app_id>
heroku config:set FRONTEND_URL=<your_frontend_url>

# Deploy
git push heroku main
```

### Option 4: VPS (DigitalOcean, AWS EC2, etc.)

```bash
# SSH into server
ssh user@your-server-ip

# Clone repo
git clone https://github.com/your-username/signova-backend.git
cd signova-backend

# Install Node.js (if not installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies and build
npm ci
npm run build

# Set up PM2 for process management
npm install -g pm2
pm2 start dist/server.js --name signova-backend
pm2 save
pm2 startup

# Set up Nginx reverse proxy (optional but recommended)
sudo apt install nginx
# Configure /etc/nginx/sites-available/signova
```

## 📊 MongoDB Atlas Setup

1. **Create cluster**
   - Go to MongoDB Atlas → Create New Cluster
   - Choose free tier (M0)

2. **Create database user**
   - Database Access → Add New Database User
   - Note username and password

3. **Network access**
   - Network Access → Add IP Address
   - Add `0.0.0.0/0` for all IPs (or your server IP)

4. **Get connection string**
   - Clusters → Connect → Drivers
   - Copy connection string and replace `<password>`

## 🔒 Security Checklist

- [ ] Set strong `BETTER_AUTH_SECRET` (32+ characters)
- [ ] Use production MongoDB user with limited permissions
- [ ] Enable MongoDB Atlas IP whitelist in production
- [ ] Set correct `FRONTEND_URL` for CORS
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Don't commit `.env` file to git

## 🧪 Testing Deployment

After deploying, test these endpoints:

```bash
# Health check
curl https://your-api-domain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## 🐛 Troubleshooting

### Build fails
```bash
# Check Node version (should be 18+)
node -v

# Clear cache and rebuild
npm ci
npm run build
```

### Database connection fails
- Check `DATABASE_URL` format
- Verify MongoDB Atlas IP whitelist
- Check database user credentials

### CORS errors
- Verify `FRONTEND_URL` is set correctly
- Include protocol (https://)
- No trailing slash

### Prisma errors
```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

## 📝 Logs

### Railway
```bash
railway logs
```

### Render
- View in Render Dashboard → Service → Logs

### PM2
```bash
pm2 logs signova-backend
```

## 🔄 Updates

To deploy updates:

1. Push changes to GitHub
2. Most platforms auto-deploy on push
3. Or manually trigger deploy in dashboard

---

## Quick Reference

| Platform | Build Command | Start Command |
|----------|--------------|---------------|
| Railway | `npm ci && npx prisma generate && npm run build` | `npm run start` |
| Render | `npm ci && npx prisma generate && npm run build` | `npm run start` |
| Heroku | Auto-detected | `npm run start` |

