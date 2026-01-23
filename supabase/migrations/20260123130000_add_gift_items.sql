-- Create gift_items table
create table public.gift_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stock_count integer default 0 not null,
  image_url text,
  is_active boolean default true,
  event_id uuid references public.events(id) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.gift_items is 'ギフト商品と在庫数を管理';
alter table public.gift_items enable row level security;

-- Grant access to authenticated users
create policy "Authenticated users can manage gifts"
  on public.gift_items
  for all
  to authenticated
  using (true)
  with check (true);

-- Update gift_logs to reference gift_items optionally (for better integrity)
alter table public.gift_logs 
  add column if not exists gift_item_id uuid references public.gift_items(id);
