import { useEffect } from "react"

/**
 * Sets document.title to "<title> · Solein" while the component is mounted.
 * Restores the previous title on unmount.
 */
export default function usePageTitle(title) {
  useEffect(() => {
    const prev = document.title
    document.title = title ? `${title} · Solein` : "Solein"
    return () => { document.title = prev }
  }, [title])
}
