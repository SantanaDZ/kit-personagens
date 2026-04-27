'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Pencil, Trash2, Music, BookOpen, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

interface Kit {
  id: string
  title: string
  is_active: boolean
  price: number | null
  music_url: string | null
  story_text: string | null
  character_name: string | null
  guide_text: string | null
  created_at: string
}

export function KitsTable({ kits: initial }: { kits: Kit[] }) {
  const router = useRouter()
  const [kits, setKits] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    setDeleting(confirmId)
    const res = await apiFetch(`/admin/kits/${confirmId}`, { method: 'DELETE' })
    if (res.ok) {
      setKits((prev) => prev.filter((k) => k.id !== confirmId))
      toast.success('Kit removido')
    } else {
      toast.error('Erro ao remover kit')
    }
    setDeleting(null)
    setConfirmId(null)
  }

  return (
    <>
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Título</th>
              <th className="px-4 py-3 text-left font-medium">Preço</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Conteúdo</th>
              <th className="px-4 py-3 text-left font-medium">Criado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {kits.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum kit cadastrado
                </td>
              </tr>
            )}
            {kits.map((kit) => (
              <tr key={kit.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{kit.title}</td>
                <td className="px-4 py-3">
                  {kit.price ? formatPrice(kit.price) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={kit.is_active ? 'default' : 'secondary'}>
                    {kit.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {kit.music_url && <Music className="h-3.5 w-3.5 text-muted-foreground" />}
                    {kit.story_text && <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
                    {kit.character_name && <User className="h-3.5 w-3.5 text-muted-foreground" />}
                    {kit.guide_text && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(kit.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/dashboard/kits/${kit.id}/edit`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmId(kit.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirmId} onOpenChange={(open) => !open && setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover kit</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. O kit será removido do Stripe e todos os acessos serão mantidos para quem já adquiriu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!deleting}>
              {deleting ? 'Removendo...' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
