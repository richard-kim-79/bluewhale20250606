const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const contentRoutes = require('./routes/content.routes');
const notificationRoutes = require('./routes/notification.routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001; // 환경 변수 PORT 사용, 기본값 3001
console.log(`Starting server on port ${PORT}...`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/content', contentRoutes);
app.use('/notifications', notificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Blue Whale Protocol API' });
});

// Connect to MongoDB
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = { app, server };
