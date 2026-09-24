# YOUNG CEO ORGANIC FARM Website

## Admin content management

The repository includes `admin.html`, a secure-ready admin dashboard for managing products, prices, descriptions, images, and homepage settings.

### Configure Supabase

1. Create a Supabase project.
2. In **Authentication → Providers**, enable Email.
3. Create a private Storage bucket named `farm-images`.
4. Run the SQL below in the Supabase SQL editor:

```sql
create table public.site_content (
  id bigint primary key generated always as identity,
  content_key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

create policy "Public can read site content"
  on public.site_content for select using (true);

create policy "Authenticated admins can manage site content"
  on public.site_content for all
  to authenticated using (true) with check (true);
```

5. Copy `supabase-config.example.js` to `supabase-config.js` and add the project URL and anon key. Never put a service-role key in browser code.
6. Invite the admin email in Supabase Authentication, then open `admin.html`.

The dashboard supports:
- Admin email/password login
- Editing hero, about, contact, and farm information
- Adding, editing, deleting, and reordering products
- Changing prices and descriptions
- Uploading product images to Supabase Storage
- Saving content in a hosted database

### Important

The existing public landing page is a static page. To display dashboard changes publicly, connect its product and settings sections to the `site_content` table using the same Supabase client. Do not use hardcoded passwords or localStorage for production authentication.
