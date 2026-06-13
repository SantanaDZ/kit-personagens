-- ============================================================
-- Script 008: Bucket privado para áudio + caminho do arquivo
--
-- O bucket "kit-assets" é público (necessário para imagens de
-- capa e personagem). As músicas não podem ficar lá: qualquer
-- pessoa com a URL pública consegue baixar o MP3 para sempre.
--
-- 1) Bucket "audio": privado, sem policy de leitura para
--    anon/authenticated. Acesso só via service role (que
--    bypassa RLS) gerando signed URLs de curta duração.
-- 2) kits.music_path: caminho do arquivo dentro do bucket
--    "audio" (ex: "{kitId}/musica.mp3"). A coluna music_url
--    antiga permanece, mas o player passa a ignorá-la.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do update set public = false;

ALTER TABLE public.kits ADD COLUMN IF NOT EXISTS music_path TEXT;
