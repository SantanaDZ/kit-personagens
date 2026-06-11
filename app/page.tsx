import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { PublicHeader } from '@/components/layout/public-header'
import { Music, BookOpen, Sparkles, ArrowRight, ArrowDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  const { data: kits } = await supabase
    .from('kits')
    .select('id, title, description, cover_image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-5 py-24 text-center md:py-32">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary sm:text-sm">
              Kits musicais para crianças
            </p>
            <h1 className="text-balance text-[26px] font-bold tracking-tight sm:text-4xl md:text-6xl">
              Experiências musicais únicas para seu filho
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
              Cada kit contém uma música original, uma história encantadora, um personagem cativante e um guia completo de uso. Tudo para criar momentos mágicos em família.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="min-h-[52px] w-full text-base sm:w-auto" asChild>
                <Link href="/planos">
                  Ver planos e preços
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="min-h-[52px] w-full text-base sm:w-auto" asChild>
                <Link href="#kits">
                  Explorar kits
                  <ArrowDown className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Kits disponíveis */}
        {(kits ?? []).length > 0 && (
          <section id="kits" className="border-t bg-muted/30">
            <div className="container mx-auto px-5 py-20 max-w-6xl">
              <h2 className="text-center text-[20px] font-bold tracking-tight mb-12 md:text-3xl">
                Kits disponíveis
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                          {kit.description}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 pb-4">
                      <Button className="h-12 w-full text-base" asChild>
                        <Link href="/planos">
                          Acessar com assinatura
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Assine um plano e desbloqueie os kits que precisar a cada mês
              </p>
            </div>
          </section>
        )}

        {/* O que tem em cada kit */}
        <section className="border-t">
          <div className="container mx-auto px-5 py-24">
            <h2 className="text-center text-[20px] font-bold tracking-tight md:text-3xl">
              O que você encontra em cada Kit
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold md:text-xl">Música Original</h3>
                <p className="mt-2 text-muted-foreground">
                  Uma música exclusiva composta especialmente para o kit, com melodias envolventes e letras educativas.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold md:text-xl">História Encantadora</h3>
                <p className="mt-2 text-muted-foreground">
                  Uma narrativa cativante que dá vida ao personagem e conecta todos os elementos do kit.
                </p>
              </div>
              <div className="flex flex-col items-center rounded-lg border bg-card p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-[17px] font-semibold md:text-xl">Personagem e Guia</h3>
                <p className="mt-2 text-muted-foreground">
                  Um personagem ilustrado e um guia completo com dicas de como aproveitar ao máximo cada kit.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container mx-auto flex h-16 items-center justify-center px-5">
          <p className="text-sm text-muted-foreground">
            Kits Criativos — Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
