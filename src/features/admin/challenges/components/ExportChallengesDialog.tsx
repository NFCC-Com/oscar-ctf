import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Switch,
  Label,
} from '@/shared/ui'
import { DIALOG_FORM_CONTENT_CLASS } from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import { Challenge, ExportOptions } from '../types'
import { exportChallengesToPackage } from '../lib'
import { Download, Copy, Check, Search, Filter, Loader2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExportChallengesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenges: Challenge[]
}

export const ExportChallengesDialog: React.FC<ExportChallengesDialogProps> = ({
  open,
  onOpenChange,
  challenges,
}) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [includeFlags, setIncludeFlags] = useState(true)
  const [includeHints, setIncludeHints] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeSubChallenges, setIncludeSubChallenges] = useState(true)
  const [includeServices, setIncludeServices] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Initialize selected IDs when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(challenges.map((c) => c.id)))
      setSearch('')
      setSelectedCategory('all')
      setIsCopied(false)
    }
  }, [open, challenges])

  const categories = useMemo(() => {
    return Array.from(new Set(challenges.map((c) => c.category).filter(Boolean))).sort()
  }, [challenges])

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
      const matchCategory = selectedCategory === 'all' || c.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [challenges, search, selectedCategory])

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredChallenges.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredChallenges.map((c) => c.id)))
    }
  }

  const toggleChallenge = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getSelectedChallenges = () => {
    return challenges.filter((c) => selectedIds.has(c.id))
  }

  const generateExportData = async () => {
    const selected = getSelectedChallenges()
    if (selected.length === 0) {
      toast.error('Please select at least one challenge to export.')
      return null
    }

    setIsExporting(true)
    try {
      const options: ExportOptions = {
        includeFlags,
        includeHints,
        includeAttachments,
        includeSubChallenges,
        includeServices,
      }
      const data = await exportChallengesToPackage(selected, options)
      return data
    } catch (err: any) {
      console.error('Export error:', err)
      toast.error(err.message || 'Failed to export challenges')
      return null
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyClipboard = async () => {
    const data = await generateExportData()
    if (!data) return

    const jsonString = JSON.stringify(data, null, 2)
    await navigator.clipboard.writeText(jsonString)
    setIsCopied(true)
    toast.success(`Copied ${data.total} challenges to clipboard!`)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownloadJson = async () => {
    const data = await generateExportData()
    if (!data) return

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `nxctf-challenges-${dateStr}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${data.total} challenges as JSON!`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          DIALOG_FORM_CONTENT_CLASS,
          'flex flex-col h-[85vh] max-h-[85vh] max-w-2xl p-5 md:p-6'
        )}
        aria-describedby={undefined}
      >
        {/* Header */}
        <DialogHeader className="pb-3 border-b dark:border-gray-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Download size={15} />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Export Challenges
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Export selected challenges to JSON package for migration or backup.
                </p>
              </div>
            </div>
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 border border-blue-500/25 shrink-0">
              {selectedIds.size} / {challenges.length} Selected
            </span>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex flex-col flex-1 overflow-hidden space-y-3.5 pt-1">
          {/* Filters & Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges by title..."
                className="pl-8 h-9 text-xs"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-2.5 rounded-lg border text-xs bg-white/60 dark:bg-gray-900/60 border-gray-200/80 dark:border-gray-800 text-gray-800 dark:text-gray-200"
              >
                <option value="all">All Categories ({challenges.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({challenges.filter((c) => c.category === cat).length})
                  </option>
                ))}
              </select>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="h-9 text-xs shrink-0"
            >
              {selectedIds.size === filteredChallenges.length && filteredChallenges.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>

          {/* Challenges Selection List */}
          <div className="flex-1 overflow-y-auto border rounded-xl dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/20 p-2 space-y-1.5 scroll-hidden">
            {filteredChallenges.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No challenges match your search filters.
              </div>
            ) : (
              filteredChallenges.map((c) => {
                const isChecked = selectedIds.has(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleChallenge(c.id)}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none',
                      isChecked
                        ? 'border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/10 text-gray-900 dark:text-gray-100 shadow-2xs'
                        : 'border-transparent bg-white/40 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent div
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 mr-2">
                          {c.title}
                        </span>
                        {c.category && (
                          <span className="inline-block px-1.5 py-0.2 text-[10px] rounded bg-gray-200/80 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-mono">
                            {c.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                      {c.has_questions && (
                        <span className="rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 text-[10px] font-bold">
                          Sub-Quests
                        </span>
                      )}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {c.points} pts
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Export Settings Options */}
          <div className="p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Data Inclusions:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                <Switch
                  checked={includeFlags}
                  onCheckedChange={setIncludeFlags}
                  className="scale-80"
                />
                <span>Flags & Answers</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                <Switch
                  checked={includeHints}
                  onCheckedChange={setIncludeHints}
                  className="scale-80"
                />
                <span>Hints & Attachments</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                <Switch
                  checked={includeSubChallenges}
                  onCheckedChange={setIncludeSubChallenges}
                  className="scale-80"
                />
                <span>Sub-Challenges</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t dark:border-gray-800 flex flex-row items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting || selectedIds.size === 0}
              onClick={handleCopyClipboard}
              className="text-xs gap-1.5"
            >
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {isCopied ? 'Copied!' : 'Copy JSON'}
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isExporting || selectedIds.size === 0}
              onClick={handleDownloadJson}
              className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Download JSON ({selectedIds.size})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportChallengesDialog
