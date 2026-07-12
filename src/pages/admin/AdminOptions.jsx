import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CATEGORIES } from '../../lib/constants'
import Spinner from '../../components/Spinner'

export default function AdminOptions() {
  const [loading, setLoading] = useState(true)
  const [options, setOptions] = useState([])
  const [newValue, setNewValue] = useState({ helmet: '', jersey: '', pants: '', logo: '' })
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
    if (error) setError(error.message)
    setOptions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const addOption = async (category) => {
    const value = newValue[category].trim()
    if (!value) return
    const catOptions = options.filter((o) => o.category === category)
    const maxOrder = catOptions.reduce((m, o) => Math.max(m, o.sort_order), -1)
    const { error } = await supabase
      .from('options')
      .insert({ category, value, is_active: true, sort_order: maxOrder + 1 })
    if (error) {
      setError(error.message)
      return
    }
    setNewValue((v) => ({ ...v, [category]: '' }))
    load()
  }

  const toggleActive = async (opt) => {
    const { error } = await supabase
      .from('options')
      .update({ is_active: !opt.is_active })
      .eq('id', opt.id)
    if (error) setError(error.message)
    load()
  }

  const move = async (opt, direction) => {
    const catOptions = options
      .filter((o) => o.category === opt.category)
      .sort((a, b) => a.sort_order - b.sort_order)
    const idx = catOptions.findIndex((o) => o.id === opt.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= catOptions.length) return
    const other = catOptions[swapIdx]

    await Promise.all([
      supabase.from('options').update({ sort_order: other.sort_order }).eq('id', opt.id),
      supabase.from('options').update({ sort_order: opt.sort_order }).eq('id', other.id),
    ])
    load()
  }

  if (loading) return <Spinner full />

  return (
    <div className="space-y-8">
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      {CATEGORIES.map(({ key, label }) => {
        const catOptions = options
          .filter((o) => o.category === key)
          .sort((a, b) => a.sort_order - b.sort_order)
        return (
          <div key={key} className="rounded-xl border border-osu-black/10 bg-white p-4 shadow-sm">
            <h3 className="font-display text-lg">{label}</h3>
            <div className="mt-3 space-y-2">
              {catOptions.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                    opt.is_active ? 'border-osu-black/10' : 'border-osu-black/5 opacity-50'
                  }`}
                >
                  <span className="font-medium">{opt.value}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => move(opt, 'up')}
                      disabled={i === 0}
                      className="rounded border border-osu-black/15 px-2 py-1 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(opt, 'down')}
                      disabled={i === catOptions.length - 1}
                      className="rounded border border-osu-black/15 px-2 py-1 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => toggleActive(opt)}
                      className="rounded-full border border-osu-black/15 px-3 py-1 text-xs font-semibold"
                    >
                      {opt.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder={`Add ${label.toLowerCase()} option…`}
                value={newValue[key]}
                onChange={(e) => setNewValue((v) => ({ ...v, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addOption(key)}
                className="flex-1 rounded-lg border border-osu-black/15 px-3 py-2 text-sm"
              />
              <button
                onClick={() => addOption(key)}
                className="rounded-lg bg-osu-black px-4 py-2 text-sm font-semibold text-osu-paper"
              >
                Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
