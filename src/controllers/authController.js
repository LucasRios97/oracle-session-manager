const { createUserPool, closeUserPool, getConnectionFromUser } = require('../config/database');

// Login - Autenticar usuario con Oracle
async function login(req, res) {
    try {
        const { username, password, connectString } = req.body;
        
        console.log('=== Intento de login ===');
        console.log('Usuario:', username);
        console.log('Cadena de conexión:', connectString);
        
        if (!username || !password || !connectString) {
            return res.status(400).json({
                success: false,
                error: 'Se requieren usuario, contraseña y cadena de conexión'
            });
        }
        
        // Intentar crear un pool de conexiones para este usuario
        try {
            await createUserPool(username, password, connectString);
            console.log('✓ Pool de conexiones creado para usuario:', username);
            
            // Probar la conexión
            const connection = await getConnectionFromUser(username);
            console.log('✓ Conexión de prueba exitosa');
            
            // Obtener información del usuario
            const userInfoQuery = `
                SELECT 
                    username,
                    account_status,
                    created,
                    profile
                FROM dba_users
                WHERE username = :username
            `;
            
            let userInfo = null;
            try {
                const result = await connection.execute(userInfoQuery, [username]);
                if (result.rows.length > 0) {
                    userInfo = {
                        username: result.rows[0][0],
                        accountStatus: result.rows[0][1],
                        created: result.rows[0][2],
                        profile: result.rows[0][3]
                    };
                }
            } catch (err) {
                // Si no tiene permisos para ver dba_users, usar user_users
                console.log('No tiene acceso a dba_users, usando información básica');
                userInfo = {
                    username: username,
                    accountStatus: 'OPEN',
                    created: new Date(),
                    profile: 'DEFAULT'
                };
            }
            
            await connection.close();
            
            // Guardar información en la sesión
            req.session.user = {
                username: username,
                connectString: connectString,
                loginTime: new Date(),
                userInfo: userInfo
            };
            
            console.log('✓ Sesión creada para:', username);
            console.log('=== Login exitoso ===\n');
            
            res.json({
                success: true,
                message: 'Autenticación exitosa',
                user: {
                    username: username,
                    ...userInfo
                }
            });
            
        } catch (dbError) {
            console.error('❌ Error de autenticación Oracle:', dbError.message);
            console.log('=== Login fallido ===\n');
            
            // Cerrar pool si se creó
            await closeUserPool(username);
            
            // Mensajes de error más amigables
            let errorMessage = 'Error de autenticación';
            
            if (dbError.message.includes('ORA-01017')) {
                errorMessage = 'Usuario o contraseña incorrectos';
            } else if (dbError.message.includes('ORA-12541') || dbError.message.includes('ORA-12170')) {
                errorMessage = 'No se puede conectar al servidor Oracle. Verifica la cadena de conexión';
            } else if (dbError.message.includes('ORA-28000')) {
                errorMessage = 'La cuenta está bloqueada';
            } else if (dbError.message.includes('ORA-28001')) {
                errorMessage = 'La contraseña ha expirado';
            } else {
                errorMessage = `Error de conexión: ${dbError.message}`;
            }
            
            res.status(401).json({
                success: false,
                error: errorMessage
            });
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}

// Logout - Cerrar sesión
async function logout(req, res) {
    try {
        const username = req.session.user?.username;
        
        console.log('=== Logout ===');
        console.log('Usuario:', username);
        
        if (username) {
            // Cerrar el pool de conexiones del usuario
            await closeUserPool(username);
            console.log('✓ Pool de conexiones cerrado para:', username);
        }
        
        // Destruir la sesión
        req.session.destroy((err) => {
            if (err) {
                console.error('Error al destruir sesión:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Error al cerrar sesión'
                });
            }
            
            console.log('✓ Sesión destruida');
            console.log('=== Logout exitoso ===\n');
            
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        });
        
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cerrar sesión'
        });
    }
}

// Verificar si hay sesión activa
function checkSession(req, res) {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: {
                username: req.session.user.username,
                loginTime: req.session.user.loginTime,
                userInfo: req.session.user.userInfo
            }
        });
    } else {
        res.json({
            authenticated: false
        });
    }
}

// Obtener información del usuario actual
function getCurrentUser(req, res) {
    if (req.session.user) {
        res.json({
            success: true,
            user: {
                username: req.session.user.username,
                loginTime: req.session.user.loginTime,
                userInfo: req.session.user.userInfo
            }
        });
    } else {
        res.status(401).json({
            success: false,
            error: 'No hay sesión activa'
        });
    }
}

module.exports = {
    login,
    logout,
    checkSession,
    getCurrentUser
};
