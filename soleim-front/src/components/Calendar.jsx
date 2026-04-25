"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
} from "date-fns"
import { es } from "date-fns/locale"
import "../styles/Calendar.css"

const weekDaysShort = ["L", "M", "X", "J", "V", "S", "D"]

const Calendar = ({ range, onRangeChange }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [rangeStart, setRangeStart] = useState(range?.start || null)
  const [rangeEnd, setRangeEnd] = useState(range?.end || null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  const days = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthStart, monthEnd])

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const emitRange = (start, end) => {
    if (start && end && onRangeChange) {
      onRangeChange({
        start,
        end,
        // formateadas para el backend
        startISO: start.toISOString().slice(0, 10),
        endISO: end.toISOString().slice(0, 10),
      })
    }
  }

  const handleSelectDay = (day) => {
    // si no hay rango o ya hay ambos, empezamos uno nuevo
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day)
      setRangeEnd(null)
      return
    }

    // hay inicio pero no fin
    if (rangeStart && !rangeEnd) {
      if (day < rangeStart) {
        // si clican antes del inicio, invertimos
        setRangeStart(day)
        setRangeEnd(rangeStart)
        emitRange(day, rangeStart)
      } else {
        setRangeEnd(day)
        emitRange(rangeStart, day)
      }
    }
  }

  const isInRange = (day) => {
    if (!rangeStart || !rangeEnd) return false
    return day >= rangeStart && day <= rangeEnd
  }

  return (
    <div className="calendar-widget">
      {/* Header */}
      <div className="calendar-header">
        <button
          type="button"
          onClick={handlePreviousMonth}
          className="calendar-nav-button"
        >
          <ChevronLeft size={18} />
        </button>

        <h3 className="calendar-title">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="calendar-nav-button"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="calendar-grid calendar-grid-header">
        {weekDaysShort.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="calendar-grid calendar-grid-body">
        {days.map((day) => {
          const outside = !isSameMonth(day, currentDate)
          const selectedStart = rangeStart && isSameDay(day, rangeStart)
          const selectedEnd = rangeEnd && isSameDay(day, rangeEnd)
          const inRange = isInRange(day)

          const classes = [
            "calendar-day",
            outside ? "outside" : "",
            isToday(day) ? "today" : "",
            selectedStart ? "range-start" : "",
            selectedEnd ? "range-end" : "",
            inRange ? "in-range" : "",
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={classes}
              onClick={() => handleSelectDay(day)}
            >
              <span>{format(day, "d")}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
