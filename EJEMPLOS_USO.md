# 💡 Ejemplos Prácticos de Uso

## Escenarios Reales y Soluciones

---

## 🔥 Escenario 1: Usuario Reporta "Sistema Lento"

### Situación
Un usuario llama diciendo que el sistema está muy lento.

### Pasos a Seguir

1. **Abrir el Dashboard**
   - Ir a http://localhost:3000

2. **Buscar el usuario**
   - En "Resumen por Usuario", buscar el nombre del usuario
   - Ver cuántas sesiones tiene abiertas

3. **Analizar sus sesiones**
   - Click en "👁️ Ver Sesiones"
   - Revisar la columna "Tiempo Activo"
   - Identificar sesiones con tiempos muy altos (ej: > 01:00:00)

4. **Revisar el módulo**
   - Ver en qué formulario/módulo está
   - Ejemplo: Si dice "FORM_VENTAS", es el formulario de ventas

5. **Ver el SQL**
   - Click en el SQL para ver qué consulta está ejecutando
   - Si es una consulta muy compleja, puede ser el problema

6. **Solución**
   - Desconectar SOLO la sesión problemática
   - Las demás sesiones del usuario siguen funcionando
   - El usuario puede volver a entrar al formulario

### Ejemplo Real
```
Usuario: JPEREZ
Sesiones: 3
Sesión problemática:
  - SID: 245, Serial: 12345
  - Módulo: FORM_INVENTARIO
  - Tiempo: 02:15:30
  - SQL: SELECT * FROM inventario WHERE fecha > ...

Acción: Desconectar sesión 245,12345
Resultado: Las otras 2 sesiones de JPEREZ siguen activas
```

---

## 🔴 Escenario 2: Formulario Específico No Responde

### Situación
Todos los usuarios del formulario FORM_CONTABILIDAD reportan problemas.

### Pasos a Seguir

1. **Usar el filtro de búsqueda**
   - En el campo "Buscar", escribir: `FORM_CONTABILIDAD`

2. **Ver todas las sesiones de ese formulario**
   - La tabla mostrará solo las sesiones de ese módulo

3. **Identificar sesiones problemáticas**
   - Buscar sesiones con:
     - Tiempo activo muy alto
     - SQL que parezca estar colgado
     - Estado ACTIVE por mucho tiempo

4. **Desconectar selectivamente**
   - Desconectar solo las sesiones problemáticas
   - NO desconectar todas, solo las necesarias

### Ejemplo Real
```
Búsqueda: "FORM_CONTABILIDAD"
Resultados: 8 sesiones

Sesiones problemáticas identificadas:
1. SID: 123, Usuario: USUARIO1, Tiempo: 03:45:12
2. SID: 156, Usuario: USUARIO2, Tiempo: 02:30:00

Acción: Desconectar ambas sesiones
Resultado: Las otras 6 sesiones siguen funcionando
```

---

## 💻 Escenario 3: Mismo Usuario, Múltiples Computadoras

### Situación
Un usuario se conectó desde varias máquinas y tiene muchas sesiones.

### Pasos a Seguir

1. **Buscar al usuario**
   - Tabla "Resumen por Usuario"
   - Click en "Ver Sesiones"

2. **Identificar las máquinas**
   - Ver la columna "Máquina"
   - Ejemplo: PC-OFICINA, PC-CASA, LAPTOP-01

3. **Preguntar al usuario**
   - ¿Desde qué computadora estás trabajando ahora?
   - Ejemplo: "Estoy en PC-OFICINA"

4. **Desconectar las demás**
   - Desconectar las sesiones de PC-CASA y LAPTOP-01
   - Mantener las de PC-OFICINA

### Ejemplo Real
```
Usuario: MGARCIA
Sesiones: 6

Desglose por máquina:
- PC-OFICINA: 2 sesiones (mantener)
- PC-CASA: 2 sesiones (desconectar)
- LAPTOP-01: 2 sesiones (desconectar)

Acción: Desconectar 4 sesiones
Resultado: El usuario sigue trabajando en PC-OFICINA
```

---

## 📊 Escenario 4: Análisis de SQL Problemático

### Situación
Quieres identificar qué SQL está consumiendo más recursos.

### Pasos a Seguir

1. **Ver sesiones activas**
   - La tabla ya está ordenada por tiempo activo (mayor a menor)

2. **Revisar las primeras filas**
   - Las sesiones con más tiempo suelen ser las problemáticas

3. **Click en el SQL**
   - Ver el texto completo del SQL
   - Copiar el SQL con el botón "Copiar"

