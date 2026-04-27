'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle, ShoppingCart, Music, LogIn } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { toast } from 'sonner'

interface CatalogKit {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  price: number | null
  stripe_price_id: string | null
  owned: boolean
  formattedPrice: string | null
}

interface CatalogGridProps {
  kits: CatalogKit[]
  isLoggedIn: boolean
}

export function CatalogGrid({ kits, isLoggedIn }: CatalogGridProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleBuy = async (kitId: string) => {
    if (!isLoggedIn) {
      router.push(`/auth/login?next=/catalog`)
      return
    }

    setLoadingId(kitId)
    try {
      const res = await apiFetch('/checkout', {
        method: 'POST',
        body: JSON.stringify({ kitId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Erro ao iniciar pagamento')
        return
      }
      window.location.href = json.url
    } catch {
      toast.error('Erro de conexão com o servidor')
    } finally {
      setLoadingId(null)
    }
  }

  if (kits.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Nenhum kit disponível no momento.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {kits.map((kit) => (
        <Card key={kit.id} className="overflow-hidden flex flex-col">
          <div className="w-full aspect-3/3 bg-muted overflow-hidden">
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
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {kit.description}
              </p>
            )}
          </CardContent>

          <CardFooter className="flex items-center justify-between pt-0 pb-4">
            <span className="text-xl font-bold">{kit.formattedPrice}</span>

            {kit.owned ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Adquirido
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/kit/${kit.id}`}>Acessar</Link>
                </Button>
              </div>
            ) : !isLoggedIn ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/auth/login?next=/catalog`}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Entrar para comprar
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => handleBuy(kit.id)}
                disabled={loadingId === kit.id}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {loadingId === kit.id ? 'Aguarde...' : 'Comprar'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
