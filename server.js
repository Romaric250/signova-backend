const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const https = require('https');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database connection
mongoose.connect('mongodb://localhost:27017/myapp', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Health/Keep-alive routes (no auth required)
app.use('/api/health', healthRoutes);

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Post routes
app.use('/api/posts', postRoutes);

// Comment routes
app.use('/api/comments', commentRoutes);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Self-ping every 3 minutes to keep the server alive
  const PING_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds (use 30 * 1000 for testing)
  const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
  
  // Function to ping the server
  const pingServer = () => {
    console.log(`[Keep-Alive] Pinging ${SERVER_URL}/api/health/ping...`);
    const protocol = SERVER_URL.startsWith('https') ? https : http;
    
    protocol.get(`${SERVER_URL}/api/health/ping`, (res) => {
      console.log(`[Keep-Alive] Server pinged at ${new Date().toISOString()} - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.log(`[Keep-Alive] Ping failed: ${err.message}`);
    });
  };
  
  // Initial ping after 10 seconds (to confirm it works)
  setTimeout(() => {
    console.log(`[Keep-Alive] Initial ping test...`);
    pingServer();
  }, 10000);
  
  // Then ping every 3 minutes
  setInterval(pingServer, PING_INTERVAL);
  
  console.log(`[Keep-Alive] Self-ping enabled every 3 minutes`);
});