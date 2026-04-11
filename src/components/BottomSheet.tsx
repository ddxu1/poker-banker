import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative bg-gray-900 rounded-t-3xl px-4 pt-4 pb-8"
        style={{ paddingBottom: 'max(2rem, var(--safe-bottom))' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
        {children}
      </div>
    </div>
  )
}
