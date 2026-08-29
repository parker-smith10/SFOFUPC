import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORIES } from '../../lib/constants'
import Spinner from '../../components/Spinner'
import UniformPreview from '../../components/UniformPreview'

export default function AdminResults() {
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [options, setOptions] = useState({ helmet: [], jersey: [], pants: [], logo: [] })
  const [selectedGameId, setSelectedGameId] = useState(null)
  const [form, setForm] = useState({ helmet: '', jersey: '', pants: '', logo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    const [gamesRes, optionsRes] = await Promise.all([
      supabase.from('games').select('*').order('week', { ascending: true }),
      supabase.from('options').select('*').order('sort_order', { ascending: true }),
    ])
    const gameList = gamesRes.data || []
    setGames(gameList)

    const grouped = { helmet: [], jersey: [], pants: [], logo: [] }
    for (const opt of optionsRes.data || []) grouped[opt.category]?.push(opt)
    setOptions(grouped)

    if (!selectedGameId && gameList.length) {
      const now = Date.now()
      const nextUnpublished = gameList.find(
        (g) => new Date(g.lock_at).getTime() <= now && !g.results_published
      )
      setSelectedGameId((nextUnpublished || gameList[0]).id)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) || null,
    [games, selectedGameId]
  )

  useEffect(() => {
    if (!selectedGame) return
    setForm({
      helmet: selectedGame.actual_helmet || '',
      jersey: selectedGame.actual_jersey || '',
      pants: selectedGame.actual_pants || '',
      logo: selectedGame.actual_logo || '',
    })
    setMsg('')
    setError('')
  }, [selectedGame])

  const save = async (publish) => {
    if (!selectedGame) return
    setSaving(true)
    setError('')
    setMsg('')
    const { error } = await supabase
      .from('games')
      .update({
        actual_helmet: form.helmet || null,
        actual_jersey: form.jersey || null,
        actual_pants: form.pants || null,
        actual_logo: form.logo || null,
        results_published: publish,
      })
      .eq('id', selectedGame.id)
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setMsg(publish ? 'Results published!' : 'Saved as draft.')
    load()
  }

  if (loading) return <Spinner full />

  const complete = form.helmet && form.jersey && form.pants && form.logo

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_1fr]">
      <div className="space-y-1.5">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGameId(g.id)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
              selectedGameId === g.id
                ? 'border-osu-orange bg-osu-orange/10'
                : 'border-osu-black/10 bg-white'
            }`}
          >
            <span>
              Wk {g.week} — {g.opponent}
            </span>
            {g.results_published && <span className="text-xs text-green-600">✓</span>}
          </button>
        ))}
      </div>

      {selectedGame ? (
        <div className="rounded-xl border border-osu-black/10 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg">
              Week {selectedGame.week} — {selectedGame.is_home ? 'vs' : '@'} {selectedGame.opponent}
            </h3>
            <div className="flex justify-center">
              <UniformPreview {...form} size="sm" />
            </div>
          </div>

          <div className="space-y-4">
            {CATEGORIES.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-semibold tracking-wide text-osu-black/60">
                  {label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {options[key].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setForm((f) => ({ ...f, [key]: opt.value }))}
                      className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                        form[key] === opt.value
                          ? 'border-osu-orange bg-osu-orange text-white'
                          : opt.is_active
                            ? 'border-osu-black/15 bg-white'
                            : 'border-osu-black/10 bg-osu-black/5 text-osu-black/40'
                      }`}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
          {msg && <p className="mt-4 text-sm font-medium text-green-600">{msg}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={() => save(true)}
              disabled={!complete || saving}
              className="rounded-lg bg-osu-orange px-4 py-2 font-display text-sm text-white disabled:opacity-40"
            >
              {selectedGame.results_published ? 'Update & Keep Published' : 'Publish Results'}
            </button>
            <button
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-lg border border-osu-black/15 px-4 py-2 text-sm font-semibold"
            >
              Save as Draft / Unpublish
            </button>
          </div>
        </div>
      ) : (
        <p className="text-osu-black/50">No games yet — add one in Schedule.</p>
      )}
    </div>
  )
}
