# Guía de Uso Rápido - Oracle Session Manager

## 🚀 Inicio Rápido

1. Abre PowerShell en esta carpeta
2. Ejecuta: `npm start`
3. Abre tu navegador en: http://localhost:3000

## 📱 Funcionalidades Principales

### Ver Sesiones Activas
- El dashboard muestra automáticamente todas las sesiones activas
- Se actualiza cada 30 segundos
- Puedes actualizar manualmente con el botón "🔄 Actualizar"

### Filtrar Sesiones
1. **Por Usuario**: Selecciona un usuario del menú desplegable
2. **Por Estado**: Filtra por ACTIVE o INACTIVE
3. **Búsqueda**: Escribe cualquier texto para buscar en módulo, programa o máquina

### Desconectar una Sesión
1. Localiza la sesión en la tabla
2. Click en el botón rojo "🔌 Desconectar"
3. Revisa la información de la sesión en el modal
4. Confirma la desconexión

⚠️ **IMPORTANTE**: Solo se desconectará esa sesión específica, otras sesiones del mismo usuario NO serán afectadas.

### Ver SQL en Ejecución
1. Click en el texto SQL truncado (muestra "...")
2. Se abrirá un modal con el SQL completo
3. Puedes copiar el SQL con el botón "📋 Copiar SQL"

### Identificar Problemas
- **Módulo**: Identifica si el problema viene de un formulario específico
- **Tiempo Activo**: Las sesiones con mucho tiempo pueden estar bloqueadas
- **Sesiones Bloqueadas**: La estadística muestra cuántas sesiones están bloqueadas

## 📊 Información en el Dashboard

### Tarjetas de Estadísticas
- **Total Sesiones**: Todas las sesiones de usuario en la BD
- **Sesiones Activas**: Sesiones ejecutando SQL actualmente
- **Sesiones Inactivas**: Sesiones conectadas pero sin actividad
- **Usuarios Únicos**: Cantidad de usuarios diferentes conectados
- **Sesiones Bloqueadas**: Sesiones esperando por otra sesión

### Tabla de Resumen por Usuario
- Muestra cuántas sesiones tiene cada usuario
- Primer login del usuario
- Tiempo máximo de última llamada
- Botón para filtrar y ver solo las sesiones de ese usuario

### Tabla de Sesiones Activas
Columnas principales:
- **SID/Serial#**: Identificadores únicos de la sesión
- **Usuario**: Usuario de Oracle Database
- **Usuario SO**: Usuario del sistema operativo
- **Estado**: ACTIVE o INACTIVE
- **Módulo**: Formulario o aplicación origen
- **Tiempo Activo**: Cuánto tiempo lleva ejecutándose
- **SQL**: Consulta que está ejecutando

## 🔧 Comandos SQL Generados

Cuando desconectas una sesión, el sistema ejecuta:
```sql
ALTER SYSTEM DISCONNECT SESSION 'sid, serial#' IMMEDIATE;
```

Este comando:
- ✅ Desconecta SOLO la sesión especificada
- ✅ Es inmediato (no espera a que termine el SQL)
- ✅ NO afecta otras sesiones del mismo usuario
- ⚠️ Requiere privilegios de DBA

## 💡 Consejos de Uso

### Para Identificar Sesiones Problemáticas
1. Ordena por "Tiempo Activo" (ya viene ordenado por defecto)
2. Las sesiones con más tiempo pueden estar colgadas
3. Revisa el módulo para identificar el formulario problemático
4. Verifica el SQL que está ejecutando

### Para Gestionar Múltiples Sesiones de un Usuario
1. Ve a la tabla "Resumen por Usuario"
2. Click en "👁️ Ver Sesiones" del usuario deseado
3. Se filtrará la tabla mostrando solo sus sesiones
4. Desconecta la sesión problemática sin afectar las demás

### Para Buscar Sesiones Específicas
1. Usa el campo "Buscar"
2. Puedes buscar por:
   - Nombre del módulo (ej: "FORM123")
   - Programa (ej: "forms.exe")
   - Máquina (ej: "PC-USUARIO")
   - Usuario del SO

## 🔄 Auto-Refresh

- La aplicación se actualiza automáticamente cada 30 segundos
- No necesitas recargar la página manualmente
- Si haces cambios (como desconectar una sesión), espera unos segundos o usa el botón "Actualizar"

## ⚠️ Precauciones

- Siempre verifica la información antes de desconectar
- Confirma que es la sesión correcta (SID + Serial#)
- Considera contactar al usuario antes de desconectar
- En producción, documenta las desconexiones realizadas

## 🐛 Si Algo No Funciona

1. Verifica que el servidor esté corriendo (PowerShell debe estar activo)
2. Revisa que puedas conectarte a la base de datos
3. Confirma que tienes permisos de DBA
4. Chequea la consola del navegador (F12) para errores

## 📞 Información de Conexión Actual

- **Base de Datos**: rac-scan.tupisa.com.py:1521/tupi
- **Usuario**: LDRIOS
- **Puerto del Servidor**: 3000

---

Para más información, consulta el archivo README.md
