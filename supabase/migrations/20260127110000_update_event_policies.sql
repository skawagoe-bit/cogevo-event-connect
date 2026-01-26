
create policy "Authenticated users can select events"
  on public.events
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert events"
  on public.events
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update events"
  on public.events
  for update
  to authenticated
  using (true);
