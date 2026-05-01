import { useEffect, useState } from "react"
import { Download, FileText, ReceiptText, Search } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/LoadingSkeleton"
import { useDomicilios, useFacturaMensual } from "@/hooks/useFactura"
import type { FacturaMensual } from "@/types/domain"

interface MonthlyInvoicePanelProps {
  mes: number
  ano: number
}

const inputClass =
  "h-9 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)] disabled:cursor-not-allowed disabled:opacity-60"

function monthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleDateString("es-CO", { month: "long" })
}

function formatEnergy(value: number | null): string {
  if (value == null) return "No disponible"
  return `${value.toFixed(2)} kWh`
}

function formatCurrency(value: number | null): string {
  if (value == null) return "No disponible"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

async function generateInvoicePdf(factura: FacturaMensual, mes: number, ano: number) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ])
  const doc = new jsPDF()
  doc.setFontSize(15)
  doc.text("SOLEIM - Factura mensual", 16, 18)
  doc.setFontSize(10)
  doc.text(`${monthName(mes)} ${ano}`, 16, 26)
  autoTable(doc, {
    startY: 34,
    head: [["Campo", "Valor"]],
    body: [
      ["Usuario", factura.usuario ?? "-"],
      ["Domicilio", factura.domicilio ?? "-"],
      ["Ciudad", factura.ciudad ?? "-"],
      ["Fecha emisión", factura.fechaEmision ?? "-"],
      ["Consumo solar", formatEnergy(factura.solar)],
      ["Consumo eléctrico", formatEnergy(factura.electrica)],
      ["Costo", formatCurrency(factura.costo)],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  })
  doc.save(`factura_soleim_${mes}_${ano}.pdf`)
}

export function MonthlyInvoicePanel({ mes, ano }: MonthlyInvoicePanelProps) {
  const { data: domicilios = [], isLoading: domiciliosLoading, isError: domiciliosError, refetch: refetchDomicilios } = useDomicilios()
  const [domicilioId, setDomicilioId] = useState<number | undefined>()
  const [requestedParams, setRequestedParams] = useState<{ domicilio_id: number; mes: number; ano: number } | null>(null)
  const facturaQuery = useFacturaMensual(requestedParams)

  useEffect(() => {
    if (!domicilioId && domicilios.length > 0) {
      setDomicilioId(domicilios[0].id)
    }
  }, [domicilioId, domicilios])

  const handleConsult = () => {
    if (!domicilioId) {
      toast.error("Selecciona un domicilio para consultar la factura")
      return
    }
    setRequestedParams({ domicilio_id: domicilioId, mes, ano })
  }

  const handlePdf = async () => {
    if (!facturaQuery.data) return
    try {
      await generateInvoicePdf(facturaQuery.data, mes, ano)
      toast.success("Factura PDF generada")
    } catch {
      toast.error("No se pudo generar el PDF")
    }
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <ReceiptText className="h-4 w-4 text-[var(--color-primary-600)]" />
            Factura mensual
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            Consulta el endpoint real de facturación por domicilio, mes y año.
          </p>
        </div>
        <button
          type="button"
          onClick={handlePdf}
          disabled={!facturaQuery.data || facturaQuery.isFetching}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-50)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar PDF
        </button>
      </div>

      <div className="p-4">
        {domiciliosLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : domiciliosError ? (
          <ErrorState message="No se pudieron cargar los domicilios" onRetry={() => void refetchDomicilios()} />
        ) : domicilios.length === 0 ? (
          <EmptyState
            title="Sin domicilios disponibles"
            description="El backend exige domicilio_id para consultar la factura mensual."
            icon={FileText}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-normal text-[var(--color-text-secondary)]">
                  Domicilio
                </span>
                <select
                  className={inputClass}
                  value={domicilioId ?? ""}
                  onChange={(event) => setDomicilioId(Number(event.target.value))}
                >
                  {domicilios.map((domicilio) => (
                    <option key={domicilio.id} value={domicilio.id}>
                      {domicilio.usuarioNombre ?? "Usuario"} - {domicilio.ciudadNombre ?? "Ciudad no registrada"}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleConsult}
                disabled={!domicilioId || facturaQuery.isFetching}
                className="inline-flex h-9 items-center justify-center gap-2 self-end rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-3.5 w-3.5" />
                {facturaQuery.isFetching ? "Consultando..." : "Consultar factura"}
              </button>
            </div>

            <div className="mt-4">
              {facturaQuery.isError ? (
                <ErrorState message="No se pudo consultar la factura" onRetry={() => void facturaQuery.refetch()} />
              ) : facturaQuery.isFetching ? (
                <Skeleton className="h-40 w-full" />
              ) : facturaQuery.data ? (
                <InvoicePreview factura={facturaQuery.data} mes={mes} ano={ano} />
              ) : (
                <EmptyState
                  title="Factura sin consultar"
                  description="Selecciona domicilio y consulta para ver la vista previa."
                  icon={ReceiptText}
                  className="py-10"
                />
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function InvoicePreview({ factura, mes, ano }: { factura: FacturaMensual; mes: number; ano: number }) {
  const rows = [
    ["Periodo", `${monthName(mes)} ${ano}`],
    ["Usuario", factura.usuario ?? "No disponible"],
    ["Domicilio", factura.domicilio ?? "No disponible"],
    ["Ciudad", factura.ciudad ?? "No disponible"],
    ["Consumo solar", formatEnergy(factura.solar)],
    ["Consumo eléctrico", formatEnergy(factura.electrica)],
    ["Costo", formatCurrency(factura.costo)],
    ["Fecha emisión", factura.fechaEmision ?? "No disponible"],
  ]

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
      <div className="bg-[var(--color-neutral-50)] px-4 py-3">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Vista previa de factura</p>
        <p className="text-xs text-[var(--color-text-secondary)]">Datos reales de facturación mensual.</p>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-2 gap-3 px-4 py-2.5 text-xs">
            <span className="text-[var(--color-text-secondary)]">{label}</span>
            <span className="tabular text-right font-semibold text-[var(--color-text-primary)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
