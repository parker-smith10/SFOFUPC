import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORIES } from '../../lib/constants'
import Spinner from '../../components/Spinner'

export default function AdminPicks() {
  const [loading, setLoading] = useState(true)
  const [games, setGames] = useState([])
  const [profiles, setProfiles] = useState([])
  const [selectedGameId, setSelectedGameId] = useState(null)
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
      if (gameList.length) setSelectedGameId(gameList[0].id)
      setLoading(false)
    }
    load()
  }, [])

  const selectedGame = useMemo(
    () => games.find((g) => g.id === selectedGameId) || null,
    [games, selectedGameId]
  )

  useEffect(() => {
    if (!selectedGameId) return
    setPicksLoading(true)
    supabase
      .from('picks')
      .select('*')
      .eq('game_id', selectedGameId)
      .then(({ data }) => {
        setPicks(data || [])
        setPicksLoading(false)
      })
  }, [selectedGameId])

  if (loading) return <Spinner full />

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelectedGameId(g.id)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
              selectedGameId === g.id
                ? 'border-osu-orange bg-osu-orange text-white'
                : 'border-osu-black/15 bg-white'
            }`}
          >
            Wk {g.week}
          </button>
        ))}
      </div>

      {selectedGame && (
        <div className="mt-4 text-sm text-osu-black/60">
          Lock: {new Date(selectedGame.lock_at).toLocaleString()} —{' '}
          {new Date(selectedGame.lock_at).getTime() > Date.now() ? 'not yet locked' : 'locked'}
        </div>
      )}

      {picksLoading ? (
        <Spinner />
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-osu-black/10 bg-white shadow-sm">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-osu-black/10 bg-osu-black/5 text-left text-xs font-semibold uppercase tracking-wide text-osu-black/60">
                <th className="px-3 py-2">Contestant</th>
                {CATEGORIES.map((c) => (
                  <th key={c.key} className="px-3 py-2">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const pick = picks.find((pk) => pk.user_id === p.id)
                return (
                  <tr key={p.id} className="border-b border-osu-black/5 last:border-0">
                    <td className="px-3 py-2 font-medium">{p.display_name}</td>
                    {CATEGORIES.map((c) => (
                      <td key={c.key} className="px-3 py-2">
                        {pick?.[c.key] || <span className="text-osu-black/30">—</span>}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
