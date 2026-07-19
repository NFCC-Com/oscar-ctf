'use client'

import React, { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Send, Loader2, MessageSquare, AlertCircle, Trash2 } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { useAuth } from '@/shared/contexts/AuthContext'
import toast from 'react-hot-toast'
import { MarkdownRenderer } from '@/shared/markdown/MarkdownRenderer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  created_at: string
}

interface UserProfile {
  username: string
  profile_picture_url: string | null
}

interface PublicChatProps {
  donors?: Array<{ donator: string }>
}

export default function PublicChat({ donors = [] }: PublicChatProps) {
  const donorNames = donors.map((d) => d.donator)
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [profilesCache, setProfilesCache] = useState<Record<string, UserProfile>>({})
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const profilesCacheRef = useRef<Record<string, UserProfile>>({})

  // Keep ref in sync
  useEffect(() => {
    profilesCacheRef.current = profilesCache
  }, [profilesCache])

  // Fetch admin status
  useEffect(() => {
    if (!user) {
      setIsAdminUser(false)
      return
    }

    let active = true
    import('@/features/admin/services/admin.service')
      .then(async ({ isAdmin }) => {
        const admin = await isAdmin()
        if (active) setIsAdminUser(admin)
      })
      .catch(() => {
        if (active) setIsAdminUser(false)
      })

    return () => {
      active = false
    }
  }, [user])

  // Calculate cooldown dynamically based on user's last message in the feed
  useEffect(() => {
    if (!user || messages.length === 0) {
      setCooldown(0)
      return
    }

    const myMessages = messages.filter((m) => m.user_id === user.id)
    if (myMessages.length > 0) {
      // Messages are sorted oldest to newest, so the last item is the latest
      const latestMsg = myMessages[myMessages.length - 1]
      const sentTime = new Date(latestMsg.created_at).getTime()
      const elapsed = Date.now() - sentTime
      const remaining = Math.max(0, 3 * 60 * 1000 - elapsed)

      if (remaining > 0) {
        setCooldown(Math.ceil(remaining / 1000))
      } else {
        setCooldown(0)
      }
    } else {
      setCooldown(0)
    }
  }, [messages, user])

  // Cooldown countdown timer interval
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // Fetch initial messages and populate profiles cache
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const fetchMessages = async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('public_chat_messages')
          .select('id, user_id, message, created_at, users(username, profile_picture_url)')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        const initialMessages: ChatMessage[] = []
        const newProfiles: Record<string, UserProfile> = {}

        // Separate database columns and profile details into cache
        if (data) {
          for (const row of data) {
            const { users, ...msg } = row
            initialMessages.push(msg)

            if (users && !newProfiles[msg.user_id]) {
              newProfiles[msg.user_id] = {
                username: users.username,
                profile_picture_url: users.profile_picture_url,
              }
            }
          }
        }

        setProfilesCache(newProfiles)
        // Reverse to show oldest first at top, newest at bottom
        setMessages(initialMessages.reverse())
      } catch (err) {
        console.error('Error fetching chat messages:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  // Subscribe to real-time updates (INSERT & DELETE)
  useEffect(() => {
    if (!isSupabaseConfigured) return

    const channel = supabase
      .channel('public-chat-room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'public_chat_messages',
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage

          // Check if sender profile is already cached using Ref to avoid stale closures
          if (!profilesCacheRef.current[newMsg.user_id]) {
            try {
              const { data, error } = await supabase
                .from('users')
                .select('username, profile_picture_url')
                .eq('id', newMsg.user_id)
                .single()

              if (!error && data) {
                setProfilesCache((prev) => ({
                  ...prev,
                  [newMsg.user_id]: {
                    username: data.username,
                    profile_picture_url: data.profile_picture_url,
                  },
                }))
              }
            } catch (err) {
              console.error('Failed to fetch user profile for message:', err)
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            const updated = [...prev, newMsg]
            if (updated.length > 100) {
              return updated.slice(updated.length - 100)
            }
            return updated
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'public_chat_messages',
        },
        (payload) => {
          const oldMsg = payload.old as { id: string }
          setMessages((prev) => prev.filter((m) => m.id !== oldMsg.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Anda harus masuk untuk mengirim pesan.')
      return
    }

    if (cooldown > 0) {
      toast.error(`Harap tunggu cooldown selesai (${formatCooldown(cooldown)}).`)
      return
    }

    const trimmed = newMessage.trim()
    if (!trimmed) return

    if (trimmed.length > 500) {
      toast.error('Pesan terlalu panjang (maksimum 500 karakter).')
      return
    }

    // Client-side validation: disallow {, }, $, % to prevent flags submission
    if (/[{}$%]/.test(trimmed)) {
      toast.error('Komentar tidak boleh mengandung simbol {, }, $, atau % demi keamanan.')
      return
    }

    // Client-side validation: disallow URLs
    if (/https?:\/\/|www\.|ftp:\/\/|\b[a-zA-Z0-9.-]+\.(com|net|org|io|gov|edu|xyz|co|id|me|info|biz)\b/i.test(trimmed)) {
      toast.error('Komentar tidak boleh mengandung tautan URL atau link.')
      return
    }

    setSending(true)
    try {
      const { error } = await (supabase as any).rpc('send_chat_message', {
        p_message: trimmed,
      })

      if (error) throw error

      setNewMessage('')
    } catch (err: any) {
      console.error('Failed to send message:', err)
      toast.error(err.message || 'Gagal mengirim pesan.')
    } finally {
      setSending(false)
    }
  }

  const confirmDelete = async (messageId: string) => {
    try {
      const { error } = await (supabase as any).rpc('delete_chat_message', {
        p_message_id: messageId,
      })

      if (error) throw error
      toast.success('Pesan berhasil dihapus.')
    } catch (err: any) {
      console.error('Failed to delete message:', err)
      toast.error('Gagal menghapus pesan.')
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500 dark:text-gray-400 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider mb-1">Database Belum Siap</p>
        <p className="text-[11px] max-w-[250px]">Supabase belum terkonfigurasi dengan benar untuk fitur ini.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden">
      {/* Message List */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-2 px-5 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scroll-hidden"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-[10px] text-gray-400 mt-2 font-mono">Memuat pesan...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <MessageSquare className="h-8 w-8 stroke-[1.5] mb-1.5 opacity-60" />
            <p className="text-[11px] font-medium">Belum ada diskusi. Mulai obrolan pertama!</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => {
              const isMe = user?.id === msg.user_id
              const profile = profilesCache[msg.user_id] || {
                username: 'User',
                profile_picture_url: null,
              }
              const isDonor = donorNames.some(
                (name) => name && name.toLowerCase() === profile.username.toLowerCase()
              )
              const canDelete = isMe || isAdminUser

              return (
                <div
                  key={msg.id}
                  className="flex gap-3 py-3 px-2 hover:bg-gray-50/40 dark:hover:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/60 last:border-b-0 transition duration-150 group/msg relative items-start"
                >
                  {/* Profile Picture */}
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-150 dark:border-gray-700/60 flex items-center justify-center select-none mt-0.5">
                    {profile.profile_picture_url ? (
                      <Image
                        src={profile.profile_picture_url}
                        alt={profile.username}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase font-mono">
                        {profile.username.slice(0, 2)}
                      </span>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Meta Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
                        {profile.username}
                      </span>

                      {isDonor && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-extrabold text-red-500 bg-red-500/10 rounded border border-red-500/20 select-none">
                          ❤️ Supporter
                        </span>
                      )}

                      <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Message Body (Markdown rendered) */}
                    <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed break-words pr-8">
                      <MarkdownRenderer content={msg.message} variant="compact" />
                    </div>
                  </div>

                  {/* Hover Delete Action Button */}
                  {canDelete && (
                    <div className="absolute right-2 top-2.5 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 flex items-center gap-1 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setDeleteMessageId(msg.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-md transition-colors"
                        title="Hapus komentar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>)}
        <div ref={chatEndRef} />
      </div>

      {/* Input Panel */}
      <div className="px-5 pb-4 pt-3 bg-white dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-800/80">
        {user ? (
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder={
                cooldown > 0
                  ? `Cooldown aktif (Tunggu ${formatCooldown(cooldown)})...`
                  : "Ketik komentar publik (Markdown didukung)..."
              }
              disabled={cooldown > 0}
              maxLength={500}
              rows={2}
              className="flex-1 min-w-0 bg-gray-50 hover:bg-gray-100/55 focus:bg-white dark:bg-gray-800 dark:hover:bg-gray-700/50 dark:focus:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-red-500 dark:focus:border-red-500 rounded-xl px-3 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim() || cooldown > 0}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:hover:bg-red-500 transition-all shadow-sm shrink-0 mb-1"
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Login Diperlukan</span>
              <span className="text-[9px] text-gray-400 dark:text-gray-500">Silakan masuk ke akun Anda untuk mengirim pesan.</span>
            </div>
            <a
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm shadow-red-500/25"
            >
              Login
            </a>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Component */}
      <AlertDialog open={deleteMessageId !== null} onOpenChange={(open) => { if (!open) setDeleteMessageId(null) }}>
        <AlertDialogContent className="border border-gray-150 dark:border-gray-800/80 bg-white dark:bg-gray-950 rounded-2xl p-5 max-w-sm w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-bold text-gray-900 dark:text-white">
              Hapus Komentar?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              Apakah Anda yakin ingin menghapus komentar ini? Tindakan ini akan menghapus komentar secara permanen dan tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex items-center justify-end gap-2">
            <AlertDialogCancel className="h-8 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold px-4 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteMessageId) {
                  await confirmDelete(deleteMessageId)
                  setDeleteMessageId(null)
                }
              }}
              className="h-8 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 transition-colors"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
