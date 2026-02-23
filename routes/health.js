const express = require('express');
const router = express.Router();

// Health check / Keep-alive endpoint
// This endpoint should be pinged every 3 minutes to keep the server active
router.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running',
  };
  
  console.log(`[Health Check] Server pinged at ${healthData.timestamp}`);
  res.status(200).json(healthData);
});

// Simple ping endpoint (minimal response)
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

module.exports = router;