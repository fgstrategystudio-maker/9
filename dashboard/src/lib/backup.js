const BACKUP_KEYS = ["commesse", "setup", "network"]
const LAST_BACKUP_KEY = "freelance_last_backup"

export function exportData() {
  const data = {}
  BACKUP_KEYS.forEach(k => {
    const raw = localStorage.getItem(k)
    if (raw) {
      try { data[k] = JSON.parse(raw) }
      catch { data[k] = raw }
    }
  })
  const blob = new Blob(
    [JSON.stringify({ version: 1, exported_at: new Date().toISOString(), data }, null, 2)],
    { type: "application/json" }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `freelance-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
}

export function daysSinceLastBackup() {
  const last = localStorage.getItem(LAST_BACKUP_KEY)
  if (!last) return Infinity
  return (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
}
