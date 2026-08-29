import { NavLink, Outlet } from 'react-router-dom'

const tabClass = ({ isActive }) =>
  `rounded-md border px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
    isActive
      ? 'border-osu-orange bg-osu-orange text-white'
      : 'border-osu-black/15 bg-white text-osu-black hover:border-osu-orange/50'
  }`

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="font-display text-2xl text-osu-black">Admin</h1>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <NavLink to="/admin/schedule" className={tabClass}>
          Schedule
        </NavLink>
        <NavLink to="/admin/results" className={tabClass}>
          Enter Results
        </NavLink>
        <NavLink to="/admin/options" className={tabClass}>
          Options
        </NavLink>
        <NavLink to="/admin/users" className={tabClass}>
          Users
        </NavLink>
        <NavLink to="/admin/picks" className={tabClass}>
          All Picks
        </NavLink>
      </div>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}
