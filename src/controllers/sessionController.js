const { getConnectionFromUser, closeConnection } = require('../config/database');
const oracledb = require('oracledb');

// Obtener todas las sesiones activas
async function getActiveSessions(req, res) {
    let connection;
    try {
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        
        const query = `
            SELECT sess.sid,
                   sess.serial#,
                   sess.process,
                   sess.status,
                   sess.username,
                   sess.osuser,
                   sess.machine,
                   sess.program,
                   sess.module,
                   sess.logon_time,
                   sess.last_call_et,
                   TO_CHAR(TRUNC(sess.last_call_et / 3600), 'FM00') || ':' ||
                   TO_CHAR(TRUNC(MOD(sess.last_call_et, 3600) / 60), 'FM00') || ':' ||
                   TO_CHAR(MOD(sess.last_call_et, 60), 'FM00') as formatted_last_call_et,
                   sql.sql_id,
                   SUBSTR(sql.sql_text, 1, 200) as sql_text_preview,
                   sql.sql_fulltext,
                   sess.blocking_session,
                   sess.event,
                   sess.wait_time,
                   sess.seconds_in_wait
            FROM v$session sess
            LEFT JOIN v$sql sql ON sql.sql_id = sess.sql_id
            WHERE sess.type = 'USER'
              AND sess.username NOT IN ('SYS', 'SYSTEM', 'INV')
              AND sess.username IS NOT NULL
            ORDER BY sess.status DESC, sess.last_call_et DESC, sess.username, sess.sid
        `;
        
        const result = await connection.execute(query, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        
        // Convertir el resultado a formato JSON con el SQL completo
        // Manejar CLOBs correctamente
        const sessions = await Promise.all(result.rows.map(async row => {
            let sqlFulltext = null;
            
            // Si sql_fulltext es un CLOB, leerlo
            if (row.SQL_FULLTEXT && typeof row.SQL_FULLTEXT === 'object') {
                try {
                    const lob = row.SQL_FULLTEXT;
                    sqlFulltext = await lob.getData();
                } catch (err) {
                    console.error('Error leyendo CLOB:', err);
                    sqlFulltext = row.SQL_TEXT_PREVIEW;
                }
            } else {
                sqlFulltext = row.SQL_FULLTEXT || row.SQL_TEXT_PREVIEW;
            }
            
            return {
                sid: row.SID,
                serial: row['SERIAL#'],
                process: row.PROCESS,
                status: row.STATUS,
                username: row.USERNAME,
                osuser: row.OSUSER,
                machine: row.MACHINE,
                program: row.PROGRAM,
                module: row.MODULE,
                logon_time: row.LOGON_TIME,
                last_call_et: row.LAST_CALL_ET,
                formatted_last_call_et: row.FORMATTED_LAST_CALL_ET,
                sql_id: row.SQL_ID,
                sql_text: row.SQL_TEXT_PREVIEW,
                sql_fulltext: sqlFulltext,
                blocking_session: row.BLOCKING_SESSION,
                event: row.EVENT,
                wait_time: row.WAIT_TIME,
                seconds_in_wait: row.SECONDS_IN_WAIT,
                disconnect_command: `ALTER SYSTEM DISCONNECT SESSION '${row.SID}, ${row['SERIAL#']}' IMMEDIATE;`
            };
        }));
        
        // Eliminar duplicados por SID y Serial (solo mostrar una sesión por cada combinación SID+Serial)
        const uniqueSessions = [];
        const seenSessions = new Set();
        
        for (const session of sessions) {
            const key = `${session.sid}-${session.serial}`;
            if (!seenSessions.has(key)) {
                seenSessions.add(key);
                uniqueSessions.push(session);
            }
        }
        
        res.json({
            success: true,
            count: uniqueSessions.length,
            sessions: uniqueSessions
        });
        
    } catch (error) {
        console.error('Error al obtener sesiones:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

// Obtener sesiones agrupadas por usuario
async function getSessionsByUser(req, res) {
    let connection;
    try {
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        
        const query = `
            SELECT username,
                   COUNT(*) as session_count,
                   MIN(logon_time) as first_logon,
                   MAX(last_call_et) as max_last_call_et
            FROM v$session
            WHERE type = 'USER'
              AND username IS NOT NULL
              AND username NOT IN ('SYS', 'SYSTEM', 'INV')
            GROUP BY username
            ORDER BY session_count DESC, username
        `;
        
        const result = await connection.execute(query);
        
        const userSessions = result.rows.map(row => ({
            username: row[0],
            session_count: row[1],
            first_logon: row[2],
            max_last_call_et: row[3]
        }));
        
        res.json({
            success: true,
            users: userSessions
        });
        
    } catch (error) {
        console.error('Error al obtener sesiones por usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

// Obtener sesiones de un usuario específico
async function getUserSessions(req, res) {
    let connection;
    try {
        const { username: targetUsername } = req.params;
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        
        const query = `
            SELECT sess.sid,
                   sess.serial#,
                   sess.process,
                   sess.status,
                   sess.username,
                   sess.osuser,
                   sess.machine,
                   sess.program,
                   sess.module,
                   sess.logon_time,
                   sess.last_call_et,
                   TO_CHAR(TRUNC(sess.last_call_et / 3600), 'FM00') || ':' ||
                   TO_CHAR(TRUNC(MOD(sess.last_call_et, 3600) / 60), 'FM00') || ':' ||
                   TO_CHAR(MOD(sess.last_call_et, 60), 'FM00') as formatted_last_call_et,
                   sql.sql_id,
                   sql.sql_text,
                   sess.event
            FROM v$session sess
            LEFT JOIN v$sql sql ON sql.sql_id = sess.sql_id
            WHERE sess.type = 'USER'
              AND sess.username = :username
            ORDER BY sess.status DESC, sess.last_call_et DESC
        `;
        
        const result = await connection.execute(query, [targetUsername]);
        
        const sessions = result.rows.map(row => ({
            sid: row[0],
            serial: row[1],
            process: row[2],
            status: row[3],
            username: row[4],
            osuser: row[5],
            machine: row[6],
            program: row[7],
            module: row[8],
            logon_time: row[9],
            last_call_et: row[10],
            formatted_last_call_et: row[11],
            sql_id: row[12],
            sql_text: row[13],
            event: row[14],
            disconnect_command: `ALTER SYSTEM DISCONNECT SESSION '${row[0]}, ${row[1]}' IMMEDIATE;`
        }));
        
        res.json({
            success: true,
            username: targetUsername,
            count: sessions.length,
            sessions: sessions
        });
        
    } catch (error) {
        console.error('Error al obtener sesiones del usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

// Desconectar una sesión específica
async function disconnectSession(req, res) {
    let connection;
    try {
        const { sid, serial } = req.body;
        
        console.log('=== Solicitud de desconexión recibida ===');
        console.log('SID:', sid, 'Serial:', serial);
        
        if (!sid || !serial) {
            console.log('Error: Parámetros faltantes');
            return res.status(400).json({
                success: false,
                error: 'Se requieren los parámetros sid y serial'
            });
        }
        
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        console.log('Conexión obtenida');
        
        // Primero verificar que la sesión existe
        const checkQuery = `
            SELECT sid, serial#, username, status, module
            FROM v$session
            WHERE sid = :sid AND serial# = :serial
        `;
        
        const checkResult = await connection.execute(checkQuery, [sid, serial]);
        console.log('Sesión verificada, rows encontradas:', checkResult.rows.length);
        
        if (checkResult.rows.length === 0) {
            console.log('Error: Sesión no encontrada');
            return res.status(404).json({
                success: false,
                error: 'Sesión no encontrada'
            });
        }
        
        const sessionInfo = {
            sid: checkResult.rows[0][0],
            serial: checkResult.rows[0][1],
            username: checkResult.rows[0][2],
            status: checkResult.rows[0][3],
            module: checkResult.rows[0][4]
        };
        
        console.log('Info de la sesión:', sessionInfo);
        
        // Ejecutar el procedimiento almacenado para desconectar la sesión
        // El procedimiento INV.kill_user_session tiene privilegios AUTHID DEFINER
        const plsqlBlock = `
            BEGIN
                INV.kill_user_session(:sid, :serial);
            END;
        `;
        
        console.log('Ejecutando procedimiento almacenado INV.kill_user_session...');
        await connection.execute(plsqlBlock, { sid: sid, serial: serial }, { autoCommit: true });
        console.log('✓ Sesión desconectada exitosamente usando procedimiento almacenado');
        
        res.json({
            success: true,
            message: 'Sesión desconectada exitosamente',
            session: sessionInfo,
            method: 'Stored Procedure (INV.kill_user_session)'
        });
        
    } catch (error) {
        console.error('❌ Error al desconectar sesión:', error);
        console.error('Detalles del error:', {
            message: error.message,
            code: error.errorNum,
            offset: error.offset
        });
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
        console.log('=== Fin de solicitud de desconexión ===\n');
    }
}

// Obtener estadísticas generales
async function getStatistics(req, res) {
    let connection;
    try {
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        
        // Total de sesiones
        const totalSessionsQuery = `
            SELECT COUNT(*) as total
            FROM v$session
            WHERE type = 'USER'
        `;
        
        // Sesiones activas
        const activeSessionsQuery = `
            SELECT COUNT(*) as active
            FROM v$session
            WHERE type = 'USER' AND status = 'ACTIVE'
        `;
        
        // Sesiones inactivas
        const inactiveSessionsQuery = `
            SELECT COUNT(*) as inactive
            FROM v$session
            WHERE type = 'USER' AND status = 'INACTIVE'
        `;
        
        // Usuarios únicos
        const uniqueUsersQuery = `
            SELECT COUNT(DISTINCT username) as users
            FROM v$session
            WHERE type = 'USER' AND username IS NOT NULL
        `;
        
        // Sesiones bloqueadas
        const blockedSessionsQuery = `
            SELECT COUNT(*) as blocked
            FROM v$session
            WHERE blocking_session IS NOT NULL
        `;
        
        const [totalResult, activeResult, inactiveResult, usersResult, blockedResult] = await Promise.all([
            connection.execute(totalSessionsQuery),
            connection.execute(activeSessionsQuery),
            connection.execute(inactiveSessionsQuery),
            connection.execute(uniqueUsersQuery),
            connection.execute(blockedSessionsQuery)
        ]);
        
        res.json({
            success: true,
            statistics: {
                total_sessions: totalResult.rows[0][0],
                active_sessions: activeResult.rows[0][0],
                inactive_sessions: inactiveResult.rows[0][0],
                unique_users: usersResult.rows[0][0],
                blocked_sessions: blockedResult.rows[0][0]
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
    }
}

// Desconectar todas las sesiones de un usuario específico
async function disconnectAllUserSessions(req, res) {
    let connection;
    try {
        const { username: targetUsername } = req.body;
        
        console.log('=== Solicitud de desconexión masiva recibida ===');
        console.log('Usuario objetivo:', targetUsername);
        
        if (!targetUsername) {
            console.log('Error: Usuario no proporcionado');
            return res.status(400).json({
                success: false,
                error: 'Se requiere el nombre de usuario'
            });
        }
        
        const username = req.user.username;
        connection = await getConnectionFromUser(username);
        console.log('Conexión obtenida');
        
        // Obtener todas las sesiones del usuario objetivo
        const sessionsQuery = `
            SELECT sid, serial#, status, machine, module
            FROM v$session
            WHERE username = :username
              AND type = 'USER'
            ORDER BY sid
        `;
        
        const sessionsResult = await connection.execute(sessionsQuery, [targetUsername]);
        console.log(`Sesiones encontradas: ${sessionsResult.rows.length}`);
        
        if (sessionsResult.rows.length === 0) {
            console.log('No se encontraron sesiones para este usuario');
            return res.json({
                success: true,
                message: 'No se encontraron sesiones activas para este usuario',
                disconnected: 0,
                failed: 0,
                details: []
            });
        }
        
        // Desconectar cada sesión
        const results = [];
        let successCount = 0;
        let failCount = 0;
        
        for (const row of sessionsResult.rows) {
            const sid = row[0];
            const serial = row[1];
            const status = row[2];
            const machine = row[3];
            const module = row[4];
            
            try {
                console.log(`Desconectando sesión SID: ${sid}, Serial: ${serial}, Estado: ${status}`);
                
                // Usar el procedimiento almacenado en lugar de ALTER SYSTEM directo
                const plsqlBlock = `
                    BEGIN
                        INV.kill_user_session(:sid, :serial);
                    END;
                `;
                
                await connection.execute(plsqlBlock, { sid: sid, serial: serial }, { autoCommit: true });
                
                successCount++;
                results.push({
                    sid: sid,
                    serial: serial,
                    status: status,
                    machine: machine,
                    module: module,
                    result: 'success',
                    message: 'Desconectada exitosamente'
                });
                
                console.log(`✓ Sesión ${sid},${serial} desconectada exitosamente`);
                
            } catch (err) {
                failCount++;
                results.push({
                    sid: sid,
                    serial: serial,
                    status: status,
                    machine: machine,
                    module: module,
                    result: 'error',
                    message: err.message
                });
                
                console.log(`❌ Error al desconectar sesión ${sid},${serial}: ${err.message}`);
            }
        }
        
        console.log(`Resumen: ${successCount} exitosas, ${failCount} fallidas`);
        console.log('=== Fin de desconexión masiva ===\n');
        
        res.json({
            success: true,
            message: `Proceso completado. ${successCount} sesiones desconectadas, ${failCount} fallidas`,
            username: targetUsername,
            total_sessions: sessionsResult.rows.length,
            disconnected: successCount,
            failed: failCount,
            details: results
        });
        
    } catch (error) {
        console.error('❌ Error al desconectar sesiones del usuario:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        await closeConnection(connection);
        console.log('=== Fin de solicitud de desconexión masiva ===\n');
    }
}

module.exports = {
    getActiveSessions,
    getSessionsByUser,
    getUserSessions,
    disconnectSession,
    disconnectAllUserSessions,
    getStatistics
};
