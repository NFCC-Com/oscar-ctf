import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@/shared/ui'
import { DIALOG_CONTENT_CLASS_2XL } from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import { PortableChallenge, PortableHint } from '../types'
import {
  Eye,
  EyeOff,
  Flag,
  HelpCircle,
  Paperclip,
  Server,
  Layers,
  FileText,
  Zap,
} from 'lucide-react'
import { getCategoryDetails, getDifficultyStyle } from '@/features/challenges/lib'
import APP from '@/config'

interface ImportChallengePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: PortableChallenge | null
}

export const ImportChallengePreviewDialog: React.FC<ImportChallengePreviewDialogProps> = ({
  open,
  onOpenChange,
  challenge,
}) => {
  const [showFlag, setShowFlag] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'hints_attachments' | 'sub_questions' | 'services'>('general')

  if (!challenge) return null

  // Extract hints
  let hintList: string[] = []
  if (Array.isArray(challenge.hint)) {
    hintList = challenge.hint.filter(Boolean)
  } else if (typeof challenge.hint === 'string' && challenge.hint.trim()) {
    hintList = [challenge.hint]
  } else if (Array.isArray(challenge.hints)) {
    hintList = challenge.hints
      .map((h) => (typeof h === 'string' ? h : (h as PortableHint)?.content || ''))
      .filter(Boolean)
  }

  const attachments = Array.isArray(challenge.attachments) ? challenge.attachments : []
  const subChallenges = Array.isArray(challenge.sub_challenges) ? challenge.sub_challenges : []
  const services = Array.isArray(challenge.services) ? challenge.services : []

  // Difficulty styling
  const rawDiff = (challenge.difficulty || 'Easy').toString().trim()
  const normalizedDiff =
    rawDiff.toLowerCase() === 'imposible' || rawDiff.toLowerCase() === 'impossible'
      ? 'Impossible'
      : rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1).toLowerCase()
  const colorName = (APP as any).difficultyStyles?.[normalizedDiff] || 'green'
  const { badgeClass: diffBadgeColor } = getDifficultyStyle(colorName)

  const {
    color: categoryIconColor,
    borderColor: categoryBorderColor,
    badgeColor: categoryBadgeColor,
  } = getCategoryDetails(challenge.category || 'Web')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          DIALOG_CONTENT_CLASS_2XL,
          'max-w-2xl max-h-[85vh] flex flex-col p-4 md:p-5 overflow-hidden gap-3'
        )}
        aria-describedby={undefined}
      >
        {/* Compact Single Header: Badge + Title on Left, Category/Diff/Pts on Right */}
        <DialogHeader className="p-0 space-y-0 shrink-0 text-left">
          <div className="flex items-center justify-between gap-3 pb-3 border-b dark:border-gray-800/80">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                IMPORT PREVIEW
              </span>
              <DialogTitle className="text-base md:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">
                {challenge.title}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-md border font-mono',
                  categoryBadgeColor,
                  categoryBorderColor
                )}
              >
                {challenge.category || 'General'}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded-md border font-mono',
                  diffBadgeColor
                )}
              >
                {normalizedDiff}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold font-mono rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {challenge.points} pts
              </span>
              {challenge.is_dynamic && (
                <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <Zap size={10} /> DYN
                </span>
              )}
            </div>
          </div>

          {/* Clean Segmented Tab Control without extra divider lines */}
          <div className="pt-2.5">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl overflow-x-auto scroll-hidden">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap',
                  activeTab === 'general'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <FileText size={13} />
                Description & Flag
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hints_attachments')}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap',
                  activeTab === 'hints_attachments'
                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                <Paperclip size={13} />
                Hints & Files ({hintList.length + attachments.length})
              </button>

              {subChallenges.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('sub_questions')}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap',
                    activeTab === 'sub_questions'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Layers size={13} />
                  Sub-Quests ({subChallenges.length})
                </button>
              )}

              {services.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className={cn(
                    'px-3 py-1.5 text-xs rounded-lg font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap',
                    activeTab === 'services'
                      ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 font-semibold shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  )}
                >
                  <Server size={13} />
                  Services ({services.length})
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-2 space-y-3.5 pr-1 text-left">
          {activeTab === 'general' && (
            <div className="space-y-3.5">
              {/* Description Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Challenge Description:
                </span>
                <div className="p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 text-xs">
                  {challenge.description ? (
                    <MarkdownRenderer content={challenge.description} />
                  ) : (
                    <span className="italic text-gray-400">No description provided.</span>
                  )}
                </div>
              </div>

              {/* Flag Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Flag size={12} className="text-emerald-500" />
                    Plaintext Flag:
                  </span>
                  {challenge.flag && (
                    <button
                      type="button"
                      onClick={() => setShowFlag(!showFlag)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {showFlag ? <EyeOff size={12} /> : <Eye size={12} />}
                      {showFlag ? 'Hide Flag' : 'Reveal Flag'}
                    </button>
                  )}
                </div>

                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  {challenge.flag ? (
                    <span className="select-all break-all">
                      {showFlag ? challenge.flag : '•'.repeat(Math.min(challenge.flag.length, 24))}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">No flag specified (requires manual setup).</span>
                  )}
                </div>
              </div>

              {/* Dynamic Score details if enabled */}
              {challenge.is_dynamic && (
                <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
                      Min Points:
                    </span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {challenge.min_points ?? 100} pts
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-bold">
                      Decay Per Solve:
                    </span>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {challenge.decay_per_solve ?? 10} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hints_attachments' && (
            <div className="space-y-3.5">
              {/* Hints */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <HelpCircle size={12} className="text-amber-500" />
                  Hints ({hintList.length}):
                </span>
                {hintList.length > 0 ? (
                  <div className="space-y-1.5">
                    {hintList.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-300"
                      >
                        <span className="font-bold mr-1.5">#{idx + 1}:</span>
                        {hint}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed dark:border-gray-800 text-xs text-gray-400 italic">
                    No hints attached.
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Paperclip size={12} className="text-blue-500" />
                  Attachments ({attachments.length}):
                </span>
                {attachments.length > 0 ? (
                  <div className="space-y-1.5">
                    {attachments.map((att, idx) => {
                      const name = att.name || att.url?.split('/').pop() || `File ${idx + 1}`
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/20 flex items-center justify-between text-xs font-mono"
                        >
                          <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                            {name}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[240px]">
                            {att.url}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed dark:border-gray-800 text-xs text-gray-400 italic">
                    No file attachments or links.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sub_questions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Multi Questions Setup:</span>
                <span className="font-mono text-indigo-500 font-semibold">
                  {subChallenges.length} Questions (
                  {subChallenges[0]?.is_sequential ? 'Sequential' : 'Free Order'})
                </span>
              </div>

              <div className="space-y-2">
                {subChallenges.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-950/20 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Question #{sub.order_number || idx + 1}</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200">{sub.question}</p>
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      <span className="font-bold">Answer:</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {sub.answer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Configured NXCTL Services:
              </span>
              <div className="space-y-1.5">
                {services.map((svc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 dark:bg-cyan-950/20 font-mono text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-2"
                  >
                    <Server size={13} className="shrink-0" />
                    <span>{svc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-2 border-t dark:border-gray-800/80 flex flex-row items-center justify-end shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Tutup Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportChallengePreviewDialog
