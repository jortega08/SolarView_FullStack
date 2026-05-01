# Soleim — Arquitectura y Contexto del Sistema

> Plataforma full-stack de gestión y monitoreo para Smart Grids con integración IoT.
> Stack principal: **Django + Django REST Framework + Channels + Celery + PostgreSQL + Redis + MQTT (Mosquitto) + React (Vite)**.

---

## 1. Contexto de la Aplicación

**Soleim** (anteriormente *SolarView*) es una plataforma B2B/B2C para la **gestión integral de instalaciones de energía solar y redes inteligentes (Smart Grid)**. La aplicación permite a empresas instaladoras y a usuarios finales (domicilios) monitorear en tiempo real el estado de sus sistemas fotovoltaicos: generación, consumo, batería, alertas operativas y reportes de facturación.

El sistema está diseñado para:

- Recibir telemetría continua desde sensores IoT vía **MQTT**.
- Persistir, procesar y analizar la información en un backend **Django** asíncrono.
- Disparar alertas automáticas cuando los parámetros de batería superan umbrales críticos.
- Exponer la data en un **dashboard React** con gráficas, KPIs y reportes descargables (PDF/CSV).
- Operar como SaaS multi-empresa, multi-instalación, con roles y auditoría.

---

## 2. Misión y Visión

### Misión
Democratizar el acceso a la información operativa de los sistemas solares y redes inteligentes, ofreciendo a empresas y usuarios una plataforma confiable, en tiempo real y escalable, que les permita tomar decisiones informadas sobre el uso de su energía, reducir costos y aumentar la eficiencia de sus instalaciones.

### Visión
Convertirse en la plataforma de referencia en Latinoamérica para la gestión inteligente de energía distribuida, integrando IoT, analítica predictiva y experiencia de usuario para acelerar la transición energética.

---

## 3. Enfoque del Proyecto

- **Orientado a eventos y tiempo real**: la telemetría fluye de sensor → MQTT → consumer → API Django → WebSocket (Channels) → dashboard.
- **Multi-tenant operativo**: jerarquía `Empresa → Instalación → Usuarios` con roles por instalación (`admin_empresa`, `operador`, `viewer`), además de `Domicilio` para usuarios residenciales.
- **Asíncrono y escalable**: tareas pesadas (procesamiento de alertas, notificaciones) delegadas a **Celery + Redis**.
- **API-first**: documentación OpenAPI generada con `drf-spectacular` (`/api/docs/`, `/api/redoc/`).
- **Seguridad**: autenticación **JWT** (SimpleJWT) con autenticación personalizada sobre el modelo `core.Usuario`, CORS controlado y auditoría de acciones.
- **Contenerizado**: orquestación completa con **Docker Compose** (8 servicios).

---

## 4. Arquitectura de Alto Nivel

```
┌──────────────────┐      MQTT       ┌──────────────┐      HTTP POST     ┌─────────────────┐
│  IoT Publisher   │ ──────────────► │  Mosquitto   │ ◄────── subscribe ─│  IoT Consumer   │
│  (sensores sim.) │  soleim/battery │   Broker     │                    │  (paho-mqtt)    │
└──────────────────┘                 └──────────────┘                    └────────┬────────┘
                                                                                  │
                                                                                  ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           Django + DRF + Channels (Daphne ASGI)                         │
│                                                                                         │
│   ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │   core   │  │ telemetria │  │  alerta  │  │analitica │  │ empresa  │  │ usuario  │  │
│   └──────────┘  └────────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                              ┌──────────────┐                                           │
│                              │  auditoria   │                                           │
│                              └──────────────┘                                           │
│                                                                                         │
│   REST API  ◄──┐         WebSocket /ws/sensor/<id>/  ◄─────── Channel Layer (Redis)     │
└────────────────┼─────────────────────────────────────────────┬───────────────────────────┘
                 │                                             │
                 ▼                                             ▼
       ┌────────────────────┐                     ┌──────────────────────┐
       │   PostgreSQL 16    │                     │  Celery Worker/Beat  │
       │   (datos op.)      │                     │  (Redis broker)      │
       └────────────────────┘                     └──────────────────────┘
                 ▲
                 │ HTTPS / JWT
                 │
       ┌──────────────────────┐
       │  React 19 + Vite     │
       │  (soleim-front)      │
       │  Dashboard, gráficas │
       └──────────────────────┘
```

