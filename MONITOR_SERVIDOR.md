# 📊 Monitor del Servidor Oracle - Documentación

## ✅ Implementación Completada

Se ha agregado un módulo completo de monitoreo del servidor Oracle con gráficos en tiempo real.

---

## 🎯 Características

### 📈 Gráficos en Tiempo Real

1. **Uso de CPU**
   - Gráfico tipo dona (doughnut)
   - Muestra porcentaje de CPU utilizado vs disponible
   - Actualización cada 10 segundos

2. **Uso de Memoria**
   - Gráfico de barras
   - Muestra SGA y PGA en GB
   - Valores en tiempo real

3. **Sesiones por Estado**
   - Gráfico tipo pie (pastel)
   - Sesiones activas vs inactivas
   - Totales actualizados

4. **Tablespaces**
   - Gráfico de barras horizontal
   - Top 5 tablespaces por uso
   - Código de colores:
     - 🔴 Rojo: ≥ 90% utilizado
     - 🟡 Amarillo: ≥ 75% utilizado
     - 🟢 Verde: < 75% utilizado

5. **Top Wait Events**
   - Gráfico de barras horizontal
   - Top 5 eventos de espera
   - Tiempo total de espera en segundos

6. **Actividad SQL**
   - Gráfico de línea temporal
   - Ejecuciones SQL en los últimos 5 minutos
   - Histórico de los últimos 20 puntos

---

## 🚀 Acceso

### Desde el Dashboard Principal

1. Abre el dashboard: `http://localhost:3000`
2. Haz clic en el botón **"📊 Monitor del Servidor"** en el header
3. Se abrirá la página de monitoreo

### Acceso Directo

Navega a: `http://localhost:3000/monitor.html`

---

## 📊 Métricas Mostradas

### Tarjetas de Resumen Rápido

En la parte superior se muestran 4 métricas clave:

1. **CPU Utilizado**: Porcentaje de uso del CPU del host
2. **Memoria SGA**: GB utilizados del System Global Area
3. **Memoria PGA**: GB utilizados del Program Global Area
4. **Sesiones Activas**: Número actual de sesiones activas

---

## 🔄 Actualización

### Auto-refresh
- **Intervalo**: 10 segundos
- **Automático**: Todas las métricas se actualizan sin intervención

### Manual
- Botón **"🔄 Actualizar"** en el header
- Actualiza todas las métricas inmediatamente

---

## 🗂️ Archivos Creados

1. **Frontend:**
   - `src/public/monitor.html` - Página HTML del monitor
   - `src/public/monitor.js` - Lógica JavaScript y gráficos

2. **Backend:**
   - `src/controllers/monitorController.js` - Controlador de métricas
   - `src/routes/monitorRoutes.js` - Rutas del monitor

3. **Modificados:**
   - `src/server.js` - Agregada ruta `/api/monitor`
   - `src/public/index.html` - Agregado botón "Monitor del Servidor"

---

## 🔌 API Endpoint

### GET /api/monitor/metrics

Retorna todas las métricas del servidor en formato JSON.

**Respuesta:**
```json
{
  "success": true,
  "metrics": {
    "cpu": {
      "used_percent": 45.2
    },
    "memory": {
      "sga_used_gb": 2.5,
      "pga_used_gb": 1.3
    },
    "sessions": {
      "active": 15,
      "inactive": 23,
      "total": 38
    },
    "tablespaces": [
      {
        "name": "USERS",
        "percent_used": 85.5,
        "total_gb": 10.0,
        "used_gb": 8.55
      }
    ],
    "wait_events": [
      {
        "event": "db file sequential read",
        "time_waited_seconds": 125.3,
        "total_waits": 1500
      }
    ],
    "sql_activity": {
      "executions": 250,
      "avg_elapsed_seconds": 0.15
    }
  },
  "timestamp": "2025-11-06T12:30:45.123Z"
}
```

---

## 📚 Bibliotecas Utilizadas

### Chart.js 4.4.0
- **CDN**: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
- **Licencia**: MIT
- **Documentación**: https://www.chartjs.org/

**Tipos de gráficos usados:**
- Doughnut (Dona)
- Bar (Barras)
- Pie (Pastel)
- Line (Línea)

---

## ⚙️ Consultas SQL Utilizadas

### CPU
```sql
SELECT VALUE as cpu_used_percent
FROM V$SYSMETRIC
WHERE METRIC_NAME = 'Host CPU Utilization (%)'
  AND INTSIZE_CSEC = (SELECT MAX(INTSIZE_CSEC) FROM V$SYSMETRIC)
```

