'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { VariantProps } from 'class-variance-authority'

interface DownloadIllustrationButtonProps {
  imageUrl: string
  filename: string
  label?: string
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  showLabel?: boolean
  className?: string
}

// Baixa a ilustracao via fetch -> blob -> <a download>, porque o atributo
// download nativo e ignorado pelo navegador para URLs cross-origin (como as
// do Supabase Storage).
export function DownloadIllustrationButton({
  imageUrl,
  filename,
  label = 'Baixar ilustração',
  variant = 'outline',
  size,
  showLabel = true,
  className = 'min-h-11',
}: DownloadIllustrationButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(imageUrl)
      if (!res.ok) throw new Error('download failed')

      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Não foi possível baixar a ilustração.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={isDownloading}
      aria-label={label}
    >
      {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {showLabel && <span>{label}</span>}
    </Button>
  )
}
