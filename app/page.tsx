import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Music, BookOpen, Sparkles, ArrowRight, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function formatPrice(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { data: kits } = await supabase
    .from('kits')
    .select('id, title, description, cover_image_url, price')
    .eq('is_active', true)
    .not('price', 'is', null)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold">Kits Criativos</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Cadastrar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-24 text-center md:py-32">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Experiências musicais únicas para seu filho
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            Cada kit contém uma música original, uma história encantadora, um personagem cativante e um guia completo de uso. Tudo para criar momentos mágicos em família.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="#kits">
                Ver kits disponíveis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Já tenho conta</Link>
            </Button>
          </div>
        </section>

        {/* Kits disponíveis */}
        {(kits ?? []).length > 0 && (
          <section id="kits" className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-20 max-w-6xl">
              <h2 className="text-center text-3xl font-bold tracking-tight mb-12">
                Kits disponíveis
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(kits ?? []).map((kit) => (
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
                      <h3 className="font-semibold text-lg leading-tight">{kit.title}</h3>
                      {kit.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {kit.description}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-0 pb-4">
                      <span className="text-xl font-bold">
                        {kit.price ? formatPrice(kit.price) : ''}
                      </span>
                      <Button size="sm" asChild>
                        <Link href="/auth/sign-up">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Adquirir
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Crie uma conta gratuita para comprar e acessar seus kits
              </p>
            </div>
          </section>
        )}

        {/* O que tem em cada kit */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-24">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              O que você encontra em cada Kit
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Música Original</h3>
                <p className="mt-2 text-muted-foreground">
                  Uma música exclusiva composta especialmente para o kit, com melodias envolventes e letras educativas.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">História Encantadora</h3>
                <p className="mt-2 text-muted-foreground">
                  Uma narrativa cativante que dá vida ao personagem e conecta todos os elementos do kit.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Personagem e Guia</h3>
                <p className="mt-2 text-muted-foreground">
                  Um personagem ilustrado e um guia completo com dicas de como aproveitar ao máximo cada kit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex h-16 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            Kits Criativos — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
