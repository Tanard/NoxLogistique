import { COLORS } from '../../constants'

export function PageLayout({ children, wide = false }) {
  return (
    <main className="flex-1 overflow-y-auto" style={{ backgroundColor: COLORS.bg }}>
      <div className={`p-4 md:p-8 pt-16 md:pt-8 ${wide ? 'max-w-7xl' : 'max-w-5xl'} mx-auto`}>
        {children}
      </div>
    </main>
  )
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold" style={{ color: COLORS.textDark }}>{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}
