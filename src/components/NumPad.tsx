import { useState } from 'react'
import { formatMoney } from '../core/settlement'

interface NumPadProps {
  presets: number[] // in cents
  onConfirm: (amountCents: number) => void
  onCancel: () => void
  title: string
}

export default function NumPad({ presets, onConfirm, onCancel, title }: NumPadProps) {
  const [input, setInput] = useState('')

  const amountCents = input ? Math.round(parseFloat(input) * 100) : 0

  function press(key: string) {
    if (key === 'DEL') {
      setInput((prev) => prev.slice(0, -1))
      return
    }
    if (key === '.') {
      if (input.includes('.')) return
      setInput((prev) => (prev === '' ? '0.' : prev + '.'))
      return
    }
    // Limit to 2 decimal places
    if (input.includes('.') && input.split('.')[1]?.length >= 2) return
    // Limit total digits
    if (input.replace('.', '').length >= 6) return
    setInput((prev) => (prev === '0' ? key : prev + key))
  }

  function selectPreset(cents: number) {
    setInput((cents / 100).toString())
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL']

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center text-gray-400 text-sm font-medium uppercase tracking-widest">{title}</p>

      {/* Amount display */}
      <div className="bg-gray-900 rounded-2xl px-6 py-4 text-center">
        <span className="text-5xl font-bold text-white tabular-nums">
          {input ? formatMoney(amountCents) : <span className="text-gray-600">$0</span>}
        </span>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {presets.map((cents) => (
          <button
            key={cents}
            onClick={() => selectPreset(cents)}
            className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {formatMoney(cents)}
          </button>
        ))}
      </div>

      {/* Number keys */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => press(key)}
            className={`py-4 rounded-xl text-xl font-semibold transition-colors active:scale-95 ${
              key === 'DEL'
                ? 'bg-gray-800 text-gray-400 text-base'
                : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white'
            }`}
          >
            {key === 'DEL' ? '⌫' : key}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <button
          onClick={onCancel}
          className="py-4 rounded-xl bg-gray-800 text-gray-400 font-semibold text-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => amountCents > 0 && onConfirm(amountCents)}
          disabled={amountCents <= 0}
          className="py-4 rounded-xl bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold text-lg transition-colors active:bg-green-500"
        >
          Confirm
        </button>
      </div>
    </div>
  )
}
