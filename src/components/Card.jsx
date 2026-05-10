export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-slate-800 p-4 ${className}`}>
      {children}
    </div>
  )
}

export function SectionHeader({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {action}
    </div>
  )
}
