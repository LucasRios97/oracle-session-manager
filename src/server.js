const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const { closeAllUserPools, getAllUserPoolsStatistics } = require('./config/database');
const sessionRoutes = require('./routes/sessionRoutes');
const monitorRoutes = require('./routes/monitorRoutes');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, attachUser } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de sesiones HTTP
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'oracle-session-manager-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Cambiar a true si usas HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
});

app.use(sessionMiddleware);

// Cerrar pool cuando la sesión se destruye
app.use(async (req, res, next) => {
    if (req.session && req.session.user) {
        const originalDestroy = req.session.destroy.bind(req.session);
        req.session.destroy = function(callback) {
            const username = req.session.user?.username;
            return originalDestroy(async (err) => {
                if (username) {
                    const { closeUserPool } = require('./config/database');
                    await closeUserPool(username);
                }
                if (callback) callback(err);
            });
        };
    }
    next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(attachUser); // Agregar información del usuario a todas las requests

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Rutas públicas (sin autenticación)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
app.use('/api/sessions', requireAuth, sessionRoutes);
app.use('/api/monitor', requireAuth, monitorRoutes);
app.use('/api', requireAuth, sessionRoutes); // Para compatibilidad con rutas antiguas

// Ruta para obtener estadísticas de pools
app.get('/api/pool-stats', requireAuth, (req, res) => {
    const stats = getAllUserPoolsStatistics();
    res.json({
        success: true,
        statistics: stats
    });
});

// Ruta principal - redirigir a login si no está autenticado
app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Función para iniciar el servidor
async function startServer() {
    try {
        // Nota: No creamos pool inicial, se crean por usuario al hacer login
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log(`╔════════════════════════════════════════════════════════╗`);
            console.log(`║  Oracle Session Manager                                ║`);
            console.log(`╠════════════════════════════════════════════════════════╣`);
            console.log(`║  Servidor corriendo en: http://localhost:${PORT}       ║`);
            console.log(`║  Modo: Autenticación por usuario                       ║`);
            console.log(`║  Accede a: http://localhost:${PORT}/login.html        ║`);
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
    await closeAllUserPools();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Cerrando servidor...');
    await closeAllUserPools();
    process.exit(0);
});

// Iniciar el servidor
startServer();
