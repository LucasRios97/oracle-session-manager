// Variables globales para los gráficos
let memoryChart, cpuChart, sessionsChart, statusChart;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadTheme(); // Cargar tema guardado
    initializeCharts();
    loadUserMetrics();
    // Auto-refresh cada 15 segundos (comentado para actualización manual)
    // setInterval(loadUserMetrics, 15000);
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
    updateChartsTheme(newTheme);
    
    showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function updateChartsTheme(theme) {
    const textColor = theme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
    
    // Actualizar todos los gráficos con el nuevo tema
    [memoryChart, cpuChart, sessionsChart, statusChart].forEach(chart => {
        if (chart && chart.options) {
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = textColor;
            }
            if (chart.options.scales) {
                Object.keys(chart.options.scales).forEach(scaleKey => {
                    if (chart.options.scales[scaleKey].ticks) {
                        chart.options.scales[scaleKey].ticks.color = textColor;
                    }
                    if (chart.options.scales[scaleKey].grid) {
                        chart.options.scales[scaleKey].grid.color = gridColor;
                    }
                });
            }
            chart.update();
        }
    });
}

// Inicializar todos los gráficos
function initializeCharts() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const textColor = currentTheme === 'dark' ? '#f1f5f9' : '#1e293b';
    const gridColor = currentTheme === 'dark' ? '#334155' : '#e2e8f0';
    
    // Memory Chart
    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    memoryChart = new Chart(memoryCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Memoria (MB)',
                data: [],
                backgroundColor: '#3b82f6',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // CPU Chart
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU (segundos)',
                data: [],
                backgroundColor: '#ec4899',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Sessions Chart
    const sessionsCtx = document.getElementById('sessionsChart').getContext('2d');
    sessionsChart = new Chart(sessionsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total Sesiones',
                data: [],
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            }
        }
    });

    // Status Chart
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'pie',
        data: {
            labels: ['Activas', 'Inactivas'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#10b981', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Cargar métricas por usuario
async function loadUserMetrics() {
    try {
        const response = await fetch('/api/monitor/users');
        const data = await response.json();
        
        if (data.success) {
            updateUserMetrics(data.metrics);
            updateLastUpdateTime();
        } else {
            showToast('Error al cargar métricas: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al cargar métricas de usuarios:', error);
        showToast('Error al conectar con el servidor', 'error');
    }
}

// Actualizar todas las métricas de usuarios
function updateUserMetrics(metrics) {
    // Actualizar valores rápidos
    document.getElementById('totalUsers').textContent = metrics.summary.total_users;
    document.getElementById('activeUsers').textContent = metrics.summary.active_users;
    document.getElementById('totalMemory').textContent = (metrics.summary.total_memory_mb / 1024).toFixed(2);
    document.getElementById('totalCPU').textContent = metrics.summary.total_cpu_seconds.toFixed(1);

    // Preparar datos para gráficos (Top 10)
    const users = metrics.users.slice(0, 10);
    const usernames = users.map(u => u.username);
    
    // Actualizar Memory Chart
    memoryChart.data.labels = usernames;
    memoryChart.data.datasets[0].data = users.map(u => u.memory_mb);
    memoryChart.update();

    // Actualizar CPU Chart
    cpuChart.data.labels = usernames;
    cpuChart.data.datasets[0].data = users.map(u => u.cpu_seconds);
    cpuChart.update();

    // Actualizar Sessions Chart (Top 10 por sesiones)
    const topSessions = [...metrics.users].sort((a, b) => b.total_sessions - a.total_sessions).slice(0, 10);
    sessionsChart.data.labels = topSessions.map(u => u.username);
    sessionsChart.data.datasets[0].data = topSessions.map(u => u.total_sessions);
    sessionsChart.update();

    // Actualizar Status Chart
    statusChart.data.datasets[0].data = [
        metrics.summary.total_active_sessions,
        metrics.summary.total_inactive_sessions
    ];
    statusChart.update();

    // Actualizar tabla de usuarios
    updateUsersTable(metrics.users);
}

// Actualizar tabla detallada de usuarios
function updateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    No hay usuarios conectados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        // Determinar nivel de uso basado en memoria
        let usageLevel = 'low';
        let usageBadge = 'badge-low';
        let usageText = 'Bajo';
        
        if (user.memory_mb > 500) {
            usageLevel = 'high';
            usageBadge = 'badge-high';
            usageText = 'Alto';
        } else if (user.memory_mb > 200) {
            usageLevel = 'medium';
            usageBadge = 'badge-medium';
            usageText = 'Medio';
        }

        return `
            <tr class="${usageLevel}-usage">
                <td><strong>${user.username}</strong></td>
                <td>${user.total_sessions}</td>
                <td>${user.active_sessions}</td>
                <td>
                    <div>${user.memory_mb.toFixed(2)}</div>
                    <div class="progress-bar">
                        <div class="progress-bar-fill progress-${usageLevel}" 
                             style="width: ${Math.min(user.memory_mb / 10, 100)}%"></div>
                    </div>
                </td>
                <td>${user.cpu_seconds.toFixed(2)}</td>
                <td>${formatNumber(user.logical_reads)}</td>
                <td>${formatNumber(user.physical_reads)}</td>
                <td><span class="badge ${usageBadge}">${usageText}</span></td>
            </tr>
        `;
    }).join('');
}

// Formatear números grandes
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Refrescar métricas manualmente
function refreshMetrics() {
    showToast('Actualizando métricas...', 'info');
    loadUserMetrics();
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

// Mostrar toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}
