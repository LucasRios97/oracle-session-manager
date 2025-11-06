const express = require('express');
const router = express.Router();
const { getServerMetrics } = require('../controllers/monitorController');

// Ruta para obtener métricas del servidor
router.get('/metrics', getServerMetrics);

module.exports = router;
