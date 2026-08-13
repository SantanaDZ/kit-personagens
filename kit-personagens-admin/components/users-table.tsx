'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'
import { Settings, KeyRound } from 'lucide-react'
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

type AccessDuration = '1m' | '3m' | '6m' | '1y' | 'custom' | 'none'

const DURATION_OPTIONS: { value: AccessDuration; label: string }[] = [
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
  { value: 'none', label: 'Sem expiração' },
  { value: 'custom', label: 'Personalizado' },
]

interface UserKitsInfo {
  kitIds: string[]
  expiresAt: string | null
}

async function fetchUserKits(userId: string): Promise<UserKitsInfo> {
  const res = await apiFetch(`/admin/users/${userId}/kits`)
  const json = await res.json()
  return { kitIds: json.kitIds ?? [], expiresAt: json.expiresAt ?? null }
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
  const { data, mutate } = useSWR(`user-kits-${user.id}`, () => fetchUserKits(user.id))
  const currentKitIds = data?.kitIds ?? []
  const [selected, setSelected] = useState<Set<string>>(new Set(currentKitIds))
  const [duration, setDuration] = useState<AccessDuration>('1m')
  const [customDate, setCustomDate] = useState('')
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
    if (duration === 'custom' && !customDate) {
      toast.error('Escolha uma data para o acesso personalizado')
      return
    }
    setIsSaving(true)
    const res = await apiFetch(`/admin/users/${user.id}/kits`, {
      method: 'PUT',
      body: JSON.stringify({
        kitIds: Array.from(selected),
        duration,
        ...(duration === 'custom' ? { customDate } : {}),
      }),
    })
    if (res.ok) {
      mutate()
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

        {currentKitIds.length > 0 && (
          <p className="text-xs text-muted-foreground -mt-1">
            Acesso atual: {data?.expiresAt
              ? `expira em ${format(new Date(data.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}`
              : 'permanente'}
          </p>
        )}

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

        <div className="space-y-2 border-t pt-3">
          <Label htmlFor="access-duration">Duração do acesso</Label>
          <select
            id="access-duration"
            className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            value={duration}
            onChange={(e) => setDuration(e.target.value as AccessDuration)}
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {duration === 'custom' && (
            <input
              type="date"
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          )}
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

async function sendPasswordReset(userId: string, userName: string | null) {
  const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
  if (res.ok) {
    toast.success(`Email de redefinição enviado para ${userName ?? 'o usuário'}`)
  } else {
    const json = await res.json().catch(() => ({}))
    toast.error(json.error ?? 'Erro ao enviar email')
  }
}

export function UsersTable({ users, kits }: { users: Profile[]; kits: Kit[] }) {
  const [managing, setManaging] = useState<Profile | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={resettingId === user.id}
                        onClick={async () => {
                          setResettingId(user.id)
                          await sendPasswordReset(user.id, user.full_name)
                          setResettingId(null)
                        }}
                      >
                        <KeyRound className="h-4 w-4 mr-1.5" />
                        {resettingId === user.id ? 'Enviando...' : 'Redefinir senha'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setManaging(user)}>
                        <Settings className="h-4 w-4 mr-1.5" />
                        Acessos
                      </Button>
                    </div>
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