---

## 5. Componentes y Servicios (Docker Compose)

| Servicio          | Imagen / Build              | Puerto | Rol                                                              |
|-------------------|-----------------------------|--------|------------------------------------------------------------------|
| `postgres`        | `postgres:16-alpine`        | 5432   | Base de datos principal (`soleim`).                              |
| `redis`           | `redis:7-alpine`            | 6379   | Caché, broker de Celery y Channel Layer (3 DBs lógicas).         |
| `django`          | `./soleimapp` (Daphne ASGI) | 8000   | API REST + WebSocket + admin.                                    |
| `celery-worker`   | `./soleimapp`               | —      | Procesamiento asíncrono (alertas, notificaciones realtime).      |
| `celery-beat`     | `./soleimapp`               | —      | Scheduler de tareas periódicas.                                  |
| `react`           | `./soleim-front` (Vite)     | 5174   | Frontend SPA.                                                    |
| `mosquitto`       | `./iot/mosquitto`           | 1883/9001 | Broker MQTT con autenticación de usuario/contraseña.          |
| `mqtt-publisher`  | `./iot/publisher`           | —      | Simulador de sensores IoT (publica cada 10s).                    |
| `mqtt-consumer`   | `./iot/consumer`            | —      | Suscribe `soleim/battery/#` y reenvía al endpoint Django.        |

---

## 6. Modelo de Datos

El esquema vive principalmente en `soleimapp/core/models.py`, `telemetria/models.py`, `alerta/models.py` y `auditoria/models.py`.

### 6.1 Geografía y Tenancy
- **`Pais`** → **`Estado`** → **`Ciudad`** (jerarquía geográfica).
- **`Empresa`**: `nombre`, `nit (unique)`, `sector`, `ciudad`. Es el tenant principal B2B.
- **`Instalacion`**: pertenece a una `Empresa`. Atributos: `tipo_sistema` (`hibrido | off_grid | grid_tie`), `capacidad_panel_kw`, `capacidad_bateria_kwh`, `estado` (`activa | inactiva | mantenimiento`).

### 6.2 Usuarios y Permisos
- **`Usuario`**: modelo propio (no `auth.User`); `email` único, contraseña hasheada, `rol` (`admin | user`).
- **`Domicilio`**: relación N:1 con `Usuario` y `Ciudad` (caso B2C residencial).
- **`RolInstalacion`**: tabla M:N entre `Usuario` e `Instalacion` con rol (`admin_empresa | operador | viewer`).
- **`ConfiguracionUser`**: preferencias por domicilio/instalación (notificaciones email, prioridad energética: `electrica | solar | auto`, alertas activas).

### 6.3 Telemetría (`telemetria.models`)
- **`Consumo`**: `energia_consumida (kWh)`, `potencia (kW)`, `fuente` (`solar | electrica`), `costo`, `fecha`. Indexado por `(domicilio, fecha)`, `(domicilio, fuente, fecha)` y `fecha`.
- **`Bateria`**: `voltaje`, `corriente`, `temperatura`, `capacidad_bateria`, `porcentaje_carga`, `tiempo_restante`. Métodos `alerta_temperatura()` (>40°C) y `alerta_carga()` (<20%) que generan alertas automáticas.

Ambos modelos pueden asociarse a `Domicilio` o `Instalacion` (contexto dual B2C/B2B).

### 6.4 Alertas (`alerta.models`)
- **`TipoAlerta`**: catálogo (`nombre`, `descripcion`).
- **`Alerta`**: `tipoalerta`, `mensaje`, `estado` (`activa | resuelta | cancelada`), `severidad` (`critica | alta | media | baja`), `causa_probable`, `accion_sugerida`, `resuelta_por` (FK a `Usuario`).

### 6.5 Auditoría (`auditoria.models`)
- **`EventoAuditoria`**: registro de `usuario`, `accion`, `entidad`, `entidad_id`, `detalle (JSON)`, `timestamp`, `ip_address`. Indexado para consultas por entidad y por usuario.

---

## 7. Módulos del Backend (apps Django)

