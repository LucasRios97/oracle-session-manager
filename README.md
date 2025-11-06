# 🗄️ Oracle Session Manager

Aplicación web completa para administrar, monitorear y analizar sesiones de Oracle Database 12c en tiempo real.

## ✨ Características Principales

### 📊 Dashboard Completo
- **Estadísticas en tiempo real**: Total de sesiones, activas, inactivas, usuarios únicos y sesiones bloqueadas
- **Resumen por usuario**: Cantidad de sesiones (solo usuarios con 10+ sesiones)
- **Auto-refresh**: Actualización automática cada 15 segundos
- **Botones de actualización manual**: Refresh total o solo sesiones

### 👥 Gestión de Sesiones
- **Ver todas las sesiones**: Activas e inactivas en una misma vista
- **Desconexión individual**: Cierra sesiones sin afectar otras del mismo usuario
- **Información detallada**: SID, Serial, Usuario, Máquina, Módulo, Programa, Proceso
- **Filtros avanzados**: Por usuario, estado (ACTIVE/INACTIVE) y búsqueda de texto
- **Sin duplicados**: Una línea por combinación SID + Serial

### � Visualización de SQL
- **Modal de SQL completo**: Ver el SQL ejecutándose en cada sesión
- **Copiar al portapapeles**: Botón para copiar SQL fácilmente
- **Información contextual**: SQL ID, Usuario, Módulo, Programa y Proceso

### 📊 Monitor del Servidor
- **6 gráficos en tiempo real**:
  - 💻 Uso de CPU
  - 🧠 Memoria SGA/PGA
  - 👥 Sesiones por estado
  - � Top 5 Tablespaces (con alertas de color)
  - ⏱️ Top 5 Wait Events
  - 📈 Actividad SQL (últimos 5 min)
- **Actualización automática**: Cada 10 segundos
- **Métricas rápidas**: CPU, SGA, PGA y sesiones en tarjetas

### 🔒 Pool de Conexiones
- **Conexiones reutilizables**: Evita saturación de la base de datos
- **Configurable**: Min: 2, Max: 10, Incremento: 2
- **Cierre limpio**: Manejo de señales SIGINT/SIGTERM
- **Estadísticas disponibles**: Endpoint `/api/pool-stats`

## 📋 Requisitos

- **Node.js** 14 o superior
- **Oracle Database** 12c
- **Oracle Instant Client** 19.28 (ubicado en `C:\instantclient_19_28`)
- **Permisos Oracle**: SELECT en V$SESSION, V$SQL, V$SYSMETRIC, DBA_DATA_FILES, etc.

## 🔧 Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tu-usuario/oracle-session-manager.git
cd oracle-session-manager
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:
```env
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_CONNECTION_STRING=//ip_servidor:1521/nombre_servicio
POOL_MIN=2
POOL_MAX=10
POOL_INCREMENT=2
PORT=3000
```

4. **Iniciar la aplicación**:
```bash
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

## 📁 Estructura del Proyecto

```
oracle-session-manager/
├── src/
│   ├── config/
│   │   └── database.js              # Pool de conexiones Oracle
│   ├── controllers/
│   │   ├── sessionController.js     # Lógica de sesiones
│   │   └── monitorController.js     # Métricas del servidor
│   ├── routes/
│   │   ├── sessionRoutes.js         # API de sesiones
│   │   └── monitorRoutes.js         # API de monitoreo
│   ├── public/
│   │   ├── index.html               # Dashboard principal
│   │   ├── monitor.html             # Monitor del servidor
│   │   ├── styles.css               # Estilos CSS
│   │   ├── app.js                   # Lógica del dashboard
│   │   └── monitor.js               # Lógica del monitor
│   └── server.js                    # Servidor Express
├── .env                             # Variables de entorno (no incluido)
├── .env.example                     # Ejemplo de configuración
├── .gitignore                       # Archivos a ignorar
├── package.json                     # Dependencias
├── README.md                        # Este archivo
├── RESUMEN.md                       # Resumen del proyecto
├── GUIA_USO.md                      # Guía de uso detallada
├── API_DOCS.md                      # Documentación de API
├── POOL_CONEXIONES.md               # Documentación del pool
├── MONITOR_SERVIDOR.md              # Documentación del monitor
└── CHECKLIST.md                     # Checklist de funcionalidades
```

## 🛣️ API Endpoints

### Sesiones
- `GET /api/statistics` - Estadísticas generales
- `GET /api/sessions` - Todas las sesiones (activas e inactivas)
- `GET /api/sessions/by-user` - Resumen por usuario
- `GET /api/sessions/user/:username` - Sesiones de un usuario específico
- `POST /api/sessions/disconnect` - Desconectar una sesión

### Monitoreo
- `GET /api/monitor/metrics` - Métricas del servidor Oracle

### Pool
- `GET /api/pool-stats` - Estadísticas del pool de conexiones

## 🎨 Características de la Interfaz

- **Diseño moderno**: Gradientes, sombras y animaciones
- **Responsive**: Se adapta a móviles, tablets y desktop
- **Gráficos interactivos**: Usando Chart.js 4.4.0
- **Notificaciones toast**: Feedback visual para el usuario
- **Modales elegantes**: Para confirmaciones y detalles
- **Código de colores**: Verde (activo/OK), Amarillo (inactivo/warning), Rojo (crítico)

## 🔐 Configuración de Permisos Oracle

El usuario debe tener los siguientes permisos:

```sql
-- Permisos para sesiones
GRANT SELECT ON V$SESSION TO tu_usuario;
GRANT SELECT ON V$SQL TO tu_usuario;
GRANT ALTER SYSTEM TO tu_usuario;