4. **Analizar fuera de la aplicación**
   - Pegar el SQL en SQL Developer o similar
   - Ejecutar EXPLAIN PLAN
   - Identificar el problema (índices faltantes, joins mal hechos, etc.)

5. **Solución inmediata**
   - Desconectar la sesión problemática
   - Notificar al desarrollador para optimizar el SQL

### Ejemplo Real
```
Sesión: SID 178
Tiempo: 04:30:00
SQL: SELECT * FROM pedidos p, clientes c, productos pr 
     WHERE p.cliente_id = c.id 
     AND p.producto_id = pr.id
     AND p.fecha > '2024-01-01'
     (Sin índices, full table scan)

Acción: 
1. Copiar el SQL
2. Desconectar la sesión
3. Crear ticket para el desarrollador
4. Recomendar crear índices
```

---

## 🔧 Escenario 5: Mantenimiento Programado

### Situación
Necesitas realizar mantenimiento y quieres desconectar usuarios de forma controlada.

### Pasos a Seguir

1. **Ver estadísticas**
   - Tarjeta "Usuarios Únicos"
   - Tarjeta "Total Sesiones"

2. **Identificar usuarios activos**
   - Tabla "Resumen por Usuario"
   - Anotar todos los usuarios conectados

3. **Notificar a los usuarios**
   - Llamar o enviar mensaje a cada usuario
   - Ejemplo: "En 10 minutos vamos a desconectar tu sesión para mantenimiento"

4. **Esperar confirmación**
   - Que los usuarios guarden su trabajo

5. **Desconectar de forma ordenada**
   - Usuario por usuario
   - Verificar después de cada desconexión

### Ejemplo Real
```
Mantenimiento programado: 22:00

21:50 - Revisar dashboard:
  - 5 usuarios conectados
  - 12 sesiones totales

21:51 - Notificar usuarios:
  ✓ USUARIO1 (3 sesiones)
  ✓ USUARIO2 (4 sesiones)
  ✓ USUARIO3 (2 sesiones)
  ✓ USUARIO4 (2 sesiones)
  ✓ USUARIO5 (1 sesión)

22:00 - Desconectar:
  1. USUARIO1 - 3 sesiones desconectadas
  2. USUARIO2 - 4 sesiones desconectadas
  (y así sucesivamente)

22:05 - Verificar:
  ✓ 0 sesiones activas
  ✓ Mantenimiento puede proceder
```

---

## 🚨 Escenario 6: Sesión Bloqueada (Deadlock)

### Situación
La tarjeta muestra "Sesiones Bloqueadas: 2"

### Pasos a Seguir

1. **Ver las sesiones activas**
   - Buscar en la tabla sesiones con tiempo alto

2. **Identificar el bloqueador**
   - Una sesión está esperando por otra
   - Revisar el campo `blocking_session` (en el JSON de respuesta)

3. **Analizar el SQL**
   - Ver qué SQL está ejecutando cada sesión
   - Identificar conflictos (UPDATE/DELETE en las mismas tablas)

4. **Decidir qué desconectar**
   - Generalmente, la sesión bloqueadora
   - O la sesión con el SQL menos importante

### Ejemplo Real
```
Sesiones bloqueadas detectadas: 2

Sesión 1 (Bloqueada):
  - SID: 234
  - Usuario: USUARIO_A
  - SQL: UPDATE pedidos SET estado = 'P' WHERE id = 100
  - Esperando por sesión 189

Sesión 2 (Bloqueadora):
  - SID: 189
  - Usuario: USUARIO_B
  - SQL: UPDATE pedidos SET cantidad = 5 WHERE id = 100
  - Tiempo: 00:15:30 (hace 15 min que no responde)

Acción: Desconectar sesión 189 (bloqueadora)
Resultado: Sesión 234 puede continuar
```

---

## 🎯 Escenario 7: Usuario con Sesión Fantasma

### Situación
Un usuario dice "no puedo entrar porque ya estoy conectado", pero él cerró su sesión.

### Pasos a Seguir

1. **Buscar al usuario**
   - Filtro "Por Usuario" o buscar en la tabla

2. **Ver sus sesiones**
   - Identificar sesiones antiguas
   - Ver la hora de login (logon_time)

3. **Confirmar con el usuario**
   - "¿Estás conectado desde PC-OFICINA?"
   - Si dice "No", es una sesión fantasma

4. **Desconectar la sesión fantasma**
   - El usuario podrá conectarse nuevamente

