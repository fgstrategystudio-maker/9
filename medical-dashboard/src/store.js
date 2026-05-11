const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const save = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); return value }

// Profile
export const getProfile = () => load('mcd_profile', {})
export const saveProfile = (data) => save('mcd_profile', data)

// Generic list helpers
const listStore = (key) => ({
  all: () => load(key, []),
  add: (item) => { const list = load(key, []); const next = [...list, { ...item, id: genId() }]; save(key, next); return next },
  update: (id, data) => { const next = load(key, []).map(x => x.id === id ? { ...x, ...data } : x); save(key, next); return next },
  remove: (id) => { const next = load(key, []).filter(x => x.id !== id); save(key, next); return next },
})

export const allergies = listStore('mcd_allergies')
export const medications = listStore('mcd_medications')
export const conditions = listStore('mcd_conditions')
export const vaccinations = listStore('mcd_vaccinations')
export const episodes = listStore('mcd_episodes')
export const exams = listStore('mcd_exams')
export const family = listStore('mcd_family')

// Lifestyle (single object)
export const getLifestyle = () => load('mcd_lifestyle', {})
export const saveLifestyle = (data) => save('mcd_lifestyle', data)

// Episodes helpers
export const getEpisode = (id) => load('mcd_episodes', []).find(e => e.id === id)
export const addEpisode = (data) => {
  const list = load('mcd_episodes', [])
  const item = { ...data, id: genId(), created_at: new Date().toISOString() }
  save('mcd_episodes', [...list, item])
  return item
}
export const updateEpisode = (id, data) => {
  const next = load('mcd_episodes', []).map(x => x.id === id ? { ...x, ...data } : x)
  save('mcd_episodes', next)
}
export const deleteEpisode = (id) => {
  save('mcd_episodes', load('mcd_episodes', []).filter(x => x.id !== id))
}

// Exams helpers (store file as dataURL in localStorage)
export const addExam = (data) => {
  const list = load('mcd_exams', [])
  const item = { ...data, id: genId(), created_at: new Date().toISOString() }
  save('mcd_exams', [...list, item])
  return item
}
export const deleteExam = (id) => {
  save('mcd_exams', load('mcd_exams', []).filter(x => x.id !== id))
}
export const updateExam = (id, data) => {
  const next = load('mcd_exams', []).map(x => x.id === id ? { ...x, ...data } : x)
  save('mcd_exams', next)
}
