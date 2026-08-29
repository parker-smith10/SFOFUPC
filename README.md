# The Smith Family Oklahoma State Football Uniform Picking Competition

A private web app for a small group (8 people) to compete in guessing what
uniform combination the Oklahoma State University football team will wear
each game. Before each game's lock time, contestants pick
helmet/jersey/pants/logo; after the game, the admin enters the real combo
and everyone gets 1 point per correct pick (4 max/week) across a ~13-game
season.

## Tech stack

- React + Vite + Tailwind CSS (client-side SPA)
- Supabase (Postgres, Auth, Row Level Security)
- Netlify (static hosting, auto-deploy on push)

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env file and fill in your Supabase project's URL and anon/publishable key
   (Supabase dashboard → Project Settings → API):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
   ```

   `.env` is gitignored — never commit it. Only the **anon/publishable** key
   goes in the frontend; the Supabase **service role key** must never appear
   in this codebase.

3. Run the schema migration (see below) before starting the app, otherwise
   queries will fail with "relation does not exist".

4. Start the dev server:

   ```bash
   npm run dev
   ```

## Running the SQL migration in Supabase

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Click **Run**.

This creates the `profiles`, `games`, `options`, and `picks` tables, enables
Row Level Security with the policies described below, seeds the initial
`options` (Black/Orange/White helmet/jersey/pants, and the three logo
choices), and installs two helper triggers:

- `handle_new_user` — automatically creates a `profiles` row whenever the
  admin creates a new account in the Auth dashboard.
- `protect_is_admin` — blocks anyone but an existing admin from ever setting
  `is_admin = true` on a profile, even via a raw API call.

If you ever need to change the schema afterwards, add a new file
`supabase/migrations/000N_description.sql` and run it the same way — this
project does not use the Supabase CLI's migration runner, just the SQL editor.

### RLS policy summary

| Table      | Read                                                              | Write                                                          |
|------------|--------------------------------------------------------------------|-----------------------------------------------------------------|
| `profiles` | everyone (authenticated)                                          | user can edit own `display_name`; only admin can change `is_admin` |
| `games`    | everyone                                                           | admin only                                                       |
| `options`  | everyone                                                           | admin only                                                       |
| `picks`    | own picks always; others' picks only after that game's `lock_at`; admin sees all, always | own picks, only while `lock_at` is in the future; admin can do anything |

### Verifying the security model (do this before building on top of it)

1. In Supabase Auth, create two test users (see next section for the exact
   steps) — mark neither as admin yet.
2. In the SQL editor, add one game with `lock_at` a few minutes in the future.
3. Sign in as **User A** in the app (or via `curl`/Postman against
   `/rest/v1/picks` with User A's access token) and submit a pick for that
   game.
4. Still as User A, confirm `select * from picks` (via the app or REST)
   returns **only** their own row — User B's row (if any) should not be
   visible, and there shouldn't be a way to read User B's pick directly by id.
5. Sign in as **User B** and confirm the same: only their own pick is visible,
   and attempting to `insert`/`update` a row with `user_id` set to User A's id
   is rejected.
6. Wait for `lock_at` to pass (or edit it in the SQL editor to a past
   timestamp), then reload as either user — both picks should now be visible
   to both users, and any insert/update attempt on that game should now be
   rejected for everyone except an admin.
7. Mark one profile as admin directly in SQL:
   `update public.profiles set is_admin = true where id = '<uuid>';`
   Sign in as that user and confirm the Admin nav link appears, and that they
   can see all picks (including before lock) and edit games/options.

## Creating the 8 user accounts and marking one as admin

There is no public sign-up page by design. Create accounts as the admin:

1. Supabase dashboard → **Authentication** → **Users** → **Add user**.
2. Enter the contestant's email and a temporary password (share it with them
   out of band; they can change it later from Supabase's password reset flow
   if you enable it, or you can just reset it for them from this same screen).
3. Optionally set **User Metadata** to `{"display_name": "Their Name"}` so
   their leaderboard name is set correctly right away. If you skip this, the
   `handle_new_user` trigger falls back to the local part of their email
   (e.g. `jdoe` from `jdoe@example.com`), and you can rename them later from
   **Admin → Users** in the app.
4. Repeat for all 8 contestants (the admin is one of the 8 and also makes
   picks like everyone else).
5. Once every account exists, promote exactly one to admin from the SQL
   editor:

   ```sql
   update public.profiles set is_admin = true where id = '<their auth.users uuid>';
   ```

   (Find the uuid in Authentication → Users, or `select id, display_name from public.profiles;`.)

## Connecting to Netlify

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. In Netlify: **Add new site** → **Import an existing project** → pick this
   GitHub repo.
3. Build settings are already defined in [`netlify.toml`](netlify.toml)
   (`npm run build`, publish directory `dist`, SPA redirect to `index.html`)
   — Netlify should pick them up automatically.
4. Under **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   using the same values as your local `.env`.
5. Trigger a deploy (or just push to the connected branch) — Netlify will
   auto-deploy on every push going forward.

## Project structure

```
src/
  lib/            Supabase client, scoring logic, small helpers
  context/        Auth context (session + profile)
  components/     Shared UI (nav, countdown, uniform preview, route guards)
  pages/          Login, My Picks, Results, Standings
  pages/admin/    Schedule, Results entry, Options, Users, All Picks
supabase/
  migrations/     SQL schema + RLS policies + seed data
```

## Notes / known v1 limitations

- Account creation is done via the Supabase dashboard, not an in-app flow
  (per the project brief — building a full admin user-creation flow was
  judged unnecessary complexity for 8 fixed contestants).
- Options are a single global list per category (no per-game override yet).
- No email notifications/reminders about upcoming lock times.
