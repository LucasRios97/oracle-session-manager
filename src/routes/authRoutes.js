const express = require('express');
const router = express.Router();
const { login, logout, checkSession, getCurrentUser } = require('../controllers/authController');

// Ruta de login
router.post('/login', login);

// Ruta de logout
router.post('/logout', logout);

// Verificar sesión
router.get('/check', checkSession);

// Obtener usuario actual
router.get('/user', getCurrentUser);

module.exports = router;
