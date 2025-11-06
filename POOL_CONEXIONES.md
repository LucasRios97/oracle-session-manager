# 🔌 Pool de Conexiones Oracle - Documentación

## ✅ Implementación Completada

Se ha implementado un **pool de conexiones** de Oracle para mejorar el rendimiento y evitar saturar la base de datos.

---

## 🎯 Beneficios del Pool de Conexiones

### Antes (Sin Pool)
- ❌ Cada petición creaba una nueva conexión
- ❌ Cada conexión se cerraba después de usarse
- ❌ Alto overhead de creación/destrucción de conexiones
- ❌ Posible saturación de la base de datos con muchas peticiones
- ❌ Tiempo de respuesta más lento

### Ahora (Con Pool)
- ✅ Conexiones reutilizadas eficientemente
- ✅ Conexiones mantienen sesión abierta
- ✅ Reducción dramática del overhead
- ✅ Protección contra saturación (límite máximo de conexiones)
- ✅ Respuestas más rápidas
- ✅ Mejor uso de recursos del servidor

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Configuración del Pool de Conexiones
POOL_MIN=2          # Mínimo de conexiones siempre activas
POOL_MAX=10         # Máximo de conexiones permitidas
POOL_INCREMENT=2    # Cuántas conexiones crear cuando se necesitan más
```

### Parámetros Explicados

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **POOL_MIN** | 2 | Número mínimo de conexiones que siempre estarán abiertas, incluso sin uso |
| **POOL_MAX** | 10 | Número máximo de conexiones simultáneas permitidas |
| **POOL_INCREMENT** | 2 | Cuántas conexiones nuevas crear cuando el pool necesita más |
| **poolTimeout** | 60 seg | Tiempo que una conexión puede estar inactiva antes de cerrarse |
| **queueTimeout** | 60 seg | Tiempo máximo que una petición esperará por una conexión disponible |

---

## 📊 Cómo Funciona

### Ciclo de Vida del Pool

1. **Inicio del Servidor**
   ```
   ✓ Pool de conexiones creado exitosamente
     - Conexiones mínimas: 2
     - Conexiones máximas: 10
   ```
   - Se crean 2 conexiones iniciales (POOL_MIN)
   - Quedan listas para ser usadas

2. **Petición Entrante**
   - La aplicación solicita una conexión del pool
   - Si hay conexiones disponibles → Se asigna inmediatamente
   - Si no hay disponibles pero < POOL_MAX → Se crean nuevas (incremento de 2)
   - Si se alcanzó POOL_MAX → La petición espera en cola

3. **Después de Usar la Conexión**
   - La conexión se **devuelve al pool** (no se cierra)
   - Queda disponible para la siguiente petición
   - Se reutiliza, ahorrando tiempo

4. **Mantenimiento Automático**
   - Conexiones inactivas > 60 seg → Se cierran automáticamente
   - El pool mantiene siempre al menos POOL_MIN conexiones

5. **Cierre del Servidor**
   ```
   ⚠️  Cerrando servidor...
   ✓ Pool de conexiones cerrado
   ```
   - Se cierran todas las conexiones limpiamente
   - Se libera memoria

---

## 📈 Estadísticas del Pool

### Endpoint Nuevo

```
GET /api/pool-stats
```

**Respuesta:**
```json
{
  "success": true,
  "statistics": {
    "connectionsInUse": 3,      // Conexiones actualmente en uso
    "connectionsOpen": 5,       // Conexiones totales abiertas
    "poolMin": 2,               // Configuración mínima
    "poolMax": 10,              // Configuración máxima
    "poolIncrement": 2,         // Incremento configurado
    "poolTimeout": 60,          // Timeout de inactividad
    "queueMax": 500,            // Máximo en cola
    "queueTimeout": 60000       // Timeout de cola (ms)
  }
}
```

### Monitorear el Pool

**PowerShell:**
```powershell
# Ver estadísticas en tiempo real
Invoke-RestMethod -Uri "http://localhost:3000/api/pool-stats" | ConvertTo-Json