| App         | Responsabilidad                                                                              |
|-------------|----------------------------------------------------------------------------------------------|
| `core`      | Modelos base (geografía, usuario, empresa, instalación, domicilio, roles). ViewSets CRUD.    |
| `telemetria`| Ingesta de datos de sensores, WebSocket consumers, tareas Celery, factura mensual.           |
| `alerta`    | Gestión y consulta de alertas, ViewSet REST.                                                 |
| `analitica` | Endpoints de KPIs, agregaciones (consumo diario/mensual, donut, actividades) con caché.      |
| `usuario`   | Autenticación JWT custom (`/api/auth/login`, `/register`, `/refresh`, `/me`).                |
| `empresa`   | Vistas B2B: panel de empresa, listado/detalle de instalaciones, reportes CSV de consumo y alertas. |
| `auditoria` | Trazabilidad de eventos sensibles del sistema.                                               |

### 7.1 Endpoints destacados

```
# Autenticación
POST  /api/auth/register/
POST  /api/auth/login/
POST  /api/auth/refresh/
GET   /api/auth/me/

# Core (CRUD vía DRF Router)
/api/core/usuarios/  /domicilios/  /paises/  /estados/  /ciudades/  /empresas/  /instalaciones/

# Telemetría
POST  /api/telemetria/registrar_datos/    # ingest del consumer MQTT
GET   /api/telemetria/ver_datos/
GET   /api/factura/mensual/

# Alertas
GET   /api/alertas/ultimas/
/api/alertas/alertas/      (ViewSet)
/api/alertas/tipos-alerta/ (ViewSet)

# Empresa (B2B)
GET   /api/empresa/panel/
GET   /api/empresa/instalaciones/
GET   /api/empresa/instalacion/<pk>/
GET   /api/empresa/reporte/consumo/        # CSV
GET   /api/empresa/reporte/alertas/        # CSV

# WebSocket
ws://.../ws/sensor/<target_id>/

# Documentación
/api/schema/   /api/docs/   /api/redoc/
```

---

## 8. Flujo de Datos en Tiempo Real

1. **`mqtt-publisher`** simula un sensor y publica cada 10s un JSON en `soleim/battery/<instalacion_id>` con: voltaje, corriente, temperatura, % carga, tiempo restante, energía consumida/generada, costo, fuente.
2. **Mosquitto** distribuye el mensaje a los suscriptores autenticados.
3. **`mqtt-consumer`** está suscrito a `soleim/battery/#` y hace `POST /api/telemetria/registrar_datos/` al backend.
4. **Django** persiste `Consumo` y `Bateria`, y dispara:
   - **Celery task** `process_battery_alerts(bateria_id)` → evalúa umbrales y crea `Alerta`s.
   - **Celery task** `notify_realtime_update(...)` → envía vía Channel Layer al grupo `instalacion_<id>` o `domicilio_<id>`.
5. El **frontend React** está conectado por WebSocket a `/ws/sensor/<id>/` y recibe el push para actualizar gráficas y tarjetas sin recargar.

---

## 9. Frontend (`soleim-front`)

**Stack**: React 19, Vite 7, React Router 7, Recharts, Lucide Icons, jsPDF + autotable, date-fns.

### Páginas (`src/pages`)
- `Login.jsx`, `Register.jsx` — autenticación pública.
- `Dashboard` (en `components/Dashboard.jsx`) — vista principal con KPIs, gráficas y batería.
- `InstalacionDetalle.jsx` — vista B2B de una instalación específica.
- `Alertas.jsx` — listado y gestión de alertas.
- `Reportes.jsx` — generación y descarga de reportes (PDF/CSV).
- `Configuracion.jsx` — preferencias del usuario.
- `Domicilios.jsx`, `Users.jsx` — administración.

### Componentes clave (`src/components`)
- `Layout`, `Sidebar`, `Header`, `HeroBanner` — esqueleto de UI.
- `StatsCards`, `ActivitiesChart`, `MonthlyDonutChart`, `BatteryThermometer`, `BatteryInfoCard`, `TodayConsumptionCard` — visualizaciones.
- `Calendar`, `TasksTable`, `FacturaMensual`, `NivelAvatar` — widgets adicionales.
- `PrivateRoute` — guard de rutas autenticadas.
- `context/AuthContext` — estado global de autenticación JWT.

### Routing
Rutas privadas envueltas en `<PrivateRoute><Layout>...</Layout></PrivateRoute>`; rutas públicas: `/login`, `/register`.

---

