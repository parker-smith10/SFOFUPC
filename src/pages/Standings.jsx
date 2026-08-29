import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { CATEGORIES, scorePick } from '../lib/constants'
import Spinner from '../components/Spinner'

export default function Standings() {
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState([])
  const [games, setGames] = useState([])
  const [picks, setPicks] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [profilesRes, gamesRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').order('display_name'),
        supabase.from('games').select('*').order('week', { ascending: true }),
      ])
      const gameList = gamesRes.data || []
      setGames(gameList)
      setProfiles(profilesRes.data || [])

      const now = Date.now()
      const lockedGameIds = gameList
        .filter((g) => new Date(g.lock_at).getTime() <= now)
        .map((g) => g.id)

      if (lockedGameIds.length) {
        const { data } = await supabase.from('picks').select('*').in('game_id', lockedGameIds)
        setPicks(data || [])
      } else {
        setPicks([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const publishedGames = useMemo(
    () => games.filter((g) => g.results_published),
    [games]
  )

  const standings = useMemo(() => {
    const rows = profiles.map((p) => {
      let total = 0
      let perfectWeeks = 0
      let bestWeek = 0
      const categoryCorrect = { helmet: 0, jersey: 0, pants: 0, logo: 0 }
      const weekResults = [] // in week order, { week, points }

      for (const g of publishedGames) {
        const pick = picks.find((pk) => pk.user_id === p.id && pk.game_id === g.id)
        const points = scorePick(pick, g) ?? 0
        total += points
        bestWeek = Math.max(bestWeek, points)
        if (points === 4) perfectWeeks += 1
        for (const { key } of CATEGORIES) {
          if (pick?.[key] && pick[key] === g[`actual_${key}`]) categoryCorrect[key] += 1
        }
        weekResults.push({ week: g.week, points })
      }

      // current streak: consecutive most-recent weeks (by week desc) with >=1 point
      let streak = 0
      for (let i = weekResults.length - 1; i >= 0; i--) {
        if (weekResults[i].points >= 1) streak += 1
        else break
      }

      const possible = publishedGames.length * 4
      const accuracy = possible > 0 ? (total / possible) * 100 : 0

      return {
        id: p.id,
        name: p.display_name,
        total,
        possible,
        accuracy,
        perfectWeeks,
        bestWeek,
        streak,
        categoryCorrect,
      }
    })

    rows.sort((a, b) => b.total - a.total)
    let rank = 0
    let prevScore = null
    rows.forEach((r, i) => {
      if (r.total !== prevScore) rank = i + 1
      r.rank = rank
      prevScore = r.total
    })
    return rows
  }, [profiles, publishedGames, picks])

  const mostPickedCombo = useMemo(() => {
    const counts = {}
    for (const pk of picks) {
      if (!pk.helmet || !pk.jersey || !pk.pants || !pk.logo) continue
      const key = `${pk.helmet} / ${pk.jersey} / ${pk.pants} / ${pk.logo}`
      counts[key] = (counts[key] || 0) + 1
    }
    let best = null
    for (const [combo, count] of Object.entries(counts)) {
      if (!best || count > best.count) best = { combo, count }
    }
    return best
  }, [picks])

  const actualFrequency = useMemo(() => {
    const freq = { helmet: {}, jersey: {}, pants: {}, logo: {} }
    for (const g of publishedGames) {
      for (const { key } of CATEGORIES) {
        const v = g[`actual_${key}`]
        if (!v) continue
        freq[key][v] = (freq[key][v] || 0) + 1
      }
    }
    return freq
  }, [publishedGames])

  if (loading) return <Spinner full />

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-2xl text-osu-black">Standings</h1>

      {publishedGames.length === 0 ? (
        <p className="mt-6 text-osu-black/50">No results have been published yet.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border border-osu-black/10 bg-white shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-osu-black/10 bg-osu-black/5 text-left text-xs font-semibold tracking-wide text-osu-black/60">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2 text-right">Points</th>
                  <th className="px-3 py-2 text-right">Possible</th>
                  <th className="px-3 py-2 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={r.id} className="border-b border-osu-black/5 last:border-0">
                    <td className="px-3 py-2 font-display text-osu-orange">{r.rank}</td>
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-right font-semibold">{r.total}</td>
                    <td className="px-3 py-2 text-right text-osu-black/50">{r.possible}</td>
                    <td className="px-3 py-2 text-right">{r.accuracy.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-8 font-display text-lg text-osu-black">Category Accuracy</h2>
          <div className="overflow-x-auto rounded-xl border border-osu-black/10 bg-white shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-osu-black/10 bg-osu-black/5 text-left text-xs font-semibold tracking-wide text-osu-black/60">
                  <th className="px-3 py-2">Name</th>
                  {CATEGORIES.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-right">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map((r) => (
                  <tr key={r.id} className="border-b border-osu-black/5 last:border-0">
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    {CATEGORIES.map((c) => (
                      <td key={c.key} className="px-3 py-2 text-right">
                        {r.possible > 0
                          ? `${((r.categoryCorrect[c.key] / publishedGames.length) * 100).toFixed(0)}%`
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mb-3 mt-8 font-display text-lg text-osu-black">Fun Stats</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <StatCard label="Best Single Week">
              {standings.length
                ? `${standings.reduce((a, b) => (b.bestWeek > a.bestWeek ? b : a)).name} — ${
                    standings.reduce((a, b) => (b.bestWeek > a.bestWeek ? b : a)).bestWeek
                  }/4`
                : '—'}
            </StatCard>
            <StatCard label="Most Perfect Weeks">
              {standings.length
                ? `${standings.reduce((a, b) => (b.perfectWeeks > a.perfectWeeks ? b : a)).name} — ${
                    standings.reduce((a, b) => (b.perfectWeeks > a.perfectWeeks ? b : a)).perfectWeeks
                  }`
                : '—'}
            </StatCard>
            <StatCard label="Longest Current Streak">
              {standings.length
                ? `${standings.reduce((a, b) => (b.streak > a.streak ? b : a)).name} — ${
                    standings.reduce((a, b) => (b.streak > a.streak ? b : a)).streak
                  } wk(s)`
                : '—'}
            </StatCard>
            <StatCard label="Most-Picked Combination">
              {mostPickedCombo ? `${mostPickedCombo.combo} (${mostPickedCombo.count}x)` : '—'}
            </StatCard>
          </div>

          <h2 className="mb-3 mt-8 font-display text-lg text-osu-black">
            What OSU Actually Wore
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <StatCard key={c.key} label={c.label}>
                {Object.keys(actualFrequency[c.key]).length === 0
                  ? '—'
                  : Object.entries(actualFrequency[c.key])
                      .sort((a, b) => b[1] - a[1])
                      .map(([val, count]) => `${val} (${count})`)
                      .join(', ')}
              </StatCard>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, children }) {
  return (
    <div className="rounded-xl border border-osu-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold tracking-wide text-osu-black/50">{label}</div>
      <div className="mt-1 font-semibold text-osu-black">{children}</div>
    </div>
  )
}
