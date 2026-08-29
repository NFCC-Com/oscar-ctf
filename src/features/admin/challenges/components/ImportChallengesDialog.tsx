import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Textarea,
  Switch,
  AppTabs,
} from '@/shared/ui'
import { DIALOG_FORM_CONTENT_CLASS } from '@/shared/styles'
import { cn } from '@/shared/lib/utils'
import { Challenge, Event, AdminChallengeEventId, PortableChallenge, ImportResult } from '../types'
import { parseImportInput, executeImportChallenges } from '../lib'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Trash2, Check, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportChallengesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  events: Event[]
  currentEventId?: AdminChallengeEventId
  existingChallenges: Challenge[]
  onSuccess: () => void
}

export const ImportChallengesDialog: React.FC<ImportChallengesDialogProps> = ({
  open,
  onOpenChange,
  events,
  currentEventId,
  existingChallenges,
  onSuccess,
}) => {
  const [inputMode, setInputMode] = useState<'file' | 'raw'>('file')
  const [rawText, setRawText] = useState('')
  const [parsedList, setParsedList] = useState<PortableChallenge[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [parseError, setParseError] = useState<string | null>(null)
  const [targetEventId, setTargetEventId] = useState<string | null>(null)
  const [skipExisting, setSkipExisting] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number; title: string } | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setRawText('')
      setParsedList([])
      setSelectedIndices(new Set())
      setParseError(null)
      setProgress(null)
      setIsImporting(false)
      const initialEvent = currentEventId && currentEventId !== 'all' ? currentEventId : null
      setTargetEventId(initialEvent)
    }
  }, [open, currentEventId])

  const existingTitles = useMemo(() => {
    return new Set(existingChallenges.map((c) => c.title.trim().toLowerCase()))
  }, [existingChallenges])

  const handleParseText = (text: string) => {
    setParseError(null)
    const res = parseImportInput(text)
    if (!res.success || !res.data) {
      setParseError(res.error || 'Failed to parse JSON.')
      return
    }

    setParsedList(res.data)
    setSelectedIndices(new Set(res.data.map((_, idx) => idx)))
    toast.success(`Successfully parsed ${res.data.length} challenges!`)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setParseError('Please select a valid .json file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setRawText(content)
        handleParseText(content)
      }
    }
    reader.onerror = () => {
      setParseError('Failed to read selected file.')
    }
    reader.readAsText(file)
  }

  const toggleSelectIndex = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedList.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(parsedList.map((_, idx) => idx)))
    }
  }

  const handleStartImport = async () => {
    const selectedChallenges = parsedList.filter((_, idx) => selectedIndices.has(idx))
    if (selectedChallenges.length === 0) {
      toast.error('No challenges selected for import.')
      return
    }

    setIsImporting(true)
    setProgress({ current: 0, total: selectedChallenges.length, title: 'Initializing...' })

    try {
      const result: ImportResult = await executeImportChallenges(selectedChallenges, {
        targetEventId,
        skipExisting,
        existingTitles: new Set(existingTitles),
        onProgress: (current, total, title) => {
          setProgress({ current, total, title })
        },
      })

      if (result.created > 0) {
        toast.success(`Import complete! ${result.created} created, ${result.skipped} skipped.`)
        onSuccess()
        onOpenChange(false)
      } else if (result.skipped > 0 && result.created === 0) {
        toast('All selected challenges already exist and were skipped.', { icon: 'ℹ️' })
        onOpenChange(false)
      } else if (result.failed > 0) {
        toast.error(`Import failed on ${result.failed} challenges. Check console for details.`)
      }
    } catch (err: any) {
      console.error('Import execution error:', err)
      toast.error(err.message || 'Failed to execute import.')
    } finally {
      setIsImporting(false)
      setProgress(null)
    }
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
              <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Upload size={15} />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                  Import Challenges
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Import portable JSON challenges directly into your NXCTF instance.
                </p>
              </div>
            </div>

            {parsedList.length > 0 && (
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                {selectedIndices.size} / {parsedList.length} Selected
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex flex-col flex-1 overflow-hidden space-y-3.5 pt-1">
          {parsedList.length === 0 ? (
            /* STEP 1: Input Mode (File Upload or Raw JSON) */
            <div className="flex flex-col flex-1 overflow-hidden space-y-3">
              <div className="flex justify-center shrink-0">
                <AppTabs
                  items={[
                    { value: 'file' as const, label: 'Upload JSON File' },
                    { value: 'raw' as const, label: 'Paste Raw JSON' },
                  ]}
                  value={inputMode}
                  onValueChange={(val) => {
                    setInputMode(val)
                    setParseError(null)
                  }}
                  variant="panel"
                />
              </div>

              {inputMode === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
                    dragActive
                      ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 hover:border-blue-400 dark:hover:border-blue-500/60'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-inner">
                    <FileText size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    Drag and drop your JSON package here
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
                    Supports NXCTF exported packages, CTFd format, or challenge JSON arrays.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="mt-4 text-xs pointer-events-none">
                    Browse File (.json)
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col space-y-2">
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder='Paste JSON content here... Example: [{"title": "Bastion", "category": "Linux", "points": 500, "flag": "NXCTF{...}"}]'
                    className="flex-1 font-mono text-xs resize-none p-3 bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800"
                  />
                  <div className="flex justify-end shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!rawText.trim()}
                      onClick={() => handleParseText(rawText)}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      Parse & Preview JSON
                    </Button>
                  </div>
                </div>
              )}

              {parseError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2 shrink-0">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Preview & Select Challenges */
            <div className="flex flex-col flex-1 overflow-hidden space-y-3">
              {/* Target Event & Duplicate Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 shrink-0 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Event:
                  </label>
                  <select
                    value={targetEventId || 'main'}
                    onChange={(e) => setTargetEventId(e.target.value === 'main' ? null : e.target.value)}
                    className="w-full h-8 px-2 rounded-lg border text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    <option value="main">Permanent / Main Challenges</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 dark:text-gray-300">
                    <Switch
                      checked={skipExisting}
                      onCheckedChange={setSkipExisting}
                      className="scale-80"
                    />
                    <span className="text-xs">Skip existing titles</span>
                  </label>
                </div>
              </div>

              {/* Challenge List Controls */}
              <div className="flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Detected Challenges ({parsedList.length})
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-7 text-[11px]"
                  >
                    {selectedIndices.size === parsedList.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setParsedList([])
                      setSelectedIndices(new Set())
                    }}
                    className="h-7 text-[11px] text-gray-500 hover:text-red-500"
                  >
                    <RefreshCw size={12} className="mr-1" /> Re-upload
                  </Button>
                </div>
              </div>

              {/* Challenge List */}
              <div className="flex-1 overflow-y-auto border rounded-xl dark:border-gray-800/80 bg-gray-50/50 dark:bg-gray-900/20 p-2 space-y-1.5 scroll-hidden">
                {parsedList.map((c, idx) => {
                  const isChecked = selectedIndices.has(idx)
                  const alreadyExists = existingTitles.has(c.title.trim().toLowerCase())
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all duration-150 select-none',
                        isChecked
                          ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 text-gray-900 dark:text-gray-100 shadow-2xs'
                          : 'border-transparent bg-white/40 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
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
                          {alreadyExists && (
                            <span className="ml-1.5 inline-block px-1.5 py-0.2 text-[9px] rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                              Exists
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                        {c.sub_challenges && c.sub_challenges.length > 0 && (
                          <span className="rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 text-[10px] font-bold">
                            {c.sub_challenges.length} Sub-Quests
                          </span>
                        )}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {c.points} pts
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Progress status during import */}
              {isImporting && progress && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      Importing: {progress.title}
                    </span>
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-500/20 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="pt-3 border-t dark:border-gray-800 flex flex-row items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isImporting}
            onClick={() => {
              if (parsedList.length > 0) {
                setParsedList([])
                setSelectedIndices(new Set())
              } else {
                onOpenChange(false)
              }
            }}
            className="text-xs"
          >
            {parsedList.length > 0 ? 'Back to Upload' : 'Cancel'}
          </Button>

          {parsedList.length > 0 && (
            <Button
              type="button"
              size="sm"
              disabled={isImporting || selectedIndices.size === 0}
              onClick={handleStartImport}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Import {selectedIndices.size} Challenges
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImportChallengesDialog
