'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  // Troca o ?code= por uma sessão válida (PKCE flow do Supabase)
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setInvalid(true)
      return
    }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setInvalid(true)
      } else {
        setReady(true)
      }
    })
  }, [searchParams])

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
      toast.error('Não foi possível alterar a senha. Solicite um novo link.')
    } else {
      toast.success('Senha definida com sucesso!')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Kits Criativos</h1>
            <p className="text-muted-foreground mt-1">Redefinição de senha</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Nova senha</CardTitle>
              <CardDescription>
                {invalid
                  ? 'Este link é inválido ou já expirou.'
                  : 'Escolha uma nova senha para sua conta'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invalid ? (
                <div className="space-y-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Solicite um novo link na página de login.
                  </p>
                  <Button className="w-full" asChild>
                    <a href="/auth/forgot-password">Solicitar novo link</a>
                  </Button>
                </div>
              ) : !ready ? (
                <p className="text-sm text-muted-foreground text-center py-4">Verificando link...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nova senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
