const express = require('express');
const path = require('path');
require('dotenv').config();

const { createPool, closePool, getPoolStatistics } = require('./config/database');
const sessionRoutes = require('./routes/sessionRoutes');
const monitorRoutes = require('./routes/monitorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api', sessionRoutes);
app.use('/api/monitor', monitorRoutes);

// Ruta para obtener estadísticas del pool de conexiones
app.get('/api/pool-stats', (req, res) => {
    const stats = getPoolStatistics();
    res.json({
        success: true,
        statistics: stats
    });
});

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Función para iniciar el servidor
async function startServer() {
    try {
        // Crear el pool de conexiones antes de iniciar el servidor
        await createPool();
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`╔════════════════════════════════════════════════════════╗`);
            console.log(`║  Oracle Session Manager                                ║`);
            console.log(`╠════════════════════════════════════════════════════════╣`);
            console.log(`║  Servidor corriendo en: http://localhost:${PORT}       ║`);
            console.log(`║  Base de datos: ${process.env.DB_CONNECTION_STRING}    ║`);
            console.log(`║  Usuario: ${process.env.DB_USER}                       ║`);
            console.log(`╚════════════════════════════════════════════════════════╝`);
        });
    } catch (err) {
        console.error('Error al iniciar el servidor:', err);
        process.exit(1);
    }
}

// Manejo de señales para cerrar el pool correctamente
process.on('SIGINT', async () => {
    console.log('\n⚠️  Cerrando servidor...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Cerrando servidor...');
    await closePool();
    process.exit(0);
});

// Iniciar el servidor
startServer();
