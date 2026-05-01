# Cierre técnico de Fase 1

Fecha de cierre: 2026-04-28

## Resumen

La Fase 1 deja el frontend de SOLEIM migrado a una base moderna con React, TypeScript, Vite, Tailwind, tokens visuales, React Query, rutas protegidas, layout operativo, Centro de Control, detalle de instalación, services/hooks de dominio y WebSocket base para telemetría.

Este cierre no implementa la Fase 2 completa. Su objetivo fue estabilizar contratos, autenticación, rutas, dependencias y documentación para poder iniciar la siguiente fase sin arrastrar deuda innecesaria.

## Validaciones ejecutadas

Frontend:

- `npm run build`: OK. Persiste advertencia de chunk mayor a 500 kB.
- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm audit --omit=dev --audit-level=moderate`: OK, 0 vulnerabilidades.
- `npm audit --audit-level=moderate`: OK, 0 vulnerabilidades.

Backend:

- `python manage.py check`: OK usando `..\venv\Scripts\python.exe`.
- `pytest`: OK, 19 tests pasan, cobertura total aproximada 64.21%.
- `python manage.py makemigrations --check --dry-run --noinput`: OK, sin cambios pendientes.
- `ruff check . --select E,F,W,I --ignore E501`: OK.
- `black --check .`: OK.

Docker / healthcheck:

- `docker compose up -d`: OK, servicios levantados.
- `GET http://localhost/api/health/`: OK, `db: ok`, `redis: ok`, `iot_buffer_len: 0`.

## Contratos API revisados

Se revisaron rutas reales en backend antes de ajustar services:

- `ordenes/urls.py`
- `alerta/urls.py`
- `notificaciones/urls.py`
- `mantenimiento/urls.py`
- `tecnicos/urls.py`
- `empresa/urls.py`
- `telemetria/urls.py`
- `analitica/urls.py`

Correcciones aplicadas:

- `ordenes.service.ts`: `asignar()` ahora envía `{ tecnico_id: number }`, que es el payload esperado por el backend.
- `ordenes.service.ts`: el filtro frontend `tecnico` se traduce a `asignado_a` para coincidir con el ViewSet.
- `mantenimiento.service.ts`: `fecha_desde` y `fecha_hasta` se traducen a `desde` y `hasta`, los nombres reales del backend.
- `tecnicos.service.ts`: `disponibles()` apunta a `/tecnicos/perfiles/disponibles/` y exige `ciudad`.
- `factura.service.ts`: el contrato usa `domicilio_id`, como espera `/api/factura/mensual/`.

## Autenticación

Se confirmó que login/register devuelven access y refresh token.

Cambios aplicados:

- Se centralizó storage en `src/lib/authStorage.ts`.
- Se mantiene compatibilidad legacy con:
  - `soleim_token`
  - `soleim_refresh`
  - `soleim_user`
- Se agregan nombres explícitos:
  - `soleim_access_token`
  - `soleim_refresh_token`
  - `soleim_user`
- El interceptor Axios lee ambos formatos y limpia ambos formatos ante fallo de refresh.
- Logout limpia ambos formatos.

## WebSocket

El backend actual define:

- Ruta: `/ws/sensor/<target_id>/`
- Consumer: `SensorConsumer`
- ASGI: `AllowedHostsOriginValidator(URLRouter(...))`

No existe autenticación WebSocket por query string en esta fase. Por eso `useSensorSocket.ts` ya no fuerza `?token=...`; se conecta a la ruta real del backend y maneja estados de conexión sin lanzar errores no capturados.

Estados expuestos:

- `conectando`
- `reintentando`
- `en_vivo`
- `desconectado`
- `error`

## Componentes base preparados para Fase 2

Base existente o añadida:

- `StatusBadge`
- `SeverityBadge` con soporte para prioridad `urgente`
- `RiskBadge`
- `EmptyState`
- `ErrorState`
- `LoadingSkeleton`
- `PageHeader`
- `DataTable`
- `Sheet` basado en Radix Dialog

Esto deja lista la base mínima para Centro de Operaciones sin construir aún el Kanban, drawers ni flujos completos.

## Placeholders controlados

Las siguientes rutas siguen reservadas para siguientes fases y no están en blanco:

- Telemetría
- Alertas
- Órdenes
- Mantenimiento
- Técnicos
- Analítica
- Reportes
- Notificaciones
- Configuración

Cada placeholder renderiza `PageHeader` y un estado vacío con el texto: “Esta vista forma parte de la siguiente fase del rediseño.”

## Vulnerabilidades npm

Estado final:

- Producción: 0 vulnerabilidades con `npm audit --omit=dev`.
- Completo: 0 vulnerabilidades con `npm audit`.

Cambios relevantes:

- `jspdf` actualizado a `^4.2.1`.
- `jspdf-autotable` actualizado a `^5.0.7`.
- `npm audit fix` actualizó dependencias transitivas/dev sin usar `--force`.

## Legacy pendiente

No se eliminaron archivos JSX/CSS legacy en este cierre porque todavía forman una superficie antigua completa que conviene retirar con una tarea dedicada y revisión de referencias.

Pendiente recomendado:

- Confirmar si se conservará algún flujo legacy de `App.jsx`, `main.jsx`, `context/AuthContext.jsx`, páginas JSX y estilos CSS antiguos.
- Eliminar legacy en un commit separado cuando Fase 2 ya tenga reemplazos reales para Alertas, Reportes, Configuración, Usuarios y Domicilios.

## Riesgos conocidos

- El bundle principal sigue por encima de 500 kB. Conviene aplicar code splitting por ruta durante Fase 2.
- La cobertura backend está sobre el umbral actual, pero varios módulos operativos tienen cobertura baja.
- WebSocket no tiene autenticación propia; por ahora depende de contexto de app y restricciones de host.
- Las rutas placeholder todavía no implementan flujos reales.

## Checklist para iniciar Fase 2

- Construir Centro de Operaciones sobre las rutas `/alertas` y `/ordenes`.
- Reusar `DataTable`, `Sheet`, `StatusBadge`, `SeverityBadge`, `EmptyState`, `ErrorState` y `LoadingSkeleton`.
- Conectar alertas reales con filtros por estado, severidad e instalación.
- Conectar órdenes reales con columnas Kanban por estado.
- Implementar drawer de detalle de orden.
- Implementar comentarios, evidencias y asignación de técnico.
- Implementar transiciones: iniciar, completar, cerrar y cancelar.
- Mostrar SLA y escalaciones con datos reales del backend.
- Añadir pruebas de los flujos críticos de services/hooks.

## Recomendación

Fase 1 queda lista para commit/tag de cierre. El siguiente paso recomendado es iniciar Fase 2 con el Centro de Operaciones, manteniendo el alcance centrado en Alertas + Órdenes antes de extender a mantenimiento y técnicos.
