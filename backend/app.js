const express = require('express');
const path = require('path');

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const taskRoutes = require('./routes/taskRoutes');
const model = require('./models/taskModel');

const app = express();
app.use(express.json());

// Request logging middleware
app.use(logger);

// API routes
app.use('/api/tasks', taskRoutes);

// Serve frontend static (frontend located in ../frontend/public)
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Expose reset helper for tests
app.resetTasks = function () {
    if (model.reset) model.reset();
};

// Global error handler (final middleware)
app.use(errorHandler);

module.exports = app;
