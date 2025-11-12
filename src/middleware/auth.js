// Middleware para verificar autenticación
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        // Usuario autenticado, continuar
        next();
    } else {
        // No autenticado, retornar error 401
        res.status(401).json({
            success: false,
            error: 'No autorizado. Por favor, inicia sesión',
            redirect: '/login.html'
        });
    }
}

// Middleware para agregar información del usuario a todas las requests
function attachUser(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    }
    next();
}

module.exports = {
    requireAuth,
    attachUser
};