### Memoria
```sql
SELECT 
    ROUND(SUM(CASE WHEN name LIKE '%SGA%' THEN value ELSE 0 END) / 1024 / 1024 / 1024, 2) as sga_used_gb,
    ROUND(SUM(CASE WHEN name LIKE '%PGA%' THEN value ELSE 0 END) / 1024 / 1024 / 1024, 2) as pga_used_gb
FROM V$SYSSTAT
```

### Tablespaces
```sql
SELECT 
    df.tablespace_name as name,
    ROUND((df.total_space - NVL(fs.free_space, 0)) / df.total_space * 100, 2) as percent_used
FROM dba_data_files df
LEFT JOIN dba_free_space fs ON df.tablespace_name = fs.tablespace_name
ORDER BY percent_used DESC
```

---

## 🎨 Personalización

### Cambiar Intervalo de Actualización

En `monitor.js`, línea 9:
```javascript
// Cambiar de 10000 (10 seg) a otro valor en milisegundos
setInterval(loadMetrics, 10000);
```

### Cambiar Colores de los Gráficos

En `monitor.js`, busca `backgroundColor` en cada gráfico:
```javascript
backgroundColor: ['#ef4444', '#e2e8f0']  // Rojo y gris
```

### Agregar Más Métricas

1. Agregar consulta SQL en `monitorController.js`
2. Agregar gráfico en `monitor.html`
3. Inicializar gráfico en `monitor.js`
4. Actualizar datos en función `updateMetrics()`

---

## 📋 Requisitos de Permisos Oracle

El usuario debe tener permisos para consultar:

- `V$SYSMETRIC` - Métricas del sistema
- `V$SYSSTAT` - Estadísticas del sistema
- `V$SESSION` - Sesiones activas
- `DBA_DATA_FILES` - Archivos de datos
- `DBA_FREE_SPACE` - Espacio libre
- `V$SYSTEM_EVENT` - Eventos de espera
- `V$SQL` - SQL en cache

**Otorgar permisos:**
```sql
GRANT SELECT ON V$SYSMETRIC TO usuario;
GRANT SELECT ON V$SYSSTAT TO usuario;
GRANT SELECT ON V$SESSION TO usuario;
GRANT SELECT ON DBA_DATA_FILES TO usuario;
GRANT SELECT ON DBA_FREE_SPACE TO usuario;
GRANT SELECT ON V$SYSTEM_EVENT TO usuario;
GRANT SELECT ON V$SQL TO usuario;
```

---

## 🐛 Troubleshooting

### Error: "ORA-00942: table or view does not exist"
**Causa:** El usuario no tiene permisos sobre las vistas V$ o DBA_*  
**Solución:** Otorgar permisos necesarios (ver sección anterior)

### Gráficos no se actualizan
**Causa:** Error en la conexión a la API  
**Solución:** 
1. Verificar que el servidor esté corriendo
2. Abrir consola del navegador (F12) y revisar errores
3. Verificar endpoint: `http://localhost:3000/api/monitor/metrics`

### Valores en 0 o "-"
**Causa:** Consulta SQL retorna NULL o error  
**Solución:**
1. Ejecutar consultas manualmente en SQL*Plus
2. Verificar permisos del usuario
3. Revisar logs del servidor

---

## ✅ Ventajas del Monitor

1. **Visibilidad**: Ver estado del servidor de un vistazo
2. **Tiempo Real**: Actualización automática cada 10 segundos
3. **Histórico**: Gráfico de actividad SQL muestra tendencias
4. **Alertas Visuales**: Colores indican niveles críticos (tablespaces)
5. **Integrado**: No requiere herramientas externas
6. **Responsive**: Se adapta a diferentes tamaños de pantalla

---

## 🔮 Mejoras Futuras Opcionales

1. **Alertas**: Notificaciones cuando métricas superen umbrales
2. **Histórico Completo**: Guardar métricas en base de datos
3. **Exportar Datos**: Descargar gráficos como imagen o PDF
4. **Comparación**: Ver métricas de diferentes períodos
5. **Más Métricas**: I/O, Network, Lock contention, etc.
6. **Dashboards Personalizados**: Permitir elegir qué gráficos ver

---

**Implementado:** 6 de Noviembre de 2025  
**Estado:** ✅ Operativo y Funcionando  
**Acceso:** http://localhost:3000/monitor.html
