# Project Manager — Setup Guide (Supabase)

This connects a private upload page (`project-manager.html`) to **its own Supabase
project** — completely separate from `maleek-tech.web.app` (the ERP, built and
managed by a different developer). Nothing here touches that system, and you don't
need any access to it.

Once set up, you upload project images/videos through `project-manager.html`, and
they appear automatically on the public **Projects** page (`projects.html`).
Visitors never see the upload page — it isn't linked anywhere in the site's menus,
and its Upload/Delete actions are blocked by database rules unless you're signed in.

Takes about 10–15 minutes.

**New in this version:** images are automatically compressed before upload (resized
and re-encoded, videos untouched), you can mark a project as **Featured** to pin it
to the top of the public gallery, and use the **↑ / ↓** buttons in the admin list to
manually reorder projects. This requires an `update` permission that earlier
versions of the setup didn't need — make sure you run the policy below even if
you already created the table.

---

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) → sign in → **New project**. Pick any
name (e.g. "Maleektech Projects Gallery"), set a database password (save it
somewhere safe), and choose a region close to your visitors.

## 2. Create the `projects` table

In the Supabase dashboard, open **SQL Editor** → **New query**, paste the following,
and click **Run**:

```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  location text,
  media_type text not null,
  media_url text not null,
  storage_path text not null,
  featured boolean not null default false,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Public can read projects"
  on public.projects for select
  using (true);

create policy "Authenticated users can insert projects"
  on public.projects for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on public.projects for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete projects"
  on public.projects for delete
  to authenticated
  using (true);
```

> **Already created the table before this update?** Run this instead to add the
> two new columns without losing existing data:
> ```sql
> alter table public.projects add column featured boolean not null default false;
> alter table public.projects add column sort_order bigint not null default 0;
> create policy "Authenticated users can update projects"
>   on public.projects for update
>   to authenticated
>   using (true)
>   with check (true);
> ```

This creates the table and sets the rule that matters: **anyone can read**, but only
a **signed-in** user can add or remove entries.

## 3. Create the Storage bucket

**Storage** (left sidebar) → **New bucket** → name it exactly `projects` → toggle
**Public bucket** on → Create.

Then run this in the SQL Editor to set the same read/write rule for the files themselves:

```sql
create policy "Public can view project files"
  on storage.objects for select
  using (bucket_id = 'projects');

create policy "Authenticated users can upload project files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'projects');

create policy "Authenticated users can delete project files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'projects');
```

## 4. Create your login

**Authentication** → **Users** → **Add user** → **Create new user**. Enter the
email/password you'll use to sign in to `project-manager.html`, and make sure
**Auto Confirm User** is checked (so it doesn't wait on a confirmation email).
This is the only account that can upload or delete.

## 5. Get your API keys

**Project Settings** (gear icon) → **API**. Copy:
- **Project URL**
- **anon public** key (NOT the `service_role` key — never put that one in
  client-side code)

Paste both into `js/supabase-config.js`, replacing the placeholders:

```js
export const supabaseConfig = {
  url: "https://your-project-ref.supabase.co",
  anonKey: "your-anon-key-here",
  bucket: "projects"
};
```

These values are safe to expose publicly — the real security boundary is the RLS
policies from steps 2–3, not this config.

## 6. Where to host the site files

This is a set of static files (HTML/CSS/JS) — host them anywhere: Netlify, Vercel,
cPanel, Firebase Hosting, wherever you'd like the main marketing site to live. It
does **not** need to be on `maleek-tech.web.app` and is entirely independent of the ERP.

## 7. Test it

1. Visit `yoursite.com/project-manager.html` directly (bookmark it — it's in no menu)
2. Sign in with the account from step 4
3. Upload a test project with an image
4. Open `projects.html` in a normal or incognito tab — it should appear automatically

## Notes

- **Extra obscurity (optional):** real security is the login + RLS policies above,
  not the filename. If you'd like the URL itself to be harder to stumble on, rename
  `project-manager.html` to something less guessable — just remember it.
- **Adding more admins:** add their email under Authentication → Users. Anyone not
  listed can never sign in, regardless of the URL.
- **Completely isolated from the ERP:** this uses its own Supabase project, its own
  login system, and its own database — nothing here can affect or interfere with
  `maleek-tech.web.app` or the other developer's work.
- **service_role key:** Supabase also shows a `service_role` key in the API
  settings — that one bypasses all security rules and must never appear in any
  file that ships to a browser. This project only ever uses the `anon` key.
