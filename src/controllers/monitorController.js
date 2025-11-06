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

module.exports = {
    getServerMetrics
};
