import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkBase =
  'flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-[11px] font-bold uppercase tracking-wide transition-colors sm:flex-row sm:gap-1.5 sm:text-sm'

export default function NavBar() {
  const { profile, isAdmin, signOut } = useAuth()

  const navClass = ({ isActive }) =>
    `${linkBase} ${isActive ? 'text-osu-orange' : 'text-osu-paper/60 hover:text-osu-paper'}`

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-osu-orange/20 bg-osu-black text-osu-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg text-osu-orange">Smith Family</span>
            <span className="font-display text-lg">OSU Football Uniform Pick Competition</span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <NavLink to="/picks" className={navClass}>
              My Picks
            </NavLink>
            <NavLink to="/results" className={navClass}>
              Results
            </NavLink>
            <NavLink to="/standings" className={navClass}>
              Standings
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-osu-paper/70 sm:inline">{profile?.display_name}</span>
            <button
              onClick={signOut}
              className="rounded-full border border-osu-paper/30 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-osu-paper/80 hover:border-osu-orange hover:text-osu-orange"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-osu-orange/20 bg-osu-black sm:hidden">
        <div className="mx-auto flex max-w-5xl items-stretch justify-around">
          <NavLink to="/picks" className={navClass}>
            Picks
          </NavLink>
          <NavLink to="/results" className={navClass}>
            Results
          </NavLink>
          <NavLink to="/standings" className={navClass}>
            Standings
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}
        </div>
      </nav>
    </>
  )
}
