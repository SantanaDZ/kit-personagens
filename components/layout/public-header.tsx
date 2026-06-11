'use client'

import Link from 'next/link'
import { Menu, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6" />
          <span className="text-xl font-bold">Kits Criativos</span>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Cadastrar</Link>
          </Button>
        </div>

        <Drawer direction="bottom">
          <DrawerTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Abrir menu">
              <Menu className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
            <div className="flex flex-col gap-3 p-4 pb-8">
              <Button variant="outline" className="min-h-14 w-full text-base" asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button className="min-h-14 w-full text-base" asChild>
                <Link href="/auth/sign-up">Cadastrar</Link>
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  )
}
