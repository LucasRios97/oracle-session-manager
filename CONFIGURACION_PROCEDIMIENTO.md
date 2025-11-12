# Configuración del Procedimiento Almacenado para Kill Session

## 📋 Resumen de Cambios

La aplicación ha sido actualizada para usar el procedimiento almacenado `INV.kill_user_session` en lugar de ejecutar `ALTER SYSTEM KILL SESSION` directamente. Esto permite que usuarios sin privilegios directos de `ALTER SYSTEM` puedan cerrar sesiones.

---

## 🔐 Configuración Requerida en Oracle

### 1. Verificar que el Procedimiento Existe

```sql
-- Conectado como INV o un DBA
SELECT object_name, object_type, status 
FROM dba_objects 
WHERE owner = 'INV' 
  AND object_name = 'KILL_USER_SESSION';
```

### 2. Otorgar Permiso de Ejecución a tu Usuario

```sql
-- Conectado como INV
GRANT EXECUTE ON INV.kill_user_session TO LDRIOS;
```

### 3. Verificar el Permiso

```sql
-- Conectado como LDRIOS
SELECT * FROM user_tab_privs 
WHERE table_name = 'KILL_USER_SESSION';
```

---

## ⚙️ Configuración de la Aplicación

### Opción A: Usar tu Usuario LDRIOS

Edita el archivo `.env`:

```properties
# Usar tu usuario personal
DB_USER=LDRIOS
DB_PASSWORD=tu_password_ldrios
DB_CONNECTION_STRING=//10.0.0.195:1521/tupi

# Pool de conexiones
POOL_MIN=2
POOL_MAX=10
POOL_INCREMENT=2

PORT=3000
```

**Ventajas:**
- ✅ Auditoría clara: Oracle registra que LDRIOS cerró las sesiones
- ✅ No necesitas la contraseña de INV
- ✅ Seguridad: Solo puedes ejecutar el procedimiento, no otros comandos

### Opción B: Mantener el Usuario INV (Actual)

Si prefieres seguir usando INV, no necesitas cambiar nada en el `.env`. La aplicación ya funciona correctamente.

---

## 🧪 Prueba del Procedimiento

### Desde SQL*Plus o SQL Developer (como LDRIOS):

```sql
-- Conectar como LDRIOS
CONNECT LDRIOS/tu_password@tupi

-- Ver tus sesiones activas
SELECT sid, serial#, username, status 
FROM v$session 
WHERE username = 'LDRIOS';

-- Probar el procedimiento (con una sesión tuya de prueba)
BEGIN
    INV.kill_user_session(123, 456);  -- Reemplaza con SID y SERIAL# reales
END;
/
```

---

## 🚀 Reiniciar la Aplicación

Después de modificar el `.env`, reinicia el servidor:

```bash
cd /home/develop/oracle-session-manager
pkill -f "node.*server.js"
node src/server.js
```

O si usas `npm`:

```bash
npm start
```

---

## 📊 Verificación en la Aplicación

1. Abre la aplicación en el navegador: `http://localhost:3000`
2. Ve al Dashboard Principal
3. Intenta desconectar una sesión
4. Verifica en los logs del servidor:

```bash
tail -f server.log
```

Deberías ver:
```
✓ Sesión desconectada exitosamente usando procedimiento almacenado
```

---

## 🔍 Troubleshooting

### Error: "ORA-00942: table or view does not exist"
**Causa:** Tu usuario no tiene permiso para ejecutar el procedimiento

**Solución:**
```sql
-- Como INV:
GRANT EXECUTE ON INV.kill_user_session TO LDRIOS;
```

### Error: "PLS-00201: identifier 'INV.KILL_USER_SESSION' must be declared"
**Causa:** El procedimiento no existe o tiene otro nombre

**Solución:** Verifica el nombre exacto del procedimiento:
```sql
SELECT object_name FROM dba_objects 
WHERE owner = 'INV' 
  AND object_type = 'PROCEDURE'
  AND object_name LIKE '%KILL%';
```

### Error de conexión al iniciar la app
**Causa:** Credenciales incorrectas en `.env`

**Solución:** Verifica que `DB_USER` y `DB_PASSWORD` sean correctos

---

## 📝 Código del Procedimiento (Referencia)

Si necesitas recrear el procedimiento:

```sql
-- Conectado como INV (o usuario con privilegio ALTER SYSTEM)
CREATE OR REPLACE PROCEDURE kill_user_session(
    p_sid IN NUMBER,
    p_serial IN NUMBER
)
AUTHID DEFINER  -- Ejecuta con privilegios del creador (INV)
AS
BEGIN
    EXECUTE IMMEDIATE 
        'ALTER SYSTEM KILL SESSION ''' || p_sid || ',' || p_serial || ''' IMMEDIATE';
    
    DBMS_OUTPUT.PUT_LINE('Session ' || p_sid || ',' || p_serial || ' killed successfully');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error killing session: ' || SQLERRM);
        RAISE;
END kill_user_session;
/

-- Otorgar permisos
GRANT EXECUTE ON kill_user_session TO LDRIOS;
```

---

## ✅ Resumen de Ventajas

| Aspecto | Antes (ALTER SYSTEM) | Ahora (Procedimiento) |
|---------|---------------------|----------------------|
| **Privilegio requerido** | ALTER SYSTEM | EXECUTE en procedimiento |
| **Seguridad** | Usuario necesita permisos admin | Usuario solo ejecuta procedimiento |
| **Auditoría** | Se registra el usuario conectado | Se registra el usuario conectado |
| **Flexibilidad** | DBA puede revocar fácilmente | DBA puede revocar fácilmente |
| **Mantenimiento** | Cambiar usuarios es complejo | Solo cambiar .env |

---

## 📞 Soporte

Si tienes algún problema:
1. Verifica los logs del servidor: `tail -f server.log`
2. Verifica los logs de Oracle: `SELECT * FROM v$session WHERE username = 'LDRIOS'`
3. Prueba el procedimiento manualmente desde SQL*Plus
