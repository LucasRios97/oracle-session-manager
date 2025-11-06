# 🛠️ Comandos Útiles - Oracle Session Manager

## 🚀 Comandos Básicos

### Iniciar la Aplicación
```powershell
cd c:\Users\soporte\Desktop\app
npm start
```

### Detener la Aplicación
Presiona: `Ctrl + C` en la ventana de PowerShell

### Verificar que el Servidor Está Corriendo
```powershell
# Verificar proceso Node.js
Get-Process node -ErrorAction SilentlyContinue

# Verificar puerto 3000
Test-NetConnection -ComputerName localhost -Port 3000
```

---

## 📊 Comandos de Diagnóstico

### Ver Conexiones a la Base de Datos
```sql
-- Conectarse a SQL Developer o SQLcl con usuario DBA
SELECT username, COUNT(*) as sessions
FROM v$session
WHERE type = 'USER'
GROUP BY username
ORDER BY sessions DESC;
```

### Ver Todas las Sesiones Activas
```sql
SELECT sid, serial#, username, osuser, machine, module, status, last_call_et
FROM v$session
WHERE type = 'USER'
  AND status = 'ACTIVE'
ORDER BY last_call_et DESC;
```

### Ver Sesiones de Usuario Específico
```sql
SELECT sid, serial#, osuser, machine, module, status, last_call_et,
       TO_CHAR(TRUNC(last_call_et / 3600), 'FM00') || ':' ||
       TO_CHAR(TRUNC(MOD(last_call_et, 3600) / 60), 'FM00') || ':' ||
       TO_CHAR(MOD(last_call_et, 60), 'FM00') as tiempo_activo
FROM v$session
WHERE type = 'USER'
  AND username = 'LDRIOS'
ORDER BY last_call_et DESC;
```

### Ver SQL en Ejecución
```sql
SELECT sess.sid, sess.serial#, sess.username, 
       sess.module, sql.sql_text
FROM v$session sess
LEFT JOIN v$sql sql ON sql.sql_id = sess.sql_id
WHERE sess.type = 'USER'
  AND sess.status = 'ACTIVE'
  AND sql.sql_text IS NOT NULL;
```

### Ver Sesiones Bloqueadas
```sql
SELECT blocking_session, sid, serial#, username, 
       wait_class, seconds_in_wait
FROM v$session
WHERE blocking_session IS NOT NULL;
```

---

## 🔧 Comandos de Administración

### Desconectar Sesión Manualmente
```sql
-- Formato general
ALTER SYSTEM DISCONNECT SESSION 'sid, serial#' IMMEDIATE;

-- Ejemplo
ALTER SYSTEM DISCONNECT SESSION '123, 45678' IMMEDIATE;
```

### Desconectar Todas las Sesiones de un Usuario
```sql
-- CUIDADO: Esto desconecta TODAS las sesiones del usuario
BEGIN
  FOR session IN (
    SELECT sid, serial#
    FROM v$session
    WHERE username = 'NOMBRE_USUARIO'
      AND type = 'USER'
  ) LOOP
    EXECUTE IMMEDIATE 'ALTER SYSTEM DISCONNECT SESSION ''' || 
                      session.sid || ', ' || session.serial# || ''' IMMEDIATE';
  END LOOP;
END;
/
```

### Ver Permisos del Usuario
```sql
-- Ver permisos del sistema
SELECT privilege
FROM dba_sys_privs
WHERE grantee = 'LDRIOS'
ORDER BY privilege;

-- Verificar permiso ALTER SYSTEM
SELECT privilege
FROM dba_sys_privs
WHERE grantee = 'LDRIOS'
  AND privilege = 'ALTER SYSTEM';
```

---

## 📦 Comandos de Mantenimiento

### Reinstalar Dependencias
```powershell
cd c:\Users\soporte\Desktop\app
Remove-Item node_modules -Recurse -Force
npm install
```

### Verificar Dependencias Instaladas
```powershell
npm list
```

### Actualizar Dependencias
```powershell
npm update
```

### Ver Versión de Node.js
```powershell
node --version
```

### Ver Versión de npm
```powershell
npm --version
```

---

## 🔍 Comandos de Oracle Instant Client

