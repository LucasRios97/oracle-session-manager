const express = require('express');
const router = express.Router();
const { getServerMetrics, getUserMetrics } = require('../controllers/monitorController');

// Ruta para obtener métricas del servidor
router.get('/metrics', getServerMetrics);

// Ruta para obtener métricas por usuario
router.get('/users', getUserMetrics);

module.exports = router;
