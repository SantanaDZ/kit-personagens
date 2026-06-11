'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle, Unlock, Music, LogIn, Sparkles } from 'lucide-react'
import { unlockKit } from '@/lib/api'
import { toast } from 'sonner'

interface CatalogKit {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  unlocked: boolean
}

interface Subscription {
  id: string
  planName: string
  kitLimit: number | null
  creditsUsed: number
  creditsRemaining: number | null
  periodEnd: string
}

interface CatalogGridProps {
  kits: CatalogKit[]
  isLoggedIn: boolean
  subscription: Subscription | null
}

export function CatalogGrid({ kits, isLoggedIn, subscription }: CatalogGridProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUnlock = async (kitId: string) => {
    if (!isLoggedIn) {
      router.push('/auth/login?next=/catalog')
      return
    }
    setLoadingId(kitId)
    try {
      await unlockKit(kitId)
      toast.success('Kit desbloqueado! Acesse pelo seu dashboard.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desbloquear kit')
    } finally {
      setLoadingId(null)
    }
  }

  if (kits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <Sparkles className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Nenhum kit por aqui ainda</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos preparando novos kits. Volte em breve para conferir as novidades!
        </p>
      </div>
    )
  }

  const hasCredits = subscription && (
    subscription.creditsRemaining === null || subscription.creditsRemaining > 0
  )

  return (
    <div className="space-y-6">
      {subscription && (
        <div className="flex items-center justify-between rounded-lg border bg-card px-5 py-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Plano {subscription.planName}</span>
            <span className="text-sm text-muted-foreground">
              {subscription.creditsRemaining === null
                ? 'Kits ilimitados'
                : `${subscription.creditsRemaining} crédito${subscription.creditsRemaining !== 1 ? 's' : ''} restante${subscription.creditsRemaining !== 1 ? 's' : ''}`}
            </span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/planos">Gerenciar plano</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {kits.map((kit) => (
          <Card key={kit.id} className="overflow-hidden flex flex-col">
            <div className="w-full aspect-video bg-muted overflow-hidden">
              {kit.cover_image_url ? (
                <Image
                  src={kit.cover_image_url}
                  alt={kit.title}
                  width={640}
                  height={360}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Music className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
            </div>

            <CardContent className="flex-1 pt-4">
              <h2 className="font-semibold text-lg leading-tight">{kit.title}</h2>
              {kit.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  {kit.description}
                </p>
              )}
            </CardContent>

            <CardFooter className="pt-0 pb-4">
              {kit.unlocked ? (
                <div className="flex w-full items-center justify-between gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Desbloqueado
                  </Badge>
                  <Button variant="outline" className="h-12 text-base" asChild>
                    <Link href={`/dashboard/kit/${kit.id}`}>Acessar</Link>
                  </Button>
                </div>
              ) : !isLoggedIn ? (
                <Button variant="outline" className="h-12 w-full text-base" asChild>
                  <Link href="/auth/login?next=/catalog">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar para assinar
                  </Link>
                </Button>
              ) : !subscription ? (
                <Button className="h-12 w-full text-base" asChild>
                  <Link href="/planos">Ver planos</Link>
                </Button>
              ) : !hasCredits ? (
                <Button variant="outline" className="h-12 w-full text-base" asChild>
                  <Link href="/planos">Fazer upgrade</Link>
                </Button>
              ) : (
                <Button
                  className="h-12 w-full text-base"
                  onClick={() => handleUnlock(kit.id)}
                  disabled={loadingId === kit.id}
                >
                  {loadingId === kit.id ? (
                    <Spinner className="mr-2" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-2" />
                  )}
                  {loadingId === kit.id ? 'Desbloqueando...' : 'Desbloquear'}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