### Ejemplo Real
```
Usuario: LRODRIGUEZ reporta problema

Dashboard muestra:
- Usuario: LRODRIGUEZ
- Sesiones: 1
- Máquina: PC-ALMACEN
- Login: 06/11/2025 08:00 AM (hace 6 horas)
- Estado: INACTIVE
- Programa: forms.exe

Usuario confirma: "Yo estoy en PC-VENTAS, no en PC-ALMACEN"

Acción: Desconectar sesión de PC-ALMACEN
Resultado: Usuario puede conectarse desde PC-VENTAS
```

---

## 📈 Escenario 8: Monitoreo Preventivo

### Situación
Quieres evitar problemas antes de que ocurran.

### Rutina Recomendada

**Cada mañana (9:00 AM):**
1. Abrir dashboard
2. Revisar estadísticas generales
3. Anotar números base

**Cada 2 horas:**
1. Refrescar dashboard
2. Buscar sesiones con tiempo > 2 horas
3. Investigar proactivamente

**Antes de cerrar (6:00 PM):**
1. Verificar sesiones abiertas
2. Contactar usuarios si es necesario
3. Planificar desconexiones si corresponde

### Métricas a Vigilar
```
⚠️ ALERTA SI:
- Sesiones activas > 50
- Sesión individual > 02:00:00
- Sesiones bloqueadas > 0
- Usuario único con > 5 sesiones

✅ NORMAL SI:
- Sesiones activas: 10-30
- Tiempo promedio: < 00:30:00
- Sin sesiones bloqueadas
- Usuarios con 1-3 sesiones
```

---

## 🔑 Consejos Prácticos

### 1. Antes de Desconectar
✓ Verifica la información completa
✓ Confirma el módulo/formulario
✓ Revisa el tiempo activo
✓ Si es posible, contacta al usuario primero

### 2. Después de Desconectar
✓ Espera 5-10 segundos
✓ Refresca el dashboard
✓ Verifica que la sesión desapareció
✓ Confirma con el usuario que puede reconectarse

### 3. Documentación
✓ Anota qué sesiones desconectaste
✓ Anota el motivo
✓ Anota la hora
✓ Mantén un log para auditoría

### 4. Comunicación
✓ Siempre intenta contactar al usuario primero
✓ Explica por qué necesitas desconectar
✓ Avisa cuándo puede reconectarse
✓ Agradece la comprensión

---

## 📝 Plantilla de Reporte

Usa esta plantilla para documentar las desconexiones:

```
REPORTE DE DESCONEXIÓN DE SESIÓN

Fecha: _______________
Hora: _______________
Técnico: _______________

INFORMACIÓN DE LA SESIÓN:
- Usuario Oracle: _______________
- SID: _______________
- Serial#: _______________
- Máquina: _______________
- Módulo: _______________
- Tiempo activo: _______________

MOTIVO:
[ ] Sesión colgada
[ ] SQL problemático
[ ] Mantenimiento
[ ] Solicitud del usuario
[ ] Sesión fantasma
[ ] Otro: _______________

SQL EN EJECUCIÓN:
_______________
_______________

ACCIONES TOMADAS:
1. _______________
2. _______________
3. _______________

RESULTADO:
[ ] Exitoso - Usuario pudo reconectarse
[ ] Exitoso - Problema resuelto
[ ] Parcial - Requiere seguimiento
[ ] Fallido - Problema persiste

NOTAS ADICIONALES:
_______________
_______________

FIRMA: _______________
```

---

## 🆘 Casos de Emergencia

### Si el Dashboard No Carga
```powershell
# 1. Verificar que el servidor esté corriendo
# Buscar la ventana de PowerShell con npm start

# 2. Si no está corriendo, iniciarlo
cd c:\Users\soporte\Desktop\app
npm start

# 3. Verificar conexión a BD
# El output debe mostrar:
# ✓ Conexión exitosa a Oracle Database
```

### Si No Puedes Desconectar una Sesión
```sql
-- Conectarte directamente a SQL Developer o SQLcl
-- Ejecutar manualmente:
ALTER SYSTEM DISCONNECT SESSION 'sid, serial#' IMMEDIATE;

-- Ejemplo:
ALTER SYSTEM DISCONNECT SESSION '123, 45678' IMMEDIATE;
```

### Si Necesitas Ver Sesiones Desde SQL
```sql
-- Consulta rápida:
SELECT sid, serial#, username, osuser, machine, module, status, last_call_et
FROM v$session
WHERE type = 'USER'
  AND status = 'ACTIVE'
ORDER BY last_call_et DESC;
```

---

**Tip Final**: Usa el dashboard como primera herramienta de diagnóstico. Es más rápido y visual que consultas SQL directas. Solo usa SQL directo en emergencias donde el dashboard no esté disponible.
