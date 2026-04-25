export function BtnPrimary({ children, onClick, disabled, loading, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? '…' : children}
    </button>
  )
}

export function BtnSecondary({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 rounded-lg bg-white/10 text-gray-300 text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function BtnDanger({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export function BtnSoft({ children, onClick, disabled, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-accent bg-accent/10 transition-colors hover:bg-accent/20 disabled:opacity-40"
    >
      {Icon && <Icon size={15} />}
      {children}
    </button>
  )
}
