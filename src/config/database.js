const oracledb = require('oracledb');
require('dotenv').config();

// Configurar el Oracle Instant Client
oracledb.initOracleClient({ libDir: '/opt/instanclient/instantclient_12_2' });

// Almacenamiento de pools por usuario
const userPools = new Map();

// Configuración base del pool
const basePoolConfig = {
    poolMin: parseInt(process.env.POOL_MIN) || 2,
    poolMax: parseInt(process.env.POOL_MAX) || 10,
    poolIncrement: parseInt(process.env.POOL_INCREMENT) || 2,
    poolTimeout: 60,               // Timeout de conexión inactiva (segundos)
    queueTimeout: 60000,           // Timeout de espera en cola (milisegundos)
    enableStatistics: true         // Habilitar estadísticas del pool
};

// Pool principal (legacy - para compatibilidad)
let pool;

// Crear el pool de conexiones (legacy)
async function createPool() {
    try {
        const dbConfig = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectString: process.env.DB_CONNECTION_STRING,
            ...basePoolConfig
        };
        
        pool = await oracledb.createPool(dbConfig);
        console.log('✓ Pool de conexiones creado exitosamente');
        console.log(`  - Conexiones mínimas: ${basePoolConfig.poolMin}`);
        console.log(`  - Conexiones máximas: ${basePoolConfig.poolMax}`);
        return pool;
    } catch (err) {
        console.error('Error al crear el pool de conexiones:', err);
        throw err;
    }
}

// Crear pool de conexiones para un usuario específico
async function createUserPool(username, password, connectString) {
    try {
        // Si ya existe un pool para este usuario, cerrarlo primero
        if (userPools.has(username)) {
            await closeUserPool(username);
        }
        
        const userPoolConfig = {
            user: username,
            password: password,
            connectString: connectString,
            ...basePoolConfig
        };
        
        const userPool = await oracledb.createPool(userPoolConfig);
        userPools.set(username, userPool);
        
        console.log(`✓ Pool de conexiones creado para usuario: ${username}`);
        console.log(`  - Conexiones mínimas: ${basePoolConfig.poolMin}`);
        console.log(`  - Conexiones máximas: ${basePoolConfig.poolMax}`);
        
        return userPool;
    } catch (err) {
        console.error(`Error al crear pool para usuario ${username}:`, err);
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

// Obtener conexión del pool de un usuario específico
async function getConnectionFromUser(username) {
    try {
        const userPool = userPools.get(username);
        
        if (!userPool) {
            throw new Error(`No existe pool de conexiones para el usuario: ${username}`);
        }
        
        const connection = await userPool.getConnection();
        return connection;
    } catch (err) {
        console.error(`Error al obtener conexión para usuario ${username}:`, err);
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

// Cerrar pool de un usuario específico
async function closeUserPool(username) {
    try {
        const userPool = userPools.get(username);
        
        if (userPool) {
            await userPool.close(10);
            userPools.delete(username);
            console.log(`✓ Pool de conexiones cerrado para usuario: ${username}`);
        }
    } catch (err) {
        console.error(`Error al cerrar pool para usuario ${username}:`, err);
    }
}

// Cerrar todos los pools de usuarios
async function closeAllUserPools() {
    try {
        const closePromises = Array.from(userPools.keys()).map(username => closeUserPool(username));
        await Promise.all(closePromises);
        console.log('✓ Todos los pools de usuarios cerrados');
    } catch (err) {
        console.error('Error al cerrar pools de usuarios:', err);
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

// Obtener estadísticas de todos los pools de usuarios
function getAllUserPoolsStatistics() {
    const stats = [];
    
    for (const [username, userPool] of userPools.entries()) {
        stats.push({
            username: username,
            connectionsInUse: userPool.connectionsInUse,
            connectionsOpen: userPool.connectionsOpen,
            poolMin: userPool.poolMin,
            poolMax: userPool.poolMax
        });
    }
    
    return stats;
}

module.exports = {
    createPool,
    createUserPool,
    getConnection,
    getConnectionFromUser,
    closeConnection,
    closePool,
    closeUserPool,
    closeAllUserPools,
    getPoolStatistics,
    getAllUserPoolsStatistics
};
