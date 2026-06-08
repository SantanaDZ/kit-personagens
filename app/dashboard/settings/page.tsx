'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { KeyRound } from 'lucide-react'

export default function SettingsPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Senha alterada com sucesso')
      setPassword('')
      setConfirm('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie os dados da sua conta</p>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Alterar senha</p>
            <p className="text-sm text-muted-foreground">Escolha uma nova senha para sua conta</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar nova senha</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
