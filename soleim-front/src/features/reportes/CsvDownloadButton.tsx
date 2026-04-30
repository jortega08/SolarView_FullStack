import { Download } from "lucide-react"
import { toast } from "sonner"
import { useCsvReportDownload, type CsvReportKind } from "@/hooks/useReportes"
import { cn } from "@/lib/cn"

interface CsvDownloadButtonProps {
  tipo: CsvReportKind
  instalacionId?: number
  dias: number
  label?: string
  disabled?: boolean
  className?: string
  onDownloaded?: (filename: string) => void
}

export function CsvDownloadButton({
  tipo,
  instalacionId,
  dias,
  label,
  disabled,
  className,
  onDownloaded,
}: CsvDownloadButtonProps) {
  const download = useCsvReportDownload()
  const isDisabled = disabled || !instalacionId || download.isPending

  const handleDownload = async () => {
    if (!instalacionId) {
      toast.error("Selecciona una instalación para descargar el CSV")
      return
    }

    try {
      const result = await download.mutateAsync({
        tipo,
        params: { instalacion_id: instalacionId, dias },
      })
      onDownloaded?.(result.filename)
    } catch {
      // El hook ya muestra el error normalizado.
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDisabled}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <Download className="h-3.5 w-3.5" />
      {download.isPending ? "Descargando..." : label ?? "Descargar CSV"}
    </button>
  )
}