-- Permisos para monitoreo
GRANT SELECT ON V$SYSMETRIC TO tu_usuario;
GRANT SELECT ON V$SYSSTAT TO tu_usuario;
GRANT SELECT ON DBA_DATA_FILES TO tu_usuario;
GRANT SELECT ON DBA_FREE_SPACE TO tu_usuario;
GRANT SELECT ON V$SYSTEM_EVENT TO tu_usuario;
```

## 🚀 Uso

### Dashboard Principal
1. Accede a `http://localhost:3000`
2. Visualiza las estadísticas en las tarjetas superiores
3. Revisa el resumen de usuarios (solo con 10+ sesiones)
4. Explora todas las sesiones en la tabla inferior
5. Usa filtros para buscar sesiones específicas

### Desconectar Sesión
1. Haz clic en **"🔌 Desconectar"** en la sesión deseada
2. Revisa la información en el modal de confirmación
3. Confirma la desconexión
4. La sesión será cerrada inmediatamente

### Ver SQL Completo
1. Haz clic en **"📝 Ver SQL"** en cualquier sesión
2. Se abrirá un modal con el SQL completo
3. Haz clic en **"📋 Copiar SQL"** para copiar al portapapeles

### Monitor del Servidor
1. Haz clic en **"📊 Monitor del Servidor"** en el header
2. Observa los 6 gráficos actualizándose cada 10 segundos
3. Revisa las métricas rápidas en la parte superior
4. Usa el botón **"🔄 Actualizar"** para refresh manual

## ⚠️ Advertencias de Seguridad

- ⚠️ Esta aplicación ejecuta `ALTER SYSTEM DISCONNECT SESSION`
- 🔒 Implementa autenticación antes de usar en producción
- 🛡️ El archivo `.env` contiene credenciales sensibles (no lo subas a Git)
- 👥 Restringe el acceso solo a administradores de BD
- 📝 Mantén un log de auditoría de sesiones desconectadas

## 🐛 Solución de Problemas

### Error de conexión a Oracle
```
✓ Verifica Oracle Instant Client en C:\instantclient_19_28
✓ Comprueba credenciales en .env
✓ Asegúrate de que la BD esté accesible
✓ Verifica el puerto 1521 abierto
```

### Error al desconectar sesión
```
✓ Verifica permisos ALTER SYSTEM
✓ La sesión puede ya estar desconectada
✓ Revisa los logs del servidor Node.js
```

### Pool de conexiones lleno
```
✓ Aumenta POOL_MAX en .env
✓ Revisa estadísticas: GET /api/pool-stats
✓ Reinicia el servidor: npm start
```

## 📊 Tecnologías Utilizadas

- **Backend**: Node.js, Express 5.1.0
- **Database Driver**: oracledb 6.10.0
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Gráficos**: Chart.js 4.4.0
- **Configuración**: dotenv 17.2.3

## 📖 Documentación Adicional

- [GUIA_USO.md](GUIA_USO.md) - Guía detallada de uso
- [API_DOCS.md](API_DOCS.md) - Documentación de API
- [POOL_CONEXIONES.md](POOL_CONEXIONES.md) - Pool de conexiones
- [MONITOR_SERVIDOR.md](MONITOR_SERVIDOR.md) - Monitor del servidor
- [EJEMPLOS_USO.md](EJEMPLOS_USO.md) - Ejemplos prácticos

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

Desarrollado para administración profesional de sesiones Oracle Database 12c.

---

⭐ Si te gusta este proyecto, dale una estrella en GitHub!
