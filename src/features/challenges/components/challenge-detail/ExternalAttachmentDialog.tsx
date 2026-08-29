import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@/shared/ui'
import { DIALOG_FORM_CONTENT_CLASS } from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import { Attachment } from '@/shared/types'
import { ExternalLink, ShieldAlert, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExternalAttachmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attachment: Attachment | null
  url: string
}

export const ExternalAttachmentDialog: React.FC<ExternalAttachmentDialogProps> = ({
  open,
  onOpenChange,
  attachment,
  url,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success('URL disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin URL')
    }
  }

  const handleProceed = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    onOpenChange(false)
  }

  const filename = attachment?.name || url.split('/').pop()?.split('?')[0] || 'attachment'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          DIALOG_FORM_CONTENT_CLASS,
          'sm:max-w-md p-5 md:p-6 space-y-4'
        )}
        aria-describedby={undefined}
      >
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <ExternalLink size={16} />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                Tautan Attachment Eksternal
              </DialogTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Attachment ini mengarah ke URL eksternal di luar server NXCTF.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* URL Box with copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Target Attachment:</span>
            <span className="font-mono text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
              {filename}
            </span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20">
            <span className="flex-1 font-mono text-xs text-blue-600 dark:text-blue-300 break-all select-all">
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
              title="Salin URL"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Security Alert Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            Pastikan kamu mempercayai sumber file ini sebelum mengunduh atau menjalankan program dari link eksternal.
          </span>
        </div>

        <DialogFooter className="pt-2 flex flex-row items-center justify-end gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleProceed}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
          >
            <ExternalLink size={13} />
            Buka di Tab Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExternalAttachmentDialog
