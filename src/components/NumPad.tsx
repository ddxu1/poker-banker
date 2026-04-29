import { useState, useEffect, useRef } from 'react'
import { formatMoney } from '../core/settlement'

interface NumPadProps {
  presets: number[] // in cents
  onConfirm: (amountCents: number) => void
  onCancel: () => void
  title: string
  allowZero?: boolean
}

function sanitize(raw: string): string {
  // strip everything except digits and a single decimal point
  let cleaned = raw.replace(/[^0-9.]/g, '')
  const firstDot = cleaned.indexOf('.')
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
  }
  // limit to 2 decimal places
  if (firstDot !== -1) {
    const [whole, frac = ''] = cleaned.split('.')
    cleaned = whole + '.' + frac.slice(0, 2)
  }
  // limit total digits to 6
  if (cleaned.replace('.', '').length > 6) {
    let digitsKept = 0
    let out = ''
    for (const ch of cleaned) {
      if (ch === '.') { out += ch; continue }
      if (digitsKept >= 6) break
      out += ch
      digitsKept++
    }
    cleaned = out
  }
  // strip leading zeros unless followed by '.'
  if (cleaned.length > 1 && cleaned.startsWith('0') && cleaned[1] !== '.') {
    cleaned = cleaned.replace(/^0+/, '') || '0'
  }
  return cleaned
}

export default function NumPad({ presets, onConfirm, onCancel, title, allowZero = false }: NumPadProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const amountCents = input ? Math.round(parseFloat(input) * 100) : 0
  const canConfirm = (allowZero ? amountCents >= 0 : amountCents > 0) && !Number.isNaN(amountCents)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function addPreset(cents: number) {
    const newTotal = amountCents + cents
    if (newTotal > 99999900) return
    const dollars = newTotal / 100
    setInput(dollars % 1 === 0 ? dollars.toString() : dollars.toFixed(2))
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (canConfirm) onConfirm(amountCents)
      return
    }
    if (e.key === 'Escape') {
      onCancel()
      return
    }
    // Cmd/Ctrl/Alt + Backspace clears the whole field
    if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey || e.altKey)) {
      e.preventDefault()
      setInput('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest">{title}</p>

      {/* Amount input */}
      <label className="block">
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl px-6 py-5 border border-gray-800/60 focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/30 transition-colors">
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-5xl font-bold tabular-nums tracking-tight ${input ? 'text-violet-300' : 'text-gray-700'}`}>$</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(sanitize(e.target.value))}
              onKeyDown={handleKeyDown}
              inputMode="decimal"
              autoFocus
              placeholder="0"
              className="bg-transparent outline-none text-5xl font-bold tabular-nums tracking-tight text-white placeholder-gray-700 w-full max-w-[14ch] text-center caret-violet-400"
            />
          </div>
        </div>
      </label>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((cents) => (
          <button
            key={cents}
            onClick={() => addPreset(cents)}
            className="bg-violet-950/60 hover:bg-violet-900/60 active:bg-violet-800/60 border border-violet-700/40 text-violet-300 font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            +{formatMoney(cents)}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3 mt-1">
        <button
          onClick={onCancel}
          className="py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold text-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => { setInput(''); inputRef.current?.focus() }}
          disabled={amountCents === 0}
          className="py-4 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:text-gray-700 text-gray-300 font-semibold text-lg transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => canConfirm && onConfirm(amountCents)}
          disabled={!canConfirm}
          className="py-4 rounded-xl bg-gradient-to-br from-violet-500 via-violet-700 to-violet-950 border border-violet-500/40 disabled:from-gray-700 disabled:via-gray-800 disabled:to-gray-900 disabled:border-gray-700 disabled:text-gray-500 text-white font-bold text-lg transition-all shadow-lg shadow-violet-950/40"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
