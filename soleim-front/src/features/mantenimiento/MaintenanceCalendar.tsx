import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import timeGridPlugin from "@fullcalendar/timegrid"
import esLocale from "@fullcalendar/core/locales/es"
import type { DatesSetArg, EventInput } from "@fullcalendar/core"
import { CalendarDays } from "lucide-react"
import { EmptyState } from "@/components/feedback/EmptyState"
import type { MantenimientoProgramado } from "@/types/domain"
import {
  ESTADO_MANTENIMIENTO_COLORS,
  TIPO_MANTENIMIENTO_LABEL,
  getDisplayEstado,
} from "./maintenanceUtils"

interface MaintenanceCalendarProps {
  mantenimientos: MantenimientoProgramado[]
  onDatesSet: (desde: string, hasta: string) => void
  onEventClick: (id: number) => void
}

function mantenimientoToEvent(mantenimiento: MantenimientoProgramado): EventInput {
  const estado = getDisplayEstado(mantenimiento)
  const color = ESTADO_MANTENIMIENTO_COLORS[estado]
  const title = [
    mantenimiento.planNombre ?? TIPO_MANTENIMIENTO_LABEL[mantenimiento.tipo],
    mantenimiento.instalacionNombre,
  ]
    .filter(Boolean)
    .join(" - ")

  return {
    id: String(mantenimiento.id),
    title,
    date: mantenimiento.fechaProgramada,
    backgroundColor: color,
    borderColor: color,
    textColor: "#ffffff",
    extendedProps: { mantenimientoId: mantenimiento.id },
  }
}

export function MaintenanceCalendar({
  mantenimientos,
  onDatesSet,
  onEventClick,
}: MaintenanceCalendarProps) {
  const events = mantenimientos.map(mantenimientoToEvent)

  const handleDatesSet = (info: DatesSetArg) => {
    onDatesSet(info.startStr.slice(0, 10), info.endStr.slice(0, 10))
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Calendario de mantenimientos
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Vista mensual y semanal conectada al rango visible.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          {Object.entries({
            Programado: "var(--color-primary-500)",
            "En proceso": "var(--color-warning-500)",
            Completado: "var(--color-energy-500)",
            Vencido: "var(--color-danger-500)",
            Cancelado: "var(--color-neutral-400)",
          }).map(([label, color]) => (
            <span key={label} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>
      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin mantenimientos en el rango visible"
          description="Cambia el rango del calendario o ajusta los filtros."
        />
      ) : null}
      <div className="p-4 [&_.fc]:text-sm [&_.fc-button]:!rounded-md [&_.fc-button]:!border-[var(--color-primary-600)] [&_.fc-button]:!bg-[var(--color-primary-600)] [&_.fc-button]:!text-xs [&_.fc-button]:!font-medium [&_.fc-button-active]:!bg-[var(--color-primary-700)] [&_.fc-col-header-cell-cushion]:!py-2 [&_.fc-day-today]:!bg-[var(--color-primary-50)] [&_.fc-event]:!cursor-pointer [&_.fc-event]:!rounded-md [&_.fc-event]:!border-0 [&_.fc-toolbar-title]:!text-base [&_.fc-toolbar-title]:!font-semibold [&_.fc-toolbar-title]:!text-[var(--color-text-primary)]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          events={events}
          datesSet={handleDatesSet}
          eventClick={(info) => {
            const id = Number(info.event.extendedProps.mantenimientoId)
            if (id) onEventClick(id)
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
          }}
          height="auto"
          dayMaxEvents={4}
          eventDisplay="block"
          nowIndicator
        />
      </div>
    </section>
  )
}
