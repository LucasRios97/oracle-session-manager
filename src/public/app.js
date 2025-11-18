// Variables globales
let allSessions = [];
let allUsers = [];
let selectedSession = null;
let currentPage = 1;
const recordsPerPage = 10;
let filteredSessions = [];

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    // Ir al inicio de la página al cargar/refrescar
    window.scrollTo(0, 0);
    
    loadTheme(); // Cargar tema guardado
    loadData();
    // Auto-refresh cada 15 segundos (comentado para actualización manual)
    // setInterval(loadData, 15000);
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
    
    //Se comentó el toast para evitar distracciones
    //showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Cargar todos los datos
async function loadData() {
    await Promise.all([
        loadStatistics(),
        loadUsersSummary(),
        loadActiveSessions()
    ]);
    updateLastUpdateTime();
}

// Refrescar datos manualmente
function refreshData() {
    showToast('Actualizando datos...', 'info');
    loadData();
}

// Refrescar solo sesiones activas
function refreshActiveSessions() {
    showToast('Actualizando sesiones activas...', 'info');
    loadActiveSessions();
    updateLastUpdateTime();
}

// Actualizar hora de última actualización
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-PY', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Cargar estadísticas
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalSessions').textContent = data.statistics.total_sessions;
            document.getElementById('activeSessions').textContent = data.statistics.active_sessions;
            document.getElementById('inactiveSessions').textContent = data.statistics.inactive_sessions;
            document.getElementById('uniqueUsers').textContent = data.statistics.unique_users;
            document.getElementById('blockedSessions').textContent = data.statistics.blocked_sessions;
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        showToast('Error al cargar estadísticas', 'error');
    }
}

// Cargar resumen por usuario
async function loadUsersSummary() {
    try {
        const response = await fetch('/api/sessions/by-user');
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            renderUsersSummary(data.users);
            populateUserFilter(data.users);
        }
    } catch (error) {
        console.error('Error al cargar resumen de usuarios:', error);
        showToast('Error al cargar resumen de usuarios', 'error');
    }
}

