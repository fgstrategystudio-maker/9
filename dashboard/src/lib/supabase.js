const SUPABASE_URL = "https://ehmfwkmtbfmdxcddfyzd.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVobWZ3a210YmZtZHhjZGRmeXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTYyNDcsImV4cCI6MjA5NDA5MjI0N30._ZedUvJLTjeC-_8gzP3jEs4aLLp9ydiVfpnvVY-lY6o"

const HEADERS = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "resolution=merge-duplicates",
}

export async function loadFromSupabase() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/freelance_kv?select=key,value`,
      { headers: HEADERS }
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function syncToSupabase(key, value) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/freelance_kv`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ key, value }),
    })
  } catch { }
}
