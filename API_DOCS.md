# Documentación de la API - Oracle Session Manager

## Base URL
```
http://localhost:3000/api
```

## Endpoints Disponibles

### 1. Obtener Estadísticas Generales

**GET** `/statistics`

Retorna estadísticas generales de las sesiones en la base de datos.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "statistics": {
    "total_sessions": 25,
    "active_sessions": 12,
    "inactive_sessions": 13,
    "unique_users": 8,
    "blocked_sessions": 2
  }
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/statistics
```

---

### 2. Obtener Todas las Sesiones Activas

**GET** `/sessions`

Retorna todas las sesiones activas con información detallada.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "count": 12,
  "sessions": [
    {
      "sid": 123,
      "serial": 45678,
      "process": "12345",
      "status": "ACTIVE",
      "username": "LDRIOS",
      "osuser": "usuario.windows",
      "machine": "PC-WORKSTATION",
      "program": "forms.exe",
      "module": "FORM_VENTAS",
      "logon_time": "2025-11-06T08:30:00.000Z",
      "last_call_et": 3600,
      "formatted_last_call_et": "01:00:00",
      "sql_id": "abc123xyz",
      "sql_text": "SELECT * FROM tabla WHERE...",
      "sql_fulltext": "SELECT * FROM tabla WHERE condicion = 'valor'",
      "blocking_session": null,
      "event": "SQL*Net message from client",
      "wait_time": 0,
      "seconds_in_wait": 120,
      "disconnect_command": "ALTER SYSTEM DISCONNECT SESSION '123, 45678' IMMEDIATE;"
    }
  ]
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/sessions
```

---

### 3. Obtener Resumen por Usuario

**GET** `/sessions/by-user`

Retorna un resumen de sesiones agrupadas por usuario.

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "users": [
    {
      "username": "LDRIOS",
      "session_count": 5,
      "first_logon": "2025-11-06T07:00:00.000Z",
      "max_last_call_et": 7200
    },
    {
      "username": "USUARIO2",
      "session_count": 3,
      "first_logon": "2025-11-06T09:15:00.000Z",
      "max_last_call_et": 1800
    }
  ]
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/sessions/by-user
```

---

### 4. Obtener Sesiones de un Usuario Específico

**GET** `/sessions/user/:username`

Retorna todas las sesiones de un usuario específico.

**Parámetros de URL:**
- `username` (string, requerido): Nombre del usuario en la base de datos

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "username": "LDRIOS",
  "count": 5,
  "sessions": [
    {
      "sid": 123,
      "serial": 45678,
      "process": "12345",
      "status": "ACTIVE",
      "username": "LDRIOS",
      "osuser": "usuario.windows",
      "machine": "PC-WORKSTATION",
      "program": "forms.exe",
      "module": "FORM_VENTAS",
      "logon_time": "2025-11-06T08:30:00.000Z",
      "last_call_et": 3600,
      "formatted_last_call_et": "01:00:00",
      "sql_id": "abc123xyz",
      "sql_text": "SELECT * FROM tabla WHERE...",
      "event": "SQL*Net message from client",
      "disconnect_command": "ALTER SYSTEM DISCONNECT SESSION '123, 45678' IMMEDIATE;"
    }
  ]
}
```

**Ejemplo cURL:**
```bash
curl http://localhost:3000/api/sessions/user/LDRIOS
```

---

### 5. Desconectar una Sesión

**POST** `/sessions/disconnect`

Desconecta una sesión específica mediante ALTER SYSTEM DISCONNECT SESSION.

**Body (JSON):**
```json
{
  "sid": 123,
  "serial": 45678
}
```

**Parámetros del Body:**
- `sid` (number, requerido): Session ID
- `serial` (number, requerido): Serial# de la sesión

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión desconectada exitosamente",
  "session": {
    "sid": 123,
    "serial": 45678,
    "username": "LDRIOS",
    "status": "ACTIVE",
    "module": "FORM_VENTAS"
  },
  "command": "ALTER SYSTEM DISCONNECT SESSION '123, 45678' IMMEDIATE"
}
```

**Respuesta de error (400) - Parámetros faltantes:**
```json
{
  "success": false,
  "error": "Se requieren los parámetros sid y serial"
}
```

**Respuesta de error (404) - Sesión no encontrada:**
```json
{
  "success": false,
  "error": "Sesión no encontrada"
}
```

**Respuesta de error (500) - Error al desconectar:**
```json
{
  "success": false,
  "error": "ORA-00031: session marked for kill"
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:3000/api/sessions/disconnect \
  -H "Content-Type: application/json" \
  -d '{"sid": 123, "serial": 45678}'
```

**Ejemplo PowerShell:**
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

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 400 | Bad Request - Parámetros inválidos o faltantes |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error en el servidor o BD |

---

## Manejo de Errores

Todas las respuestas de error siguen este formato:

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

Errores comunes:
- **ORA-00031**: La sesión ya está marcada para kill
- **ORA-00030**: La sesión de usuario no existe
- **DPI-1047**: No se encuentra Oracle Client Library
- **Connection Error**: No se puede conectar a la base de datos

---

## Notas de Seguridad

⚠️ **IMPORTANTE**: Esta API no tiene autenticación implementada. Para uso en producción, se recomienda:

1. Implementar autenticación (JWT, OAuth, etc.)
2. Implementar autorización basada en roles
3. Registrar todas las desconexiones de sesiones (audit log)
4. Limitar las IPs que pueden acceder a la API
5. Implementar rate limiting
6. Usar HTTPS en lugar de HTTP

---

## Consultas SQL Base

La aplicación utiliza las siguientes vistas del sistema Oracle:

- `v$session`: Información de sesiones activas
- `v$sql`: Consultas SQL en caché

Requiere los siguientes privilegios:
- `SELECT` en `v$session`
- `SELECT` en `v$sql`
- `ALTER SYSTEM` (para desconectar sesiones)

---

## Ejemplos de Integración

### JavaScript/Fetch
```javascript
// Obtener estadísticas
async function getStats() {
    const response = await fetch('http://localhost:3000/api/statistics');
    const data = await response.json();
    console.log(data.statistics);
}

// Desconectar sesión
async function disconnectSession(sid, serial) {
    const response = await fetch('http://localhost:3000/api/sessions/disconnect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sid, serial })
    });
    const data = await response.json();
    return data;
}
```

### Python
```python
import requests

# Obtener sesiones
response = requests.get('http://localhost:3000/api/sessions')
sessions = response.json()

# Desconectar sesión
data = {'sid': 123, 'serial': 45678}
response = requests.post(
    'http://localhost:3000/api/sessions/disconnect',
    json=data
)
result = response.json()
```

---

Para más información sobre el uso de la aplicación, consulta:
- `README.md` - Documentación general
- `GUIA_USO.md` - Guía de uso del dashboard
