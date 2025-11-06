// Variables globales
let allSessions = [];
let allUsers = [];
let selectedSession = null;

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    // Auto-refresh cada 15 segundos
    setInterval(loadData, 15000);
});

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
    
    let filtered = allSessions.filter(session => {
        const matchUser = !userFilter || (session.username && session.username.toLowerCase() === userFilter);
        const matchStatus = !statusFilter || (session.status && session.status.toLowerCase() === statusFilter);
        const matchSearch = !searchFilter || 
            (session.module && session.module.toLowerCase().includes(searchFilter)) ||
            (session.program && session.program.toLowerCase().includes(searchFilter)) ||
            (session.machine && session.machine.toLowerCase().includes(searchFilter)) ||
            (session.osuser && session.osuser.toLowerCase().includes(searchFilter));
        
        return matchUser && matchStatus && matchSearch;
    });
    
    renderSessions(filtered);
}

// Renderizar tabla de sesiones
function renderSessions(sessions) {
    const tbody = document.getElementById('sessionsTable');
    const countElement = document.getElementById('activeSessionCount');
    const activeCountElement = document.getElementById('activeCount');
    const inactiveCountElement = document.getElementById('inactiveCount');
    
    // Contar sesiones activas e inactivas
    const activeCount = sessions.filter(s => s.status === 'ACTIVE').length;
    const inactiveCount = sessions.filter(s => s.status === 'INACTIVE').length;
    
    countElement.textContent = sessions.length;
    activeCountElement.textContent = activeCount;
    inactiveCountElement.textContent = inactiveCount;
    
    if (sessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="loading">No hay sesiones que coincidan con los filtros</td></tr>';
        return;
    }
    
    tbody.innerHTML = sessions.map((session, index) => `
        <tr>
            <td><strong>${escapeHtml(session.username || '-')}</strong></td>
            <td>${escapeHtml(session.osuser || '-')}</td>
            <td><span class="status-badge ${session.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}">${session.status}</span></td>
            <td>${escapeHtml(session.machine || '-')}</td>
            <td>${session.module ? `<span class="module-badge">${escapeHtml(session.module)}</span>` : '-'}</td>
            <td><strong>${session.formatted_last_call_et || formatSeconds(session.last_call_et)}</strong></td>
            <td>
                ${session.sql_text ? 
                    `<button class="btn btn-info btn-small" data-session-index="${index}" data-action="show-sql" title="Ver SQL completo">
                        📝 Ver SQL
                    </button>` 
                    : '-'}
            </td>
            <td>
                <button class="btn btn-danger btn-small" data-session-index="${index}" data-action="disconnect">
                    🔌 Desconectar
                </button>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners después de renderizar
    addSessionEventListeners(sessions);
}

// Agregar event listeners a los botones de las sesiones
function addSessionEventListeners(sessions) {
    // Event listeners para botones de desconexión
    document.querySelectorAll('[data-action="disconnect"]').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-session-index'));
            const session = sessions[index];
            if (session) {
                showDisconnectModal(session);
            }
        });
    });
    
    // Event listeners para mostrar SQL
    document.querySelectorAll('[data-action="show-sql"]').forEach(element => {
        element.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-session-index'));
            const session = sessions[index];
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
    
    if (event.target == disconnectModal) {
        closeModal();
    }
    if (event.target == sqlModal) {
        closeSqlModal();
    }
    if (event.target == disconnectAllModal) {
        closeDisconnectAllModal();
    }
}

// Cerrar modales con la tecla ESC
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
        closeSqlModal();
        closeDisconnectAllModal();
    }
});

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
