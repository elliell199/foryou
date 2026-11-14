-- Tempel seluruh isi file ini di Supabase: menu SQL Editor, lalu klik Run.
-- Satu tabel menampung jadwal ngedate dan wishlist.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  coll text not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.items enable row level security;

-- Siapa pun yang memegang alamat web dan kunci publik boleh membaca dan menulis.
create policy "buka untuk halaman ini" on public.items
  for all to anon
  using (true)
  with check (true);