### Verificar Ubicación del Instant Client
```powershell
Test-Path "C:\instantclient_19_28"
```

### Ver Archivos del Instant Client
```powershell
Get-ChildItem "C:\instantclient_19_28" | Select-Object Name, Length
```

### Verificar Variables de Entorno (si aplica)
```powershell
$env:PATH -split ';' | Where-Object { $_ -like '*instantclient*' }
```

---

## 🌐 Comandos de Red y Conectividad

### Probar Conexión a la Base de Datos
```powershell
# Ping al servidor
Test-Connection rac-scan.tupisa.com.py -Count 2

# Probar puerto de Oracle
Test-NetConnection -ComputerName rac-scan.tupisa.com.py -Port 1521
```

### Ver Conexiones Locales al Puerto 3000
```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

### Abrir el Dashboard en el Navegador
```powershell
Start-Process "http://localhost:3000"
```

---

## 📝 Comandos de Logs y Debugging

### Ver Variables de Entorno Cargadas
```powershell
cd c:\Users\soporte\Desktop\app
node -e "require('dotenv').config(); console.log('DB_USER:', process.env.DB_USER); console.log('DB_CONNECTION_STRING:', process.env.DB_CONNECTION_STRING);"
```

### Ejecutar en Modo Debug
```powershell
# Con más información de debug
$env:DEBUG = "*"
npm start
```

### Ver Logs del Servidor
```powershell
# El output aparecerá en la consola donde ejecutaste npm start
# Si necesitas redirigir a un archivo:
npm start > server.log 2>&1
```

---

## 🔄 Comandos de API (desde PowerShell)

### Obtener Estadísticas
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/statistics" -Method Get | ConvertTo-Json
```

### Obtener Sesiones Activas
```powershell
$sessions = Invoke-RestMethod -Uri "http://localhost:3000/api/sessions" -Method Get
$sessions.sessions | Format-Table -AutoSize
```

