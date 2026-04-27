'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Settings } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  is_admin: boolean
  created_at: string
}

interface Kit {
  id: string
  title: string
}

async function fetchUserKits(userId: string): Promise<string[]> {
  const res = await apiFetch(`/admin/users/${userId}/kits`)
  const json = await res.json()
  return json.kitIds ?? []
}

function ManageKitsDialog({
  user,
  kits,
  onClose,
}: {
  user: Profile
  kits: Kit[]
  onClose: () => void
}) {
  const { data: currentKitIds = [], mutate } = useSWR(
    `user-kits-${user.id}`,
    () => fetchUserKits(user.id)
  )
  const [selected, setSelected] = useState<Set<string>>(new Set(currentKitIds))
  const [isSaving, setIsSaving] = useState(false)

  // Sync quando carrega
  if (currentKitIds.length > 0 && selected.size === 0) {
    setSelected(new Set(currentKitIds))
  }

  const toggle = (kitId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(kitId) ? next.delete(kitId) : next.add(kitId)
      return next
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    const res = await apiFetch(`/admin/users/${user.id}/kits`, {
      method: 'PUT',
      body: JSON.stringify({ kitIds: Array.from(selected) }),
    })
    if (res.ok) {
      mutate(Array.from(selected))
      toast.success('Acessos atualizados')
      onClose()
    } else {
      toast.error('Erro ao salvar acessos')
    }
    setIsSaving(false)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acessos de {user.full_name ?? user.email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
          {kits.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum kit disponível</p>
          )}
          {kits.map((kit) => (
            <label key={kit.id} className="flex items-center gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.has(kit.id)}
                onChange={() => toggle(kit.id)}
              />
              <span className="text-sm">{kit.title}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UsersTable({ users, kits }: { users: Profile[]; kits: Kit[] }) {
  const [managing, setManaging] = useState<Profile | null>(null)

  return (
    <>
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nome</th>
              <th className="px-4 py-3 text-left font-medium">Tipo</th>
              <th className="px-4 py-3 text-left font-medium">Cadastro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{user.full_name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                    {user.is_admin ? 'Admin' : 'Cliente'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-4 py-3 text-right">
                  {!user.is_admin && (
                    <Button variant="ghost" size="sm" onClick={() => setManaging(user)}>
                      <Settings className="h-4 w-4 mr-1.5" />
                      Acessos
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {managing && (
        <ManageKitsDialog user={managing} kits={kits} onClose={() => setManaging(null)} />
      )}
    </>
  )
}
