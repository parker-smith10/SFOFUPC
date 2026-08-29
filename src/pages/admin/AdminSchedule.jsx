import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Spinner from '../../components/Spinner'

const emptyForm = {
  week: '',
  opponent: '',
  is_home: true,
  kickoff_at: '',
  lock_at: '',
}

function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

export default function AdminSchedule() {
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('games').select('*').order('week', { ascending: true })
    if (error) setError(error.message)
    setGames(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (g) => {
    setEditingId(g.id)
    setForm({
      week: g.week,
      opponent: g.opponent,
      is_home: g.is_home,
      kickoff_at: toLocalInput(g.kickoff_at),
      lock_at: toLocalInput(g.lock_at),
    })
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      week: Number(form.week),
      opponent: form.opponent,
      is_home: form.is_home,
      kickoff_at: form.kickoff_at ? new Date(form.kickoff_at).toISOString() : null,
      lock_at: form.lock_at ? new Date(form.lock_at).toISOString() : null,
    }

    const { error } = editingId
      ? await supabase.from('games').update(payload).eq('id', editingId)
      : await supabase.from('games').insert(payload)

    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    resetForm()
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this game? This also deletes any picks for it.')) return
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    load()
  }

  if (loading) return <Spinner full />

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-2 gap-3 rounded-xl border border-osu-black/10 bg-white p-4 shadow-sm sm:grid-cols-4"
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-osu-black/50">Week</label>
          <input
            type="number"
            required
            min="1"
            max="13"
            value={form.week}
            onChange={(e) => setForm((f) => ({ ...f, week: e.target.value }))}
            className="w-full rounded-lg border border-osu-black/15 px-2 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-osu-black/50">Opponent</label>
          <input
            type="text"
            required
            value={form.opponent}
            onChange={(e) => setForm((f) => ({ ...f, opponent: e.target.value }))}
            className="w-full rounded-lg border border-osu-black/15 px-2 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-osu-black/50">Home?</label>
          <select
            value={form.is_home ? 'yes' : 'no'}
            onChange={(e) => setForm((f) => ({ ...f, is_home: e.target.value === 'yes' }))}
            className="w-full rounded-lg border border-osu-black/15 px-2 py-2"
          >
            <option value="yes">Home</option>
            <option value="no">Away</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-osu-black/50">Kickoff</label>
          <input
            type="datetime-local"
            required
            value={form.kickoff_at}
            onChange={(e) => setForm((f) => ({ ...f, kickoff_at: e.target.value }))}
            className="w-full rounded-lg border border-osu-black/15 px-2 py-2"
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-semibold text-osu-black/50">Lock At</label>
          <input
            type="datetime-local"
            required
            value={form.lock_at}
            onChange={(e) => setForm((f) => ({ ...f, lock_at: e.target.value }))}
            className="w-full rounded-lg border border-osu-black/15 px-2 py-2"
          />
        </div>

        {error && <p className="col-span-full text-sm font-medium text-red-600">{error}</p>}

        <div className="col-span-full flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-osu-black px-4 py-2 font-display text-sm text-osu-paper disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Update Game' : 'Add Game'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-osu-black/15 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {games.map((g) => (
          <div
            key={g.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-osu-black/10 bg-white p-3 shadow-sm"
          >
            <div>
              <div className="text-xs font-semibold text-osu-black/50">Week {g.week}</div>
              <div className="font-semibold">
                {g.is_home ? 'vs' : '@'} {g.opponent}
              </div>
              <div className="text-xs text-osu-black/50">
                Lock: {new Date(g.lock_at).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(g)}
                className="rounded-lg border border-osu-black/15 px-3 py-1.5 text-xs font-semibold"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(g.id)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && <p className="text-osu-black/50">No games yet. Add one above.</p>}
      </div>
    </div>
  )
}
