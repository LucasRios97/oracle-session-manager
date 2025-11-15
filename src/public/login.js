// Cargar tema guardado
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    
    // Verificar si ya hay sesión activa
    checkExistingSession();
});

// Sistema de Temas
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Verificar si ya existe una sesión activa
async function checkExistingSession() {
    try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();
        
        if (data.authenticated) {
            // Ya hay sesión activa, redirigir al dashboard
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.log('No hay sesión activa');
    }
}

// Manejo del formulario de login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim().toUpperCase();
    const password = document.getElementById('password').value;
    
    // Validaciones básicas
    if (!username || !password) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    // Deshabilitar el formulario y mostrar loading
    setLoadingState(true);
    hideError();
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Login exitoso
            showSuccess('¡Conexión exitosa! Redirigiendo...');
            
            // Esperar un momento y redirigir
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            // Error en el login
            showError(data.error || 'Error al iniciar sesión');
            setLoadingState(false);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error de conexión con el servidor');
        setLoadingState(false);
    }
});

// Mostrar estado de carga
function setLoadingState(isLoading) {
    const button = document.getElementById('loginButton');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    const inputs = document.querySelectorAll('input');
    
    button.disabled = isLoading;
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        inputs.forEach(input => input.disabled = true);
    } else {
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        inputs.forEach(input => input.disabled = false);
    }
}

// Mostrar mensaje de error
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Ocultar mensaje de error
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
    errorDiv.style.borderColor = 'var(--success-color)';
    errorDiv.style.color = 'var(--success-color)';
    errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
}
