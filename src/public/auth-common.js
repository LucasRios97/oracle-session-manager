// Archivo común para manejo de autenticación en el frontend

// Verificar si el usuario está autenticado
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (!data.authenticated) {
            // No está autenticado, redirigir a login
            window.location.href = '/login.html';
            return false;
        }
        
        return data.user;
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Cerrar sesión
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Redirigir a login
            window.location.href = '/login.html';
        } else {
            console.error('Error al cerrar sesión:', data.error);
            alert('Error al cerrar sesión');
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

// Mostrar información del usuario en el header
function displayUserInfo(user) {
    // Buscar un elemento para mostrar el usuario
    const userDisplayElements = document.querySelectorAll('.user-display, #userDisplay');
    
    if (userDisplayElements.length > 0) {
        userDisplayElements.forEach(el => {
            el.textContent = `👤 ${user.username}`;
            el.style.cursor = 'pointer';
            el.title = 'Click para cerrar sesión';
            el.onclick = () => {
                if (confirm('¿Deseas cerrar sesión?')) {
                    logout();
                }
            };
        });
    }
}

// Inicializar autenticación en cada página
async function initAuth() {
    const user = await checkAuth();
    if (user) {
        displayUserInfo(user);
    }
    return user;
}
