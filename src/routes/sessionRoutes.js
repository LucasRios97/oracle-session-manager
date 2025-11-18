const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Rutas para las sesiones
router.get('/sessions', sessionController.getActiveSessions);
router.get('/sessions/by-user', sessionController.getSessionsByUser);
router.get('/sessions/user/:username', sessionController.getUserSessions);
router.get('/sessions/blocking', sessionController.getBlockingSessions);
router.post('/sessions/disconnect', sessionController.disconnectSession);
router.post('/sessions/disconnect-all', sessionController.disconnectAllUserSessions);
router.post('/sessions/change-password', sessionController.changeUserPassword);
router.post('/sessions/unlock-account', sessionController.unlockUserAccount);
router.get('/statistics', sessionController.getStatistics);

module.exports = router;
