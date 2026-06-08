'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      setError('Erro ao enviar o email. Verifique o endereço e tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Kits Criativos</h1>
            <p className="text-muted-foreground mt-1">Recuperação de senha</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
              <CardDescription>
                Digite seu email e enviaremos um link para redefinir sua senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Se esse email estiver cadastrado, você receberá o link em instantes.
                    Verifique também a caixa de spam.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/auth/login">Voltar ao login</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                  </Button>
                  <div className="text-center text-sm">
                    <Link
                      href="/auth/login"
                      className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Voltar ao login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
