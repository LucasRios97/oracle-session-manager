// Variables globales para los gráficos
let cpuChart, memoryChart, sessionsChart, tablespacesChart, waitEventsChart, sqlActivityChart;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadMetrics();
    // Auto-refresh cada 10 segundos
    setInterval(loadMetrics, 10000);
});

// Inicializar todos los gráficos
function initializeCharts() {
    // CPU Chart
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    cpuChart = new Chart(cpuCtx, {
        type: 'doughnut',
        data: {
            labels: ['Utilizado', 'Disponible'],
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#ef4444', '#e2e8f0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Memory Chart
    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    memoryChart = new Chart(memoryCtx, {
        type: 'bar',
        data: {
            labels: ['SGA', 'PGA'],
            datasets: [{
                label: 'Utilizado (GB)',
                data: [0, 0],
                backgroundColor: ['#3b82f6', '#8b5cf6'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Sessions Chart
    const sessionsCtx = document.getElementById('sessionsChart').getContext('2d');
    sessionsChart = new Chart(sessionsCtx, {
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
                    position: 'bottom'
                }
            }
        }
    });

    // Tablespaces Chart
    const tablespacesCtx = document.getElementById('tablespacesChart').getContext('2d');
    tablespacesChart = new Chart(tablespacesCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '% Utilizado',
                data: [],
                backgroundColor: '#6366f1',
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
                    max: 100
                }
            }
        }
    });

    // Wait Events Chart
    const waitEventsCtx = document.getElementById('waitEventsChart').getContext('2d');
    waitEventsChart = new Chart(waitEventsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Tiempo de Espera (segundos)',
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
                    beginAtZero: true
                }
            }
        }
    });

    // SQL Activity Chart
    const sqlActivityCtx = document.getElementById('sqlActivityChart').getContext('2d');
    sqlActivityChart = new Chart(sqlActivityCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Ejecuciones',
                data: [],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Cargar todas las métricas
async function loadMetrics() {
    try {
        const response = await fetch('/api/monitor/metrics');
        const data = await response.json();
        
        if (data.success) {
            updateMetrics(data.metrics);
            updateLastUpdateTime();
        } else {
            showToast('Error al cargar métricas: ' + data.error, 'error');
        }
    } catch (error) {
        console.error('Error al cargar métricas:', error);
        showToast('Error al conectar con el servidor', 'error');
    }
}

// Actualizar todas las métricas
function updateMetrics(metrics) {
    // Actualizar valores rápidos
    document.getElementById('cpuValue').textContent = metrics.cpu.used_percent.toFixed(1);
    document.getElementById('sgaValue').textContent = (metrics.memory.sga_used_gb).toFixed(2);
    document.getElementById('pgaValue').textContent = (metrics.memory.pga_used_gb).toFixed(2);
    document.getElementById('sessionsValue').textContent = metrics.sessions.active;

    // Actualizar CPU Chart
    cpuChart.data.datasets[0].data = [
        metrics.cpu.used_percent,
        100 - metrics.cpu.used_percent
    ];
    cpuChart.update();

    // Actualizar Memory Chart
    memoryChart.data.datasets[0].data = [
        metrics.memory.sga_used_gb,
        metrics.memory.pga_used_gb
    ];
    memoryChart.update();

    // Actualizar Sessions Chart
    sessionsChart.data.datasets[0].data = [
        metrics.sessions.active,
        metrics.sessions.inactive
    ];
    sessionsChart.update();

    // Actualizar Tablespaces Chart
    if (metrics.tablespaces && metrics.tablespaces.length > 0) {
        // Tomar solo los top 5 tablespaces
        const topTablespaces = metrics.tablespaces.slice(0, 5);
        tablespacesChart.data.labels = topTablespaces.map(ts => ts.name);
        tablespacesChart.data.datasets[0].data = topTablespaces.map(ts => ts.percent_used);
        
        // Colorear según porcentaje
        tablespacesChart.data.datasets[0].backgroundColor = topTablespaces.map(ts => {
            if (ts.percent_used >= 90) return '#ef4444';
            if (ts.percent_used >= 75) return '#f59e0b';
            return '#10b981';
        });
        
        tablespacesChart.update();
    }

    // Actualizar Wait Events Chart
    if (metrics.wait_events && metrics.wait_events.length > 0) {
        const topWaits = metrics.wait_events.slice(0, 5);
        waitEventsChart.data.labels = topWaits.map(w => w.event);
        waitEventsChart.data.datasets[0].data = topWaits.map(w => w.time_waited_seconds);
        waitEventsChart.update();
    }

    // Actualizar SQL Activity Chart (simular histórico con últimos valores)
    if (metrics.sql_activity) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('es-PY', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        // Mantener solo los últimos 20 puntos
        if (sqlActivityChart.data.labels.length >= 20) {
            sqlActivityChart.data.labels.shift();
            sqlActivityChart.data.datasets[0].data.shift();
        }
        
        sqlActivityChart.data.labels.push(timeLabel);
        sqlActivityChart.data.datasets[0].data.push(metrics.sql_activity.executions);
        sqlActivityChart.update();
    }
}

// Refrescar métricas manualmente
function refreshMetrics() {
    showToast('Actualizando métricas...', 'info');
    loadMetrics();
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
