import { useEffect, useMemo, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES, scorePick } from '../lib/constants'
import Spinner from '../components/Spinner'

export default function Results() {
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [profiles, setProfiles] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [picks, setPicks] = useState([])
  const [picksLoading, setPicksLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [gamesRes, profilesRes] = await Promise.all([
        supabase.from('games').select('*').order('week', { ascending: true }),
        supabase.from('profiles').select('id, display_name').order('display_name'),
      ])
      const gameList = gamesRes.data || []
      setGames(gameList)
      setProfiles(profilesRes.data || [])

      const now = Date.now()
      const lockedGames = gameList.filter((g) => new Date(g.lock_at).getTime() <= now)
      const defaultWeek = lockedGames.length
        ? lockedGames[lockedGames.length - 1].week
        : gameList[0]?.week ?? null
      setSelectedWeek(defaultWeek)
      setLoading(false)
    }
    load()
  }, [])

  const selectedGame = useMemo(
    () => games.find((g) => g.week === selectedWeek) || null,
    [games, selectedWeek]
  )

  const isLocked = selectedGame ? new Date(selectedGame.lock_at).getTime() <= Date.now() : false

  const loadPicks = useCallback(async (gameId) => {
    setPicksLoading(true)
    const { data } = await supabase.from('picks').select('*').eq('game_id', gameId)
    setPicks(data || [])
    setPicksLoading(false)
  }, [])

  useEffect(() => {
    if (selectedGame && isLocked) {
      loadPicks(selectedGame.id)
    } else {
      setPicks([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame?.id, isLocked])

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-2xl text-osu-black">Results</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedWeek(g.week)}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
              selectedWeek === g.week
                ? 'border-osu-orange bg-osu-orange text-white'
                : 'border-osu-black/15 bg-white text-osu-black hover:border-osu-orange/50'
            }`}
          >
            Week {g.week}
          </button>
        ))}
      </div>

      {!selectedGame ? (
        <p className="mt-6 text-osu-black/50">No games scheduled yet.</p>
      ) : !isLocked ? (
        <div className="mt-6 rounded-2xl border border-osu-black/10 bg-white p-6 text-center text-osu-black/60 shadow-sm">
          Picks for this game are still hidden until lock ({new Date(selectedGame.lock_at).toLocaleString()}).
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="font-display text-lg">
              Week {selectedGame.week} — {selectedGame.is_home ? 'vs' : '@'} {selectedGame.opponent}
            </div>
            {!selectedGame.results_published && (
              <span className="rounded-md bg-osu-black/10 px-3 py-1 text-xs font-semibold text-osu-black/60">
                Pending
              </span>
            )}
          </div>

          {picksLoading ? (
            <Spinner />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-osu-black/10 bg-white shadow-sm">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-osu-black/10 bg-osu-black/5 text-left text-xs font-semibold tracking-wide text-osu-black/60">
                    <th className="px-3 py-2">Contestant</th>
                    {CATEGORIES.map((c) => (
                      <th key={c.key} className="px-3 py-2">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-osu-black/10 bg-osu-orange/5 font-bold">
                    <td className="px-3 py-2">Actual</td>
                    {CATEGORIES.map((c) => (
                      <td key={c.key} className="px-3 py-2">
                        {selectedGame[`actual_${c.key}`] || '—'}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">—</td>
                  </tr>
                  {profiles.map((p) => {
                    const pick = picks.find((pk) => pk.user_id === p.id)
                    const points = scorePick(pick, selectedGame)
                    return (
                      <tr key={p.id} className="border-b border-osu-black/5 last:border-0">
                        <td className="px-3 py-2 font-medium">{p.display_name}</td>
                        {CATEGORIES.map((c) => {
                          const correct =
                            selectedGame.results_published &&
                            pick?.[c.key] &&
                            pick[c.key] === selectedGame[`actual_${c.key}`]
                          return (
                            <td
                              key={c.key}
                              className={`px-3 py-2 ${correct ? 'bg-green-100 font-semibold text-green-800' : ''}`}
                            >
                              {pick?.[c.key] || <span className="text-osu-black/30">—</span>}
                            </td>
                          )
                        })}
                        <td className="px-3 py-2 text-right font-semibold">
                          {points !== null ? `${points}/4` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