## 10. Funcionalidades Principales

### Para Usuarios Finales (B2C)
- Registro, login y gestión de perfil.
- Visualización en tiempo real del consumo eléctrico vs. solar.
- Estado de batería: voltaje, temperatura, % carga, autonomía estimada.
- Alertas automáticas (temperatura alta, batería baja) con causa probable y acción sugerida.
- Factura mensual estimada y descarga en PDF.
- Calendario de actividades y donut mensual de consumo.

### Para Empresas (B2B)
- Panel multi-instalación.
- Detalle por instalación con telemetría histórica y en vivo.
- Reportes descargables en CSV (consumo, alertas).
- Roles diferenciados por instalación (`admin_empresa`, `operador`, `viewer`).
- Auditoría de acciones sensibles.

### Operativas / Sistema
- Documentación de API auto-generada (Swagger / ReDoc).
- Caché de agregaciones analíticas en Redis (TTL 30s/300s).
- Escalado horizontal: Daphne (ASGI) + N workers Celery.
- Healthchecks Docker en `postgres`, `redis`, `django`, `mosquitto`.

---

## 11. Seguridad

- **JWT** con `ACCESS_TOKEN_LIFETIME=1h`, `REFRESH_TOKEN_LIFETIME=7d`, rotación habilitada.
- Autenticación custom `usuario.utils.CoreUsuarioJWTAuthentication` sobre el modelo propio `core.Usuario`.
- Hash de contraseñas con `pbkdf2_sha256` por defecto (auto-aplicado en `Usuario.save()`).
- **CORS** restringido a orígenes configurados por env (`CORS_ALLOWED_ORIGINS`).
- MQTT con autenticación usuario/contraseña (`MQTT_USER` / `MQTT_PASS`).
- Variables sensibles vía `.env` (no commiteadas), `SECRET_KEY` y `DEBUG` por entorno.
- Auditoría de eventos para trazabilidad.

---

## 12. Configuración y Despliegue

### Variables de Entorno Clave (`.env`)
```
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_HOST
SECRET_KEY / DEBUG / ALLOWED_HOSTS / CORS_ALLOWED_ORIGINS
REDIS_URL / CELERY_BROKER_URL / CELERY_RESULT_BACKEND
MQTT_USER / MQTT_PASS
```

### Comandos
```bash
# Levantar todo el stack
docker compose up --build

# Servicios accesibles
http://localhost:8000/admin/        # Django admin
http://localhost:8000/api/docs/     # Swagger UI
http://localhost:5174               # Frontend React
mqtt://localhost:1883               # Broker MQTT
```

---

## 13. Estructura del Repositorio

```
SolarView_FullStack/
├── docker-compose.yml
├── .env / .env.example
├── README.md
├── requirements.txt
│
├── soleimapp/                 # Backend Django (ASGI)
│   ├── manage.py
│   ├── Dockerfile
│   ├── soleimapp/             # settings, urls, asgi, celery
│   ├── core/                  # modelos base + ViewSets CRUD
│   ├── telemetria/            # ingest, consumers WS, tasks Celery
│   ├── alerta/                # alertas y tipos
│   ├── analitica/             # KPIs y agregaciones
│   ├── usuario/                # auth JWT custom
│   ├── empresa/               # panel B2B y reportes CSV
│   └── auditoria/             # eventos de auditoría
│
├── soleim-front/              # Frontend React + Vite
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx, main.jsx
│       ├── pages/             # Login, Register, Dashboard, Alertas, ...
│       ├── components/        # Layout, Sidebar, charts, cards, ...
│       ├── context/           # AuthContext
│       ├── services/          # api.js
│       └── styles/
│
└── iot/
    ├── mosquitto/             # Broker MQTT (config + Dockerfile)
    ├── publisher/             # Simulador de sensores
    └── consumer/              # Bridge MQTT → Django REST
```

---

## 14. Próximos Pasos / Roadmap Sugerido

- Integración de sensores físicos reales (reemplazo del simulador).
- Analítica predictiva (proyección de consumo, vida útil de batería).
- Notificaciones push / email reales para alertas críticas.
- Multi-idioma y monedas en facturación.
- App móvil consumiendo la misma API.
- Pipeline CI/CD y despliegue en Kubernetes para producción.

---

*Documento generado a partir del estado actual del repositorio (rama `main`).*
