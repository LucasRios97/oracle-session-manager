const oracledb = require('oracledb');
require('dotenv').config();

// Configurar el Oracle Instant Client
oracledb.initOracleClient({ libDir: 'C:\\instantclient_19_28' });

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
    poolMin: parseInt(process.env.POOL_MIN) || 2,
    poolMax: parseInt(process.env.POOL_MAX) || 10,
    poolIncrement: parseInt(process.env.POOL_INCREMENT) || 2,
    poolTimeout: 60,               // Timeout de conexión inactiva (segundos)
    queueTimeout: 60000,           // Timeout de espera en cola (milisegundos)
    enableStatistics: true         // Habilitar estadísticas del pool
};

let pool;

// Crear el pool de conexiones
async function createPool() {
    try {
        pool = await oracledb.createPool(dbConfig);
        console.log('✓ Pool de conexiones creado exitosamente');
        console.log(`  - Conexiones mínimas: ${dbConfig.poolMin}`);
        console.log(`  - Conexiones máximas: ${dbConfig.poolMax}`);
        return pool;
    } catch (err) {
        console.error('Error al crear el pool de conexiones:', err);
        throw err;
    }
}

// Obtener una conexión del pool
async function getConnection() {
    try {
        if (!pool) {
            await createPool();
        }
        const connection = await pool.getConnection();
        return connection;
    } catch (err) {
        console.error('Error al obtener conexión del pool:', err);
        throw err;
    }
}

// Cerrar una conexión (la devuelve al pool)
async function closeConnection(connection) {
    try {
        if (connection) {
            await connection.close();
        }
    } catch (err) {
        console.error('Error al cerrar la conexión:', err);
    }
}

// Cerrar el pool completamente (para shutdown de la aplicación)
async function closePool() {
    try {
        if (pool) {
            await pool.close(10); // Espera 10 segundos antes de forzar cierre
            console.log('✓ Pool de conexiones cerrado');
        }
    } catch (err) {
        console.error('Error al cerrar el pool:', err);
    }
}

// Obtener estadísticas del pool
function getPoolStatistics() {
    if (pool) {
        return {
            connectionsInUse: pool.connectionsInUse,
            connectionsOpen: pool.connectionsOpen,
            poolMin: pool.poolMin,
            poolMax: pool.poolMax,
            poolIncrement: pool.poolIncrement,
            poolTimeout: pool.poolTimeout,
            queueMax: pool.queueMax,
            queueTimeout: pool.queueTimeout
        };
    }
    return null;
}

module.exports = {
    createPool,
    getConnection,
    closeConnection,
    closePool,
    getPoolStatistics
};