### Obtener Sesiones por Usuario
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/by-user" -Method Get | ConvertTo-Json
```

### Obtener Sesiones de Usuario Específico
```powershell
$username = "LDRIOS"
Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/user/$username" -Method Get | ConvertTo-Json
```

### Desconectar una Sesión
```powershell
$body = @{
    sid = 123
    serial = 45678
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/sessions/disconnect" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

---

## 🧪 Comandos de Testing

### Test Rápido de Conexión
```powershell
cd c:\Users\soporte\Desktop\app
node -e "const db = require('./src/config/database'); db.getConnection().then(conn => { console.log('✓ Conexión OK'); conn.close(); }).catch(err => console.error('✗ Error:', err));"
```

### Test de Endpoints API
```powershell
# Test endpoint de estadísticas
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistics"
Write-Host "Status Code: $($response.StatusCode)"
$response.Content

# Test endpoint de sesiones
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/sessions"
Write-Host "Status Code: $($response.StatusCode)"
```

---

## 🔐 Comandos de Seguridad

### Cambiar Contraseña en .env
```powershell
# Editar el archivo .env
notepad c:\Users\soporte\Desktop\app\.env

# Después de editar, reiniciar el servidor
# Ctrl+C en la ventana del servidor, luego:
npm start
```

### Ver Permisos de Archivos
```powershell
Get-Acl c:\Users\soporte\Desktop\app\.env | Format-List
```

---

## 📊 Comandos de Monitoreo

### Ver Uso de Memoria del Servidor
```powershell
Get-Process node | Select-Object ProcessName, Id, 
    @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}}
```

### Ver Puertos Abiertos
```powershell
Get-NetTCPConnection -State Listen | 
    Where-Object {$_.LocalPort -eq 3000} | 
    Select-Object LocalAddress, LocalPort, State
```

### Monitoreo Continuo de Sesiones (SQL)
```sql
-- Script para ejecutar cada minuto
SELECT TO_CHAR(SYSDATE, 'HH24:MI:SS') as hora,
       COUNT(*) as total_sesiones,
       SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activas,
       SUM(CASE WHEN status = 'INACTIVE' THEN 1 ELSE 0 END) as inactivas
FROM v$session
WHERE type = 'USER';
```

---

## 🚨 Comandos de Emergencia

### Matar Proceso Node.js
```powershell
# Si el servidor no responde a Ctrl+C
Get-Process node | Stop-Process -Force
```

### Limpiar Puerto 3000 Ocupado
```powershell
# Ver qué proceso usa el puerto
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Matar el proceso (reemplaza XXXX con el PID)
Stop-Process -Id XXXX -Force
```

### Reinicio Completo
```powershell
# 1. Detener servidor
Get-Process node | Stop-Process -Force

# 2. Limpiar caché
cd c:\Users\soporte\Desktop\app
Remove-Item node_modules -Recurse -Force
npm cache clean --force

# 3. Reinstalar
npm install

# 4. Reiniciar
npm start
```

---

## 📁 Comandos de Backup

### Backup de la Configuración
```powershell
$fecha = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item c:\Users\soporte\Desktop\app\.env `
          c:\Users\soporte\Desktop\app\.env.backup.$fecha
```

### Backup Completo del Proyecto
```powershell
$fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$destino = "c:\Users\soporte\Desktop\app_backup_$fecha"
Copy-Item c:\Users\soporte\Desktop\app $destino -Recurse -Exclude node_modules
```

### Restaurar Backup
```powershell
# Restaurar solo .env
Copy-Item c:\Users\soporte\Desktop\app\.env.backup.YYYYMMDD_HHMMSS `
          c:\Users\soporte\Desktop\app\.env
```

---

## 🔄 Scripts de Automatización

### Script de Inicio Automático
```powershell
# Crear un archivo start_server.ps1
@"
cd c:\Users\soporte\Desktop\app
Write-Host "Iniciando Oracle Session Manager..." -ForegroundColor Green
npm start
"@ | Out-File -FilePath "c:\Users\soporte\Desktop\app\start_server.ps1" -Encoding UTF8

# Ejecutar
powershell -File c:\Users\soporte\Desktop\app\start_server.ps1
```

### Script de Verificación de Estado
```powershell
# Crear check_status.ps1
@"
`$process = Get-Process node -ErrorAction SilentlyContinue
if (`$process) {
    Write-Host "✓ Servidor corriendo (PID: `$(`$process.Id))" -ForegroundColor Green
    `$response = Invoke-WebRequest -Uri "http://localhost:3000/api/statistics" -UseBasicParsing
    if (`$response.StatusCode -eq 200) {
        Write-Host "✓ API respondiendo correctamente" -ForegroundColor Green
    }
} else {
    Write-Host "✗ Servidor no está corriendo" -ForegroundColor Red
}
"@ | Out-File -FilePath "c:\Users\soporte\Desktop\app\check_status.ps1" -Encoding UTF8
```

---

## 💡 Alias Útiles (Configurar en Profile)

```powershell
# Agregar al perfil de PowerShell
# notepad $PROFILE

# Alias para iniciar el servidor
function Start-OracleManager {
    cd c:\Users\soporte\Desktop\app
    npm start
}
Set-Alias -Name osm -Value Start-OracleManager

# Alias para abrir el dashboard
function Open-OracleManager {
    Start-Process "http://localhost:3000"
}
Set-Alias -Name osm-open -Value Open-OracleManager

# Usar:
# osm        -> Inicia el servidor
# osm-open   -> Abre el navegador
```

---

## 📚 Referencias Rápidas

### URLs Importantes
- Dashboard: http://localhost:3000
- Estadísticas: http://localhost:3000/api/statistics
- Sesiones: http://localhost:3000/api/sessions
- Por Usuario: http://localhost:3000/api/sessions/by-user

### Archivos Clave
- Configuración: `.env`
- Servidor: `src/server.js`
- Base de Datos: `src/config/database.js`
- Controladores: `src/controllers/sessionController.js`
- Frontend: `src/public/index.html`

### Documentación
- README.md - Guía principal
- GUIA_USO.md - Guía de uso
- API_DOCS.md - Documentación API
- EJEMPLOS_USO.md - Ejemplos prácticos
- CHECKLIST.md - Lista de verificación

---

**💡 Tip**: Guarda este archivo como referencia rápida para operaciones comunes.
