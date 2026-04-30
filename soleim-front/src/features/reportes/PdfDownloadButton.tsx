import { FileDown } from "lucide-react"
import { usePdfReportDownload, type PdfReportRequest } from "@/hooks/useReportes"
import { cn } from "@/lib/cn"

interface PdfDownloadButtonProps {
  request: PdfReportRequest
  label?: string
  disabled?: boolean
  className?: string
  onDownloaded?: (filename: string) => void
}

export function PdfDownloadButton({
  request,
  label = "Descargar PDF",
  disabled,
  className,
  onDownloaded,
}: PdfDownloadButtonProps) {
  const download = usePdfReportDownload()

  const handleDownload = async () => {
    try {
      const filename = await download.mutateAsync(request)
      onDownloaded?.(filename)
    } catch {
      // El hook muestra el error normalizado.
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || download.isPending}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[var(--color-primary-600)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <FileDown className="h-3.5 w-3.5" />
      {download.isPending ? "Generando..." : label}
    </button>
  )
}