// Renderizar tabla de resumen por usuario
function renderUsersSummary(users) {
    const tbody = document.getElementById('userSummaryTable');
    
    // Filtrar solo usuarios con 10 o más sesiones 
    const filteredUsers = users.filter(user => user.session_count >= 10);
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="loading">No hay usuarios con 10 o más sesiones activas</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td><strong>${escapeHtml(user.username)}</strong></td>
            <td><span class="status-badge status-active">${user.session_count}</span></td>
            <td>${formatDate(user.first_logon)}</td>
            <td>${formatSeconds(user.max_last_call_et)}</td>
            <td>
                <button class="btn btn-info btn-small" onclick="filterByUser('${escapeHtml(user.username)}')">
                    👁️ Ver Sesiones
                </button>
                <button class="btn btn-warning btn-small" onclick="openChangePasswordModal('${escapeHtml(user.username)}')">
                    🔑 Cambiar Contraseña
                </button>
                <button class="btn btn-danger btn-small" onclick="openDisconnectAllModal('${escapeHtml(user.username)}', ${user.session_count})">
                    🔌 Cerrar Todas
                </button>
            </td>
        </tr>
    `).join('');
}

// Poblar el filtro de usuarios
function populateUserFilter(users) {
    const select = document.getElementById('userFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Todos los usuarios</option>' + 
        users.map(user => `<option value="${escapeHtml(user.username)}">${escapeHtml(user.username)}</option>`).join('');
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Cargar sesiones activas
async function loadActiveSessions() {
    try {
        const response = await fetch('/api/sessions');
        const data = await response.json();
        
        if (data.success) {
            allSessions = data.sessions;
            filterSessions();
        }
    } catch (error) {
        console.error('Error al cargar sesiones:', error);
        showToast('Error al cargar sesiones activas', 'error');
    }
}

// Filtrar sesiones
function filterSessions() {
    const userFilter = document.getElementById('userFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    
    filteredSessions = allSessions.filter(session => {
        const matchUser = !userFilter || (session.username && session.username.toLowerCase() === userFilter);
        const matchStatus = !statusFilter || (session.status && session.status.toLowerCase() === statusFilter);
        const matchSearch = !searchFilter || 
            (session.module && session.module.toLowerCase().includes(searchFilter)) ||
            (session.program && session.program.toLowerCase().includes(searchFilter)) ||
            (session.machine && session.machine.toLowerCase().includes(searchFilter)) ||
            (session.osuser && session.osuser.toLowerCase().includes(searchFilter));
        
        return matchUser && matchStatus && matchSearch;
    });
    
    // Resetear a la primera página cuando se aplican filtros
    currentPage = 1;
    renderSessions();
}

// Renderizar tabla de sesiones con paginación
function renderSessions() {
    const tbody = document.getElementById('sessionsTable');
    const countElement = document.getElementById('activeSessionCount');
    const activeCountElement = document.getElementById('activeCount');
    const inactiveCountElement = document.getElementById('inactiveCount');
    const paginationControls = document.getElementById('paginationControls');
    
    // Contar sesiones activas e inactivas
    const activeCount = filteredSessions.filter(s => s.status === 'ACTIVE').length;
    const inactiveCount = filteredSessions.filter(s => s.status === 'INACTIVE').length;
    
    countElement.textContent = filteredSessions.length;
    activeCountElement.textContent = activeCount;
    inactiveCountElement.textContent = inactiveCount;
    
    if (filteredSessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay sesiones que coincidan con los filtros</td></tr>';
        paginationControls.style.display = 'none';
        return;
    }
    
    // Calcular paginación
    const totalPages = Math.ceil(filteredSessions.length / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, filteredSessions.length);
    const currentSessions = filteredSessions.slice(startIndex, endIndex);
    
    // Renderizar sesiones de la página actual
    tbody.innerHTML = currentSessions.map((session, index) => {
        const globalIndex = startIndex + index; // Índice global para acceder a filteredSessions
        return `
        <tr>
            <td><strong>${escapeHtml(session.username || '-')}</strong></td>
            <td>${escapeHtml(session.osuser || '-')}</td>
            <td><span class="status-badge ${session.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">${session.status}</span></td>
            <td>${escapeHtml(session.machine || '-')}</td>
            <td>${session.module ? `<span class="module-badge">${escapeHtml(session.module)}</span>` : '-'}</td>
            <td><strong>${session.formatted_last_call_et || formatSeconds(session.last_call_et)}</strong></td>
            <td>
                ${session.sql_text ? 
                    `<button class="btn btn-info btn-small" data-session-index="${globalIndex}" data-action="show-sql" title="Ver SQL completo">
                        📝 Ver SQL
                    </button>` 
                    : '-'}
            </td>
            <td>
                <button class="btn btn-danger btn-small" data-session-index="${globalIndex}" data-action="disconnect">
                    🔌 Desconectar
                </button>
            </td>
        </tr>
    `;
    }).join('');
    
    // Agregar event listeners después de renderizar
    addSessionEventListeners();
    
    // Actualizar controles de paginación
    updatePaginationControls(totalPages, startIndex, endIndex);
}

// Actualizar controles de paginación
function updatePaginationControls(totalPages, startIndex, endIndex) {
    const paginationControls = document.getElementById('paginationControls');
    const currentPageElement = document.getElementById('currentPage');
    const totalPagesElement = document.getElementById('totalPages');
    const pageRangeElement = document.getElementById('pageRange');
    const totalRecordsElement = document.getElementById('totalRecords');
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    
    // Mostrar/ocultar controles según la cantidad de registros
    if (filteredSessions.length > recordsPerPage) {
        paginationControls.style.display = 'flex';
        
        currentPageElement.textContent = currentPage;
        totalPagesElement.textContent = totalPages;
        pageRangeElement.textContent = `${startIndex + 1}-${endIndex}`;
        totalRecordsElement.textContent = filteredSessions.length;
        
        // Habilitar/deshabilitar botones según la página actual
        firstPageBtn.disabled = currentPage === 1;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
        lastPageBtn.disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
}

// Funciones de navegación de páginas
function nextPage() {
    const totalPages = Math.ceil(filteredSessions.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderSessions();
        scrollToSessionsTable();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderSessions();
        scrollToSessionsTable();
    }
}

function goToFirstPage() {
    currentPage = 1;
    renderSessions();
    scrollToSessionsTable();
}

function goToLastPage() {
    const totalPages = Math.ceil(filteredSessions.length / recordsPerPage);
    currentPage = totalPages;
    renderSessions();
    scrollToSessionsTable();
}

// Scroll suave a la tabla de sesiones
function scrollToSessionsTable() {
    const table = document.querySelector('.section:last-of-type');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Agregar event listeners a los botones de las sesiones
function addSessionEventListeners() {
    // Event listeners para botones de desconexión
    document.querySelectorAll('[data-action="disconnect"]').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-session-index'));
            const session = filteredSessions[index];
            if (session) {
                showDisconnectModal(session);
            }
        });
    });
    
    // Event listeners para mostrar SQL
    document.querySelectorAll('[data-action="show-sql"]').forEach(element => {
        element.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-session-index'));
            const session = filteredSessions[index];
            if (session) {
                showSqlModal(session);
            }
        });
    });
}

// Filtrar por usuario específico
function filterByUser(username) {
    document.getElementById('userFilter').value = username;
    filterSessions();
    
    // Scroll a la sección de sesiones activas
    document.querySelector('.section:last-of-type').scrollIntoView({ behavior: 'smooth' });
}

// Mostrar modal de desconexión
function showDisconnectModal(session) {
    selectedSession = session;
    
    const details = `
        <p><strong>SID:</strong> ${session.sid} &nbsp;&nbsp;&nbsp; <strong>Serial#:</strong> ${session.serial}</p>
        <p><strong>Usuario:</strong> ${escapeHtml(session.username)}</p>
        <p><strong>Máquina:</strong> ${escapeHtml(session.machine || '-')}</p>
        <p><strong>Módulo:</strong> ${escapeHtml(session.module || '-')}</p>
        <p><strong>Estado:</strong> ${session.status}</p>
    `;
    
    document.getElementById('sessionDetails').innerHTML = details;
    document.getElementById('disconnectModal').style.display = 'block';
}

// Cerrar modal de desconexión
function closeModal() {
    document.getElementById('disconnectModal').style.display = 'none';
    selectedSession = null;
}

// Confirmar desconexión
async function confirmDisconnect() {
    if (!selectedSession) return;
    
    try {
        const response = await fetch('/api/sessions/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sid: selectedSession.sid,
                serial: selectedSession.serial
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Sesión desconectada exitosamente', 'success');
            closeModal();
            // Recargar datos después de 1 segundo
            setTimeout(loadData, 1000);
        } else {
            showToast('❌ Error al desconectar sesión: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al desconectar sesión:', error);
        showToast('❌ Error al desconectar sesión', 'error');
    }
}

// Mostrar modal de SQL
function showSqlModal(session) {
    document.getElementById('sqlId').textContent = session.sql_id || '-';
    document.getElementById('sqlUser').textContent = session.username || '-';
    document.getElementById('sqlModule').textContent = session.module || '-';
    document.getElementById('sqlProgram').textContent = session.program || '-';
    document.getElementById('sqlProcess').textContent = session.process || '-';
    document.getElementById('sqlText').textContent = session.sql_fulltext || session.sql_text || 'No hay SQL disponible';
    
    // Almacenar información adicional para referencia
    selectedSession = session;
    
    document.getElementById('sqlModal').style.display = 'block';
}

// Cerrar modal de SQL
function closeSqlModal() {
    document.getElementById('sqlModal').style.display = 'none';
}

// Copiar SQL al portapapeles
function copySql() {
    const sqlText = document.getElementById('sqlText').textContent;
    
    navigator.clipboard.writeText(sqlText).then(() => {
        showToast('📋 SQL copiado al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        showToast('❌ Error al copiar SQL', 'error');
    });
}

// Variables para desconexión masiva
let selectedUsername = null;
let selectedUserSessionCount = 0;

// Mostrar modal de desconexión masiva
function showDisconnectAllModal(username, sessionCount) {
    selectedUsername = username;
    selectedUserSessionCount = sessionCount;
    
    const details = `
        <p><strong>Usuario:</strong> ${escapeHtml(username)}</p>
        <p><strong>Total de Sesiones:</strong> <span class="status-badge status-active">${sessionCount}</span></p>
        <p style="margin-top: 15px; color: #dc2626; font-weight: bold;">
            Se desconectarán ${sessionCount} sesión(es) de este usuario.
        </p>
    `;
    
    document.getElementById('userDetailsAll').innerHTML = details;
    document.getElementById('disconnectAllModal').style.display = 'block';
}

// Cerrar modal de desconexión masiva
function closeDisconnectAllModal() {
    document.getElementById('disconnectAllModal').style.display = 'none';
    selectedUsername = null;
    selectedUserSessionCount = 0;
}

// Confirmar desconexión masiva
async function confirmDisconnectAll() {
    if (!selectedUsername) return;
    
    // Deshabilitar el botón para evitar clicks múltiples
    const confirmButton = event.target;
    confirmButton.disabled = true;
    confirmButton.textContent = '⏳ Desconectando...';
    
    try {
        showToast(`Desconectando ${selectedUserSessionCount} sesiones de ${selectedUsername}...`, 'info');
        
        const response = await fetch('/api/sessions/disconnect-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: selectedUsername
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            const message = `✅ Proceso completado: ${data.disconnected} sesiones desconectadas, ${data.failed} fallidas`;
            showToast(message, data.failed > 0 ? 'warning' : 'success');
            closeDisconnectAllModal();
            
            // Mostrar detalles en consola
            console.log('Resultado de desconexión masiva:', data);
            
            // Recargar datos después de 2 segundos
            setTimeout(loadData, 2000);
        } else {
            showToast('❌ Error al desconectar sesiones: ' + data.error, 'error');
            confirmButton.disabled = false;
            confirmButton.textContent = '🔌 Desconectar Todas las Sesiones';
        }
    } catch (error) {
        console.error('Error al desconectar sesiones:', error);
        showToast('❌ Error al desconectar sesiones', 'error');
        confirmButton.disabled = false;
        confirmButton.textContent = '🔌 Desconectar Todas las Sesiones';
    }
}

// Abrir modal de desconexión masiva (wrapper para uso desde HTML)
function openDisconnectAllModal(username, sessionCount) {
    showDisconnectAllModal(username, sessionCount);
}

// Cerrar modales al hacer click fuera
window.onclick = function(event) {
    const disconnectModal = document.getElementById('disconnectModal');
    const sqlModal = document.getElementById('sqlModal');
    const disconnectAllModal = document.getElementById('disconnectAllModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const quickPasswordModal = document.getElementById('quickPasswordModal');
    
    if (event.target == disconnectModal) {
        closeModal();
    }
    if (event.target == sqlModal) {
        closeSqlModal();
    }
    if (event.target == disconnectAllModal) {
        closeDisconnectAllModal();
    }
    if (event.target == changePasswordModal) {
        closeChangePasswordModal();
    }
    if (event.target == quickPasswordModal) {
        closeQuickPasswordModal();
    }
}

// Cerrar modales con la tecla ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
        closeSqlModal();
        closeDisconnectAllModal();
        closeChangePasswordModal();
        closeQuickPasswordModal();
    }
});

// Variables para cambio de contraseña
let targetUsernameForPassword = null;

// Mostrar modal de cambio de contraseña
function openChangePasswordModal(username) {
    targetUsernameForPassword = username;
    
    const details = `
        <p><strong>Usuario:</strong> ${escapeHtml(username)}</p>
    `;
    
    document.getElementById('changePasswordDetails').innerHTML = details;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordError').style.display = 'none';
    document.getElementById('changePasswordModal').style.display = 'block';
}

// Cerrar modal de cambio de contraseña
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
    targetUsernameForPassword = null;
}

// Confirmar cambio de contraseña
async function confirmChangePassword() {
    if (!targetUsernameForPassword) return;
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
    
    // Validaciones
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = 'Por favor, complete ambos campos';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Deshabilitar botón para evitar clicks múltiples
    const confirmButton = event.target;
    const originalText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = '⏳ Cambiando...';
    
    try {
        showToast(`Cambiando contraseña de ${targetUsernameForPassword}...`, 'info');
        
        const response = await fetch('/api/sessions/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUsername: targetUsernameForPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
            closeChangePasswordModal();
        } else {
            errorDiv.textContent = data.error || 'Error al cambiar contraseña';
            errorDiv.style.display = 'block';
            confirmButton.disabled = false;
            confirmButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        errorDiv.textContent = 'Error al cambiar contraseña';
        errorDiv.style.display = 'block';
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
    }
}

// Mostrar toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Formatear fecha
function formatDate(date) {
    if (!date) return '-';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    return d.toLocaleString('es-PY', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Formatear segundos a HH:MM:SS
function formatSeconds(seconds) {
    if (seconds === null || seconds === undefined) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ========================================
// Modal Rápido de Cambio de Contraseña
// ========================================

// Abrir modal rápido
function openQuickPasswordModal() {
    document.getElementById('quickUsername').value = '';
    document.getElementById('quickNewPassword').value = '';
    document.getElementById('quickConfirmPassword').value = '';
    document.getElementById('quickPasswordError').style.display = 'none';
    document.getElementById('quickPasswordModal').style.display = 'block';
    
    // Enfocar el campo de usuario
    setTimeout(() => {
        document.getElementById('quickUsername').focus();
    }, 100);
}

// Cerrar modal rápido
function closeQuickPasswordModal() {
    document.getElementById('quickPasswordModal').style.display = 'none';
}

// Confirmar cambio de contraseña desde modal rápido
async function confirmQuickPasswordChange() {
    const username = document.getElementById('quickUsername').value.trim().toUpperCase();
    const newPassword = document.getElementById('quickNewPassword').value;
    const confirmPassword = document.getElementById('quickConfirmPassword').value;
    const errorDiv = document.getElementById('quickPasswordError');
    
    // Validaciones
    if (!username) {
        errorDiv.textContent = 'Por favor, ingrese el nombre de usuario';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!newPassword || !confirmPassword) {
        errorDiv.textContent = 'Por favor, complete ambos campos de contraseña';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Las contraseñas no coinciden';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (newPassword.length < 6) {
        errorDiv.textContent = 'La contraseña debe tener al menos 6 caracteres';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Deshabilitar botón para evitar clicks múltiples
    const confirmButton = event.target;
    const originalText = confirmButton.textContent;
    confirmButton.disabled = true;
    confirmButton.textContent = '⏳ Cambiando...';
    
    try {
        showToast(`Cambiando contraseña de ${username}...`, 'info');
        
        const response = await fetch('/api/sessions/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                targetUsername: username,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(`✅ ${data.message}`, 'success');
            closeQuickPasswordModal();
        } else {
            errorDiv.textContent = data.error || 'Error al cambiar contraseña';
            errorDiv.style.display = 'block';
            confirmButton.disabled = false;
            confirmButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        errorDiv.textContent = 'Error al cambiar contraseña';
        errorDiv.style.display = 'block';
        confirmButton.disabled = false;
        confirmButton.textContent = originalText;
    }
}

// ========================================
// Modal de Sesiones Bloqueantes
// ========================================

// Abrir modal de sesiones bloqueantes
async function openBlockingSessionsModal() {
    document.getElementById('blockingSessionsModal').style.display = 'block';
    await loadBlockingSessions();
}

// Cerrar modal de sesiones bloqueantes
function closeBlockingSessionsModal() {
    document.getElementById('blockingSessionsModal').style.display = 'none';
}

// Cargar sesiones bloqueantes
async function loadBlockingSessions() {
    const contentDiv = document.getElementById('blockingSessionsContent');
    contentDiv.innerHTML = '<p class="loading">Cargando sesiones bloqueantes...</p>';
    
    try {
        const response = await fetch('/api/sessions/blocking');
        const data = await response.json();
        
        if (data.success) {
            if (data.count === 0) {
                contentDiv.innerHTML = '<p style="text-align: center; color: var(--success-color); padding: 20px;">✅ No hay sesiones bloqueando objetos en este momento</p>';
            } else {
                renderBlockingSessions(data.sessions);
            }
        } else {
            contentDiv.innerHTML = `<p class="error-message">Error: ${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error al cargar sesiones bloqueantes:', error);
        contentDiv.innerHTML = '<p class="error-message">Error al cargar sesiones bloqueantes</p>';
    }
}