# Monitoreo continuo cada 5 segundos
while($true) {
    Clear-Host
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/pool-stats"
    Write-Host "=== POOL DE CONEXIONES ===" -ForegroundColor Green
    Write-Host "En uso: $($stats.statistics.connectionsInUse)"
    Write-Host "Abiertas: $($stats.statistics.connectionsOpen)"
    Write-Host "Mínimo: $($stats.statistics.poolMin)"
    Write-Host "Máximo: $($stats.statistics.poolMax)"
    Start-Sleep -Seconds 5
}
```

---

## 🔧 Ajuste de Parámetros

### Escenarios Recomendados

#### Uso Bajo (1-5 usuarios)
```env
POOL_MIN=2
POOL_MAX=5
POOL_INCREMENT=1
```
- Configuración ligera
- Mínimo uso de recursos

#### Uso Medio (5-20 usuarios)
```env
POOL_MIN=3
POOL_MAX=10
POOL_INCREMENT=2
```
- **Configuración actual (recomendada)**
- Balance entre recursos y rendimiento

#### Uso Alto (20-50 usuarios)
```env
POOL_MIN=5
POOL_MAX=20
POOL_INCREMENT=3
```
- Mayor capacidad
- Más conexiones disponibles

#### Uso Muy Alto (50+ usuarios)
```env
POOL_MIN=10
POOL_MAX=30
POOL_INCREMENT=5
```
- Máxima capacidad
- Requiere validar límites en Oracle

---

## ⚠️ Consideraciones Importantes

### Límites de Oracle

1. **Procesos máximos en Oracle**
   ```sql
   -- Verificar límite actual
   SELECT name, value 
   FROM v$parameter 
   WHERE name = 'processes';
   ```
   - El POOL_MAX no debe exceder el límite de procesos de Oracle
   - Dejar margen para otras aplicaciones

2. **Sesiones máximas**
   ```sql
   -- Verificar sesiones configuradas
   SELECT name, value 
   FROM v$parameter 
   WHERE name = 'sessions';
   ```

### Mejores Prácticas

✅ **SÍ hacer:**
- Ajustar POOL_MAX según la carga esperada
- Monitorear estadísticas del pool regularmente
- Mantener POOL_MIN bajo para ahorrar recursos
- Usar POOL_INCREMENT moderado (2-3)

❌ **NO hacer:**
- Configurar POOL_MAX muy alto sin verificar límites de Oracle
- Usar POOL_MIN muy alto innecesariamente
- Ignorar los logs de pool lleno

---

## 🚨 Troubleshooting

### Problema: "Pool is closing"
**Causa:** Se intentó obtener una conexión mientras el servidor se está cerrando  
**Solución:** Normal durante el shutdown, no requiere acción

### Problema: "Connection timeout"
**Causa:** Todas las conexiones están en uso y se superó el queueTimeout  
**Solución:** 
1. Aumentar POOL_MAX
2. Aumentar queueTimeout
3. Optimizar consultas lentas

### Problema: "ORA-00020: maximum number of processes exceeded"
**Causa:** Se alcanzó el límite de procesos en Oracle  
**Solución:**
1. Reducir POOL_MAX
2. Contactar DBA para aumentar límite en Oracle

### Problema: Muchas conexiones inactivas
**Causa:** poolTimeout muy alto  
**Solución:** Reducir poolTimeout en database.js

---

## 📊 Comparativa de Rendimiento

### Sin Pool (Antes)
```
Petición 1: Crear conexión (500ms) + Query (100ms) + Cerrar (100ms) = 700ms
Petición 2: Crear conexión (500ms) + Query (100ms) + Cerrar (100ms) = 700ms
Petición 3: Crear conexión (500ms) + Query (100ms) + Cerrar (100ms) = 700ms
Total: 2100ms para 3 peticiones
```

### Con Pool (Ahora)
```
Petición 1: Pool existe (0ms) + Query (100ms) = 100ms
Petición 2: Reusar conexión (0ms) + Query (100ms) = 100ms
Petición 3: Reusar conexión (0ms) + Query (100ms) = 100ms
Total: 300ms para 3 peticiones
```

**Mejora: 7x más rápido** ⚡

---

## 🔍 Logs del Servidor

### Inicio Normal
```
✓ Pool de conexiones creado exitosamente
  - Conexiones mínimas: 2
  - Conexiones máximas: 10
╔════════════════════════════════════════════════════════╗
║  Oracle Session Manager                                ║
╠════════════════════════════════════════════════════════╣
║  Servidor corriendo en: http://localhost:3000       ║
```

### Cierre Normal
```
⚠️  Cerrando servidor...
✓ Pool de conexiones cerrado
```

---

## 📝 Código Clave

### Obtener Conexión
```javascript
// Antes
const connection = await oracledb.getConnection(config);

// Ahora
const connection = await pool.getConnection();
```

### Devolver Conexión
```javascript
// Antes
await connection.close(); // Cerraba la conexión

// Ahora
await connection.close(); // Devuelve al pool (no cierra realmente)
```

---

## ✅ Resumen

| Aspecto | Implementación |
|---------|----------------|
| **Pool Mínimo** | 2 conexiones |
| **Pool Máximo** | 10 conexiones |
| **Incremento** | 2 conexiones |
| **Timeout Inactividad** | 60 segundos |
| **Timeout Cola** | 60 segundos |
| **Estadísticas** | Habilitadas |
| **Endpoint Stats** | `/api/pool-stats` |
| **Cierre Limpio** | Automático con SIGINT/SIGTERM |

---

## 🎓 Próximos Pasos Opcionales

Si en el futuro necesitas más optimización:

1. **Pool por Rol**: Crear pools separados para consultas y modificaciones
2. **Pool Prioritario**: Dar prioridad a ciertas peticiones
3. **Monitoring Avanzado**: Integrar con Prometheus/Grafana
4. **Alertas**: Notificar cuando el pool esté al 80% de capacidad
5. **Auto-scaling**: Ajustar POOL_MAX automáticamente según carga

---

**Implementado:** 6 de Noviembre de 2025  
**Estado:** ✅ Operativo y Funcionando
