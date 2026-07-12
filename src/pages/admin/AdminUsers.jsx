import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Spinner from '../../components/Spinner'

export default function AdminUsers() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [edits, setEdits] = useState({})
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, is_admin, created_at')
      .order('display_name')
    if (error) setError(error.message)
    setProfiles(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const saveName = async (id) => {
    const name = edits[id]?.trim()
    if (!name) return
    setSavingId(id)
    const { error } = await supabase.from('profiles').update({ display_name: name }).eq('id', id)
    setSavingId(null)
    if (error) {
      setError(error.message)
      return
    }
    setEdits((e) => {
      const next = { ...e }
      delete next[id]
      return next
    })
    load()
  }

  if (loading) return <Spinner full />

  return (
    <div>
      <p className="mb-4 text-sm text-osu-black/60">
        Accounts are created in the Supabase dashboard (Authentication → Users). New users get a
        matching row in <code>profiles</code> automatically; edit display names here.
      </p>
      {error && <p className="mb-3 text-sm font-medium text-red-600">{error}</p>}
      <div className="space-y-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-osu-black/10 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={edits[p.id] ?? p.display_name}
                onChange={(e) => setEdits((ed) => ({ ...ed, [p.id]: e.target.value }))}
                className="rounded-lg border border-osu-black/15 px-2 py-1.5 text-sm"
              />
              {p.is_admin && (
                <span className="rounded-full bg-osu-orange/10 px-2 py-1 text-xs font-semibold text-osu-orange">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={() => saveName(p.id)}
              disabled={edits[p.id] === undefined || savingId === p.id}
              className="rounded-lg bg-osu-black px-3 py-1.5 text-xs font-semibold text-osu-paper disabled:opacity-30"
            >
              Save
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
