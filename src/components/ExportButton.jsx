import { Download } from 'lucide-react'
import { exportJSON } from '../utils/export'

export function ExportButton({ data, filename }) {
  return (
    <button
      onClick={() => exportJSON(data, filename)}
      className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600 transition"
      title="Export as JSON"
    >
      <Download size={13} />
      Export
    </button>
  )
}
