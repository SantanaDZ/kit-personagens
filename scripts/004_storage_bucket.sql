-- Cria bucket público para assets dos kits
insert into storage.buckets (id, name, public)
values ('kit-assets', 'kit-assets', true)
on conflict (id) do update set public = true;

-- Qualquer pessoa pode ler arquivos (necessário para imagens de capa públicas)
create policy "kit-assets leitura pública"
  on storage.objects for select
  using (bucket_id = 'kit-assets');

-- Apenas admins podem fazer upload (via service role no backend, sem RLS)
-- O upload é feito pelo service role key, que bypassa todas as policies
