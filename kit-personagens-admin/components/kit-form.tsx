'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/file-upload'
import { toast } from 'sonner'
import { ArrowLeft, Music, BookOpen, User, FileText } from 'lucide-react'
import Link from 'next/link'

interface Kit {
  id: string
  title: string
  description: string | null
  price: number | null
  stripe_price_id: string | null
  is_active: boolean
  music_url: string | null
  music_title: string | null
  story_text: string | null
  video_url: string | null
  character_name: string | null
  character_description: string | null
  character_image_url: string | null
  guide_text: string | null
  cover_image_url: string | null
}

export function KitForm({ kit }: { kit?: Kit }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [title, setTitle] = useState(kit?.title ?? '')
  const [description, setDescription] = useState(kit?.description ?? '')
  const [isActive, setIsActive] = useState(kit?.is_active ?? true)
  const [priceInput, setPriceInput] = useState(kit?.price ? (kit.price / 100).toFixed(2) : '')
  const [coverImageUrl, setCoverImageUrl] = useState(kit?.cover_image_url ?? '')
  const [musicUrl, setMusicUrl] = useState(kit?.music_url ?? '')
  const [musicTitle, setMusicTitle] = useState(kit?.music_title ?? '')
  const [storyText, setStoryText] = useState(kit?.story_text ?? '')
  const [videoUrl, setVideoUrl] = useState(kit?.video_url ?? '')
  const [characterName, setCharacterName] = useState(kit?.character_name ?? '')
  const [characterDescription, setCharacterDescription] = useState(kit?.character_description ?? '')
  const [characterImageUrl, setCharacterImageUrl] = useState(kit?.character_image_url ?? '')
  const [guideText, setGuideText] = useState(kit?.guide_text ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const price = priceInput
      ? Math.round(parseFloat(priceInput.replace(',', '.')) * 100)
      : null

    const body = {
      title, description: description || null, is_active: isActive, price,
      cover_image_url: coverImageUrl || null,
      music_url: musicUrl || null, music_title: musicTitle || null,
      story_text: storyText || null, video_url: videoUrl || null,
      character_name: characterName || null, character_description: characterDescription || null,
      character_image_url: characterImageUrl || null, guide_text: guideText || null,
    }

    try {
      const res = await apiFetch(kit ? `/admin/kits/${kit.id}` : '/admin/kits', {
        method: kit ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(kit ? 'Kit atualizado' : 'Kit criado')
        router.push('/dashboard/kits')
        router.refresh()
      } else {
        const json = await res.json()
        toast.error(json.error ?? 'Erro ao salvar kit')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro de conexão com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" asChild>
          <Link href="/dashboard/kits"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Label htmlFor="is-active">Ativo</Label>
          <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : kit ? 'Salvar Alterações' : 'Criar Kit'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>Dados gerais e preço do kit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0,00"
                className="pl-9"
              />
            </div>
            {kit?.stripe_price_id && (
              <p className="text-xs text-muted-foreground">Stripe Price ID: {kit.stripe_price_id}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Imagem de Capa</Label>
            <FileUpload value={coverImageUrl} onChange={setCoverImageUrl} accept="image/*" folder="covers" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="musica" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="musica"><Music className="h-4 w-4 mr-1.5 hidden sm:inline" />Música</TabsTrigger>
          <TabsTrigger value="historia"><BookOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />História</TabsTrigger>
          <TabsTrigger value="personagem"><User className="h-4 w-4 mr-1.5 hidden sm:inline" />Personagem</TabsTrigger>
          <TabsTrigger value="guia"><FileText className="h-4 w-4 mr-1.5 hidden sm:inline" />Guia</TabsTrigger>
        </TabsList>

        <TabsContent value="musica" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Música</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Título da Música</Label>
                <Input value={musicTitle} onChange={(e) => setMusicTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Arquivo de Áudio</Label>
                <FileUpload value={musicUrl} onChange={setMusicUrl} accept="audio/*" folder="music" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historia" className="mt-6">
          <Card>
            <CardHeader><CardTitle>História</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Texto</Label>
                <Textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} rows={10} />
              </div>
              <div className="grid gap-2">
                <Label>Vídeo (opcional)</Label>
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole o link do YouTube (ou uma URL direta de vídeo).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personagem" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Personagem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Nome</Label>
                <Input value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea value={characterDescription} onChange={(e) => setCharacterDescription(e.target.value)} rows={4} />
              </div>
              <div className="grid gap-2">
                <Label>Ilustração</Label>
                <FileUpload value={characterImageUrl} onChange={setCharacterImageUrl} accept="image/*" folder="characters" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guia" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Guia de Uso</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={guideText} onChange={(e) => setGuideText(e.target.value)} rows={10} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