// Renderizar sesiones bloqueantes
function renderBlockingSessions(sessions) {
    const contentDiv = document.getElementById('blockingSessionsContent');
    
    contentDiv.innerHTML = `
        <div style="margin-bottom: 15px; padding: 10px; background: var(--danger-color); color: white; border-radius: 6px;">
            <strong>⚠️ ${sessions.length} sesión(es) bloqueando objetos</strong>
        </div>
        ${sessions.map(session => `
            <div class="blocking-session-card">
                <div class="blocking-session-header">
                    <div>
                        <h3 style="margin: 0; color: var(--danger-color);">
                            🔒 ${escapeHtml(session.username)} - SID: ${session.sid}, Serial: ${session.serial}
                        </h3>
                    </div>
                    <button 
                        class="btn btn-danger btn-small" 
                        onclick="disconnectBlockingSession(${session.sid}, ${session.serial}, '${escapeHtml(session.username)}')">
                        🔌 Desconectar
                    </button>
                </div>
                
                <div class="blocking-session-info">
                    <p><strong>Estado:</strong> <span class="status-badge ${session.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">${session.status}</span></p>
                    <p><strong>Máquina:</strong> ${escapeHtml(session.machine || '-')}</p>
                    <p><strong>Programa:</strong> ${escapeHtml(session.program || '-')}</p>
                    <p><strong>Módulo:</strong> ${session.module ? `<span class="module-badge">${escapeHtml(session.module)}</span>` : '-'}</p>
                    <p><strong>Usuario SO:</strong> ${escapeHtml(session.osuser || '-')}</p>
                    <p><strong>Tiempo Activo:</strong> <strong style="color: var(--danger-color);">${session.formatted_last_call_et}</strong></p>
                </div>
                
                ${session.blocked_objects && session.blocked_objects.length > 0 ? `
                    <div style="margin: 10px 0; padding: 8px; background: var(--bg-color); border-radius: 6px;">
                        <strong>📦 Objetos bloqueados:</strong>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${session.blocked_objects.map(obj => `<li>${escapeHtml(obj)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="blocked-sessions-list">
                    <h4>⏳ Sesiones Esperando (${session.blocked_count}):</h4>
                    <ul>
                        ${session.blocked_sessions.map(blocked => `
                            <li>
                                <strong>SID: ${blocked.sid}</strong> | 
                                Usuario: ${escapeHtml(blocked.username || '-')} | 
                                Máquina: ${escapeHtml(blocked.machine || '-')} | 
                                Esperando: <span style="color: var(--warning-color);">${blocked.seconds_in_wait}s</span> | 
                                Tipo Lock: ${escapeHtml(blocked.lock_description || blocked.lock_type || '-')}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}
    `;
}

// Refrescar sesiones bloqueantes
async function refreshBlockingSessions() {
    showToast('Actualizando sesiones bloqueantes...', 'info');
    await loadBlockingSessions();
}

// Desconectar sesión bloqueante
async function disconnectBlockingSession(sid, serial, username) {
    if (!confirm(`¿Está seguro de desconectar la sesión bloqueante de ${username}?\n\nSID: ${sid}, Serial: ${serial}\n\nEsto liberará todos los objetos bloqueados.`)) {
        return;
    }
    
    try {
        showToast(`Desconectando sesión bloqueante ${sid}...`, 'info');
        
        const response = await fetch('/api/sessions/disconnect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sid: sid,
                serial: serial
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Sesión bloqueante desconectada exitosamente', 'success');
            // Refrescar después de 1 segundo
            setTimeout(async () => {
                await loadBlockingSessions();
                await loadData(); // Actualizar dashboard principal
            }, 1000);
        } else {
            showToast('❌ Error al desconectar sesión: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al desconectar sesión:', error);
        showToast('❌ Error al desconectar sesión', 'error');
    }
}
