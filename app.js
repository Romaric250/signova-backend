const express = require('express');
const app = express();
const healthRoutes = require('./routes/health');

// Middleware
app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);

// ...existing routes

module.exports = app;