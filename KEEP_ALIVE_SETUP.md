# Keep Render Instance Active (Prevent Hibernation)

On Render's free tier, instances **spin down after ~15 minutes of inactivity**. When spun down, the entire Node process stops—including any internal cron jobs. So node-cron **cannot** prevent hibernation because it runs inside the same process.

## Solution: External Health Ping

Use an **external service** to ping your health endpoint every 5–10 minutes. That request wakes the instance and keeps it active.

### Option 1: UptimeRobot (Free, Recommended)

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account
2. Click **Add New Monitor**
3. Set:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: SignNova API Keep-Alive
   - **URL**: `https://apiv1.signconnect.org/api/health`
   - **Monitoring Interval**: 5 minutes
4. Save

### Option 2: cron-job.org (Free)

1. Go to [cron-job.org](https://cron-job.org) and create a free account
2. Create a new cron job
3. Set:
   - **URL**: `https://apiv1.signconnect.org/api/health`
   - **Schedule**: Every 5 or 10 minutes
4. Save

### Health Endpoint

Your health route: `GET /api/health`

- Full URL: `https://apiv1.signconnect.org/api/health`
- Returns: `{ "status": "ok", "timestamp": "..." }`
