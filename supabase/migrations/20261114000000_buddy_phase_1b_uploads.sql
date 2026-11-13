-- Buddy Phase 1b: private uploads bucket, service-role grants (idempotent).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'buddy-uploads',
  'buddy-uploads',
  false,
  52428800,
  array['text/plain', 'text/csv', 'application/json', 'text/markdown']
)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists buddy_uploads_owner_select on storage.objects;
drop policy if exists buddy_uploads_owner_insert on storage.objects;
drop policy if exists buddy_uploads_owner_update on storage.objects;
drop policy if exists buddy_uploads_owner_delete on storage.objects;

-- Owner-only objects: path prefix must match auth.uid()
create policy buddy_uploads_owner_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'buddy-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy buddy_uploads_owner_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'buddy-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy buddy_uploads_owner_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'buddy-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'buddy-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy buddy_uploads_owner_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'buddy-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role bypasses RLS; grant table access for Phase 1a tables (applied by hand on hosted DB).
grant all on buddy.profiles to postgres, service_role;
grant all on buddy.private_thoughts to postgres, service_role;
grant all on buddy.memory_sources to postgres, service_role;
