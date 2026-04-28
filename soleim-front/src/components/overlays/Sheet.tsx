import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"
import type { ReactNode } from "react"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  side?: "right" | "left"
  className?: string
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "right",
  className,
}: SheetProps) {
  const sideClass = side === "right" ? "right-0 border-l" : "left-0 border-r"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content
          className={cn(
            "fixed top-0 z-50 flex h-screen w-full max-w-xl flex-col border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)]",
            sideClass,
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)]">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="border-t border-[var(--color-border)] px-5 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
