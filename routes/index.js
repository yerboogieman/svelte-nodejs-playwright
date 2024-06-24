const express = require('express');
const router = express.Router();

// Import route modules
const usersRoutes = require('./users');

// Use route modules
router.use('/friends', usersRoutes);

module.exports = router;