const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Rutas para las sesiones
router.get('/sessions', sessionController.getActiveSessions);
router.get('/sessions/by-user', sessionController.getSessionsByUser);
router.get('/sessions/user/:username', sessionController.getUserSessions);
router.post('/sessions/disconnect', sessionController.disconnectSession);
router.post('/sessions/disconnect-all', sessionController.disconnectAllUserSessions);
router.get('/statistics', sessionController.getStatistics);

module.exports = router;
