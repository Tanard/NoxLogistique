import { ChevronUp, ChevronDown } from 'lucide-react'

export function SortableHeader({ label, sortKey, currentKey, currentDir, onSort }) {
  const active = currentKey === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wider px-4 py-3 cursor-pointer select-none hover:text-black transition-colors"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (currentDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  )
}
