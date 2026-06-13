// Migração manual: copia os MP3s do bucket público "kit-assets" (pasta
// music/) para o bucket privado "audio" e preenche kits.music_path.
//
// NÃO apaga os arquivos antigos em kit-assets/music — isso é um passo
// separado, feito só depois de validar que o player novo funciona.
//
// Requer scripts/008_audio_bucket.sql já aplicado (bucket "audio" +
// coluna kits.music_path).
//
// Uso: node scripts/migrate-audio-to-private-bucket.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvLocal() {
  const envPath = resolve(__dirname, '..', '.env.local')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eq = trimmed.indexOf('=')
    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvLocal()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SOURCE_BUCKET = 'kit-assets'
const TARGET_BUCKET = 'audio'

function extractSourcePath(musicUrl) {
  const marker = `/object/public/${SOURCE_BUCKET}/`
  const idx = musicUrl.indexOf(marker)
  if (idx === -1) return null
  return decodeURIComponent(musicUrl.slice(idx + marker.length))
}

async function main() {
  const { data: kits, error } = await supabase
    .from('kits')
    .select('id, title, music_url, music_path')

  if (error) throw error

  const pending = (kits ?? []).filter((k) => k.music_url && !k.music_path)

  if (pending.length === 0) {
    console.log('Nada para migrar — todos os kits já têm music_path ou não têm música.')
    return
  }

  console.log(`Migrando ${pending.length} kit(s)...\n`)

  for (const kit of pending) {
    const sourcePath = extractSourcePath(kit.music_url)
    if (!sourcePath) {
      console.warn(`[skip] ${kit.title} (${kit.id}): music_url fora de ${SOURCE_BUCKET}: ${kit.music_url}`)
      continue
    }

    const { data: file, error: downloadError } = await supabase.storage
      .from(SOURCE_BUCKET)
      .download(sourcePath)

    if (downloadError || !file) {
      console.error(`[erro] ${kit.title} (${kit.id}): falha ao baixar ${sourcePath}:`, downloadError?.message)
      continue
    }

    const filename = sourcePath.split('/').pop()
    const targetPath = `${kit.id}/${filename}`

    const { error: uploadError } = await supabase.storage
      .from(TARGET_BUCKET)
      .upload(targetPath, file, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error(`[erro] ${kit.title} (${kit.id}): falha ao enviar para ${TARGET_BUCKET}/${targetPath}:`, uploadError.message)
      continue
    }

    const { error: updateError } = await supabase
      .from('kits')
      .update({ music_path: targetPath })
      .eq('id', kit.id)

    if (updateError) {
      console.error(`[erro] ${kit.title} (${kit.id}): falha ao salvar music_path:`, updateError.message)
      continue
    }

    console.log(`[ok] ${kit.title} (${kit.id}) -> ${TARGET_BUCKET}/${targetPath}`)
  }

  console.log('\nConcluído. Os arquivos originais em kit-assets/music NÃO foram removidos.')
  console.log('Depois de validar o player, remova-os manualmente (passo separado e irreversível).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
