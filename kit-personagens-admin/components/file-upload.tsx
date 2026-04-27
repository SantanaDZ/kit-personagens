'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  value: string
  onChange: (url: string) => void
  accept: string
  folder: string
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function FileUpload({ value, onChange, accept, folder }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setErrorMessage(null)
    setFileName(file.name)

    // Limpar input para permitir re-upload do mesmo arquivo
    e.target.value = ''

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })

      let json: Record<string, string> = {}
      try {
        json = await res.json()
      } catch {
        setStatus('error')
        setErrorMessage(`Erro ${res.status}: resposta inválida do servidor`)
        return
      }

      if (!res.ok) {
        setStatus('error')
        setErrorMessage(json.error ?? `Erro ${res.status}: ${res.statusText}`)
        return
      }

      if (!json.url) {
        setStatus('error')
        setErrorMessage('Servidor não retornou a URL do arquivo')
        return
      }

      onChange(json.url)
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Erro de conexão com o servidor')
    }
  }

  const handleRemove = () => {
    onChange('')
    setStatus('idle')
    setErrorMessage(null)
    setFileName(null)
  }

  const isImage = accept.startsWith('image')
  const isAudio = accept.startsWith('audio')
  const isVideo = accept.startsWith('video')

  return (
    <div className="space-y-2">
      {/* Preview */}
      {value && isImage && (
        <img src={value} alt="preview" className="h-40 w-auto rounded-md object-cover border" />
      )}
      {value && isAudio && (
        <audio controls src={value} className="w-full" />
      )}
      {value && isVideo && (
        <video controls src={value} className="w-full rounded-md border max-h-48" />
      )}
      {value && !isImage && !isAudio && !isVideo && (
        <p className="text-xs text-muted-foreground truncate max-w-xs">{value}</p>
      )}

      {/* Status feedback */}
      {status === 'success' && fileName && (
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span className="truncate">"{fileName}" enviado com sucesso</span>
        </div>
      )}
      {status === 'error' && errorMessage && (
        <div className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {status === 'uploading' ? 'Enviando...' : value ? 'Substituir' : 'Upload'}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  )
}
