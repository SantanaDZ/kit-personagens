'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import { FileText, Printer, Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GuideSectionProps {
  title: string
  guideText: string | null
}

export function GuideSection({ title, guideText }: GuideSectionProps) {
  const [isExporting, setIsExporting] = useState(false)

  if (!guideText) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center text-muted-foreground">
        <FileText className="h-10 w-10" />
        <p>Nenhum guia disponível para este kit ainda.</p>
      </div>
    )
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    const element = document.getElementById('kit-guide-printable')
    if (!element) return

    setIsExporting(true)
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
      const html2canvas = html2canvasModule.default

      const canvas = await html2canvas(element, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`guia-${slugify(title)}.pdf`)
    } catch {
      toast.error('Não foi possível gerar o PDF do guia.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 kit-no-print">
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          <span>Imprimir guia</span>
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={handleDownloadPdf} disabled={isExporting}>
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span>Baixar PDF</span>
        </Button>
      </div>

      <div id="kit-guide-printable" className="kit-guide-content">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{guideText}</ReactMarkdown>
      </div>
    </div>
  )
}
