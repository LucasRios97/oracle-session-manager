const { getConnection, closeConnection } = require('../config/database');

// Obtener métricas del servidor
async function getServerMetrics(req, res) {
    let connection;
    try {
        connection = await getConnection();
        
        // CPU Usage
        const cpuQuery = `
            SELECT VALUE as cpu_used_percent
            FROM V$SYSMETRIC
            WHERE METRIC_NAME = 'Host CPU Utilization (%)'
              AND INTSIZE_CSEC = (SELECT MAX(INTSIZE_CSEC) FROM V$SYSMETRIC)
        `;
        
        // Memory Usage (SGA y PGA)
        const memoryQuery = `
            SELECT 
                ROUND(SUM(CASE WHEN name LIKE '%SGA%' THEN value ELSE 0 END) / 1024 / 1024 / 1024, 2) as sga_used_gb,
                ROUND(SUM(CASE WHEN name LIKE '%PGA%' THEN value ELSE 0 END) / 1024 / 1024 / 1024, 2) as pga_used_gb
            FROM V$SYSSTAT
            WHERE name IN ('session pga memory', 'session uga memory')
               OR name LIKE '%SGA%'
        `;
        
        // Sessions
        const sessionsQuery = `
            SELECT 
                COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_sessions,
                COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_sessions,
                COUNT(*) as total_sessions
            FROM V$SESSION
            WHERE type = 'USER'
        `;
        
        // Tablespaces
        const tablespacesQuery = `
            SELECT 
                df.tablespace_name as name,
                ROUND((df.total_space - NVL(fs.free_space, 0)) / df.total_space * 100, 2) as percent_used,
                ROUND(df.total_space / 1024 / 1024 / 1024, 2) as total_gb,
                ROUND((df.total_space - NVL(fs.free_space, 0)) / 1024 / 1024 / 1024, 2) as used_gb
            FROM (
                SELECT tablespace_name, SUM(bytes) as total_space
                FROM dba_data_files
                GROUP BY tablespace_name
            ) df
            LEFT JOIN (
                SELECT tablespace_name, SUM(bytes) as free_space
                FROM dba_free_space
                GROUP BY tablespace_name
            ) fs ON df.tablespace_name = fs.tablespace_name
            ORDER BY percent_used DESC
        `;
        
        // Wait Events (Top 5)
        const waitEventsQuery = `
            SELECT 
                event,
                ROUND(time_waited / 100, 2) as time_waited_seconds,
                total_waits
            FROM V$SYSTEM_EVENT
            WHERE event NOT LIKE '%SQL*Net%'
              AND event NOT LIKE '%idle%'
              AND time_waited > 0
            ORDER BY time_waited DESC
            FETCH FIRST 5 ROWS ONLY
        `;
        
        // SQL Activity (últimos 5 minutos)
        const sqlActivityQuery = `
            SELECT 
                COUNT(*) as executions,
                ROUND(AVG(elapsed_time / 1000000), 2) as avg_elapsed_seconds
            FROM V$SQL
            WHERE last_active_time >= SYSDATE - INTERVAL '5' MINUTE
        `;
        
        // Ejecutar todas las consultas
        const [cpuResult, memoryResult, sessionsResult, tablespacesResult, waitEventsResult, sqlActivityResult] = 
            await Promise.all([
                connection.execute(cpuQuery),
                connection.execute(memoryQuery),
                connection.execute(sessionsQuery),
                connection.execute(tablespacesQuery),
                connection.execute(waitEventsQuery),
                connection.execute(sqlActivityQuery)
            ]);
        
        // Formatear resultados
        const metrics = {
            cpu: {
                used_percent: cpuResult.rows[0] ? cpuResult.rows[0][0] : 0
            },
            memory: {
                sga_used_gb: memoryResult.rows[0] ? memoryResult.rows[0][0] || 0 : 0,
                pga_used_gb: memoryResult.rows[0] ? memoryResult.rows[0][1] || 0 : 0
            },
            sessions: {
                active: sessionsResult.rows[0] ? sessionsResult.rows[0][0] : 0,
                inactive: sessionsResult.rows[0] ? sessionsResult.rows[0][1] : 0,
                total: sessionsResult.rows[0] ? sessionsResult.rows[0][2] : 0
            },
            tablespaces: tablespacesResult.rows.map(row => ({
                name: row[0],
                percent_used: row[1],
                total_gb: row[2],
                used_gb: row[3]
            })),
            wait_events: waitEventsResult.rows.map(row => ({
                event: row[0],
                time_waited_seconds: row[1],
                total_waits: row[2]
            })),
            sql_activity: {
                executions: sqlActivityResult.rows[0] ? sqlActivityResult.rows[0][0] : 0,
                avg_elapsed_seconds: sqlActivityResult.rows[0] ? sqlActivityResult.rows[0][1] : 0
            }
        };
        
        res.json({
            success: true,
            metrics: metrics,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener métricas del servidor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

// Obtener métricas por usuario
async function getUserMetrics(req, res) {
    let connection;
    try {
        connection = await getConnection();
        
        // Consulta para obtener métricas agrupadas por usuario
        const userMetricsQuery = `
            SELECT 
                s.username,
                COUNT(*) as total_sessions,
                COUNT(CASE WHEN s.status = 'ACTIVE' THEN 1 END) as active_sessions,
                ROUND(SUM(ss.value) / 1024 / 1024, 2) as memory_mb,
                ROUND(SUM(st.value) / 100, 2) as cpu_seconds,
                SUM(CASE WHEN sn.name = 'session logical reads' THEN sn.value ELSE 0 END) as logical_reads,
                SUM(CASE WHEN sn.name = 'physical reads' THEN sn.value ELSE 0 END) as physical_reads
            FROM V$SESSION s
            LEFT JOIN V$SESSTAT ss ON s.sid = ss.sid
            LEFT JOIN V$STATNAME sn1 ON ss.statistic# = sn1.statistic# AND sn1.name = 'session pga memory'
            LEFT JOIN V$SESSTAT st ON s.sid = st.sid
            LEFT JOIN V$STATNAME sn2 ON st.statistic# = sn2.statistic# AND sn2.name = 'CPU used by this session'
            LEFT JOIN V$SESSTAT sn ON s.sid = sn.sid
            LEFT JOIN V$STATNAME snm ON sn.statistic# = snm.statistic# 
                AND snm.name IN ('session logical reads', 'physical reads')
            WHERE s.type = 'USER'
              AND s.username IS NOT NULL
            GROUP BY s.username
            ORDER BY memory_mb DESC
        `;
        
        const result = await connection.execute(userMetricsQuery);
        
        // Formatear resultados
        const users = result.rows.map(row => ({
            username: row[0],
            total_sessions: row[1],
            active_sessions: row[2],
            memory_mb: row[3] || 0,
            cpu_seconds: row[4] || 0,
            logical_reads: row[5] || 0,
            physical_reads: row[6] || 0
        }));
        
        // Calcular resumen
        const summary = {
            total_users: users.length,
            active_users: users.filter(u => u.active_sessions > 0).length,
            total_memory_mb: users.reduce((sum, u) => sum + u.memory_mb, 0),
            total_cpu_seconds: users.reduce((sum, u) => sum + u.cpu_seconds, 0),
            total_active_sessions: users.reduce((sum, u) => sum + u.active_sessions, 0),
            total_inactive_sessions: users.reduce((sum, u) => sum + (u.total_sessions - u.active_sessions), 0)
        };
        
        res.json({
            success: true,
            metrics: {
                summary: summary,
                users: users
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener métricas por usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

module.exports = {
    getServerMetrics,
    getUserMetrics
};
