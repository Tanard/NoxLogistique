import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput({ value, onChange, placeholder, autoComplete, onKeyDown }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-white/20 bg-white/10 text-white px-3 py-2.5 pr-10 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
