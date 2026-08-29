import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, scorePick } from '../lib/constants'
import Countdown from '../components/Countdown'
import UniformPreview from '../components/UniformPreview'
import Spinner from '../components/Spinner'

export default function MyPicks() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [options, setOptions] = useState({ helmet: [], jersey: [], pants: [], logo: [] })
  const [picksByGame, setPicksByGame] = useState({})
  const [form, setForm] = useState({ helmet: '', jersey: '', pants: '', logo: '' })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [gamesRes, optionsRes, picksRes] = await Promise.all([
      supabase.from('games').select('*').order('week', { ascending: true }),
      supabase
        .from('options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase.from('picks').select('*').eq('user_id', user.id),
    ])

    if (gamesRes.error) setError(gamesRes.error.message)
    if (optionsRes.error) setError(optionsRes.error.message)
    if (picksRes.error) setError(picksRes.error.message)

    setGames(gamesRes.data || [])

    const grouped = { helmet: [], jersey: [], pants: [], logo: [] }
    for (const opt of optionsRes.data || []) {
      grouped[opt.category]?.push(opt)
    }
    setOptions(grouped)

    const byGame = {}
    for (const p of picksRes.data || []) byGame[p.game_id] = p
    setPicksByGame(byGame)
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  const now = Date.now()
  const upcoming = useMemo(
    () =>
      games
        .filter((g) => new Date(g.lock_at).getTime() > now)
        .sort((a, b) => new Date(a.lock_at) - new Date(b.lock_at))[0] || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [games]
  )

  const pastGames = useMemo(
    () =>
      games
        .filter((g) => new Date(g.lock_at).getTime() <= now)
        .sort((a, b) => new Date(b.lock_at) - new Date(a.lock_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [games]
  )

  useEffect(() => {
    if (!upcoming) return
    const existing = picksByGame[upcoming.id]
    setForm({
      helmet: existing?.helmet || '',
      jersey: existing?.jersey || '',
      pants: existing?.pants || '',
      logo: existing?.logo || '',
    })
  }, [upcoming, picksByGame])

  const isLocked = upcoming ? new Date(upcoming.lock_at).getTime() <= Date.now() : false

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!upcoming || isLocked) return
    setSaving(true)
    setSavedMsg('')
    setError('')

    const { data, error } = await supabase
      .from('picks')
      .upsert(
        {
          user_id: user.id,
          game_id: upcoming.id,
          helmet: form.helmet,
          jersey: form.jersey,
          pants: form.pants,
          logo: form.logo,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,game_id' }
      )
      .select()
      .single()

    setSaving(false)
    if (error) {
      setError(
        error.code === '42501' || error.message?.includes('policy')
          ? 'Picks are locked for this game.'
          : error.message
      )
      return
    }
    setPicksByGame((prev) => ({ ...prev, [upcoming.id]: data }))
    setSavedMsg('Pick saved!')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  if (loading) return <Spinner full />

  const formComplete = form.helmet && form.jersey && form.pants && form.logo

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="font-display text-2xl text-osu-black">My Picks</h1>

      {upcoming ? (
        <div className="mt-4 rounded-2xl border border-osu-black/10 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-wide text-osu-black/50">
                Week {upcoming.week}
              </div>
              <div className="font-display text-xl">
                {upcoming.is_home ? 'vs' : '@'} {upcoming.opponent}
              </div>
            </div>
            <Countdown lockAt={upcoming.lock_at} onLock={load} />
          </div>

          <div className="mt-5 flex justify-center">
            <UniformPreview {...form} />
          </div>

          {isLocked ? (
            <p className="mt-4 text-center text-sm font-medium text-osu-black/60">
              Picks are locked for this game.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                        className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                          form[key] === opt.value
                            ? 'border-osu-orange bg-osu-orange text-white'
                            : 'border-osu-black/15 bg-white text-osu-black hover:border-osu-orange/50'
                        }`}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              {savedMsg && <p className="text-sm font-medium text-green-600">{savedMsg}</p>}

              <button
                type="submit"
                disabled={!formComplete || saving}
                className="w-full rounded-lg bg-osu-black py-3 font-display text-sm tracking-wide text-osu-paper transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving ? 'Saving…' : picksByGame[upcoming.id] ? 'Update Pick' : 'Submit Pick'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-osu-black/10 bg-white p-5 text-center text-osu-black/60 shadow-sm">
          No upcoming games on the schedule.
        </div>
      )}

      {pastGames.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg text-osu-black">Past Games</h2>
          <div className="space-y-3">
            {pastGames.map((g) => {
              const pick = picksByGame[g.id]
              const points = scorePick(pick, g)
              return (
                <div
                  key={g.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-osu-black/10 bg-white p-3 shadow-sm"
                >
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-osu-black/50">
                      Week {g.week}
                    </div>
                    <div className="font-semibold">
                      {g.is_home ? 'vs' : '@'} {g.opponent}
                    </div>
                    {!pick && <div className="mt-1 text-xs text-osu-black/40">No pick submitted</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    {pick && (
                      <div className="scale-75 origin-right">
                        <UniformPreview {...pick} size="sm" />
                      </div>
                    )}
                    {points !== null ? (
                      <span className="rounded-md bg-osu-black px-3 py-1 text-sm font-bold text-osu-paper">
                        {points}/4
                      </span>
                    ) : g.results_published === false ? (
                      <span className="text-xs font-medium text-osu-black/40">Pending</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
