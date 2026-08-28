"use client";

import { useEffect, useState } from 'react'
import { motion } from "framer-motion";
import { Star, GitBranch, Users, Github, BookOpen, ScrollText, Info, ListOrdered, MessageSquare, Clock, Globe, Shield, Terminal, Heart } from 'lucide-react'
import Image from "next/image";

import APP from "@/config";
import { NXCTF } from "@/_vars/const";
import { VERSION, BUILD_TIME } from "@/_vars/version";
import Loader from '@/shared/components/Loader'
import ImageWithFallback from '@/shared/components/ImageWithFallback'
import BrandLogo from '@/shared/components/BrandLogo'
import PageBackground from '@/shared/components/PageBackground'
import Footer from "@/_layouts/Footer";
import { useAuth } from '@/shared/contexts/AuthContext'
import {
  SURFACE_GLASS_CARD_INTERACTIVE_BLUE_CLASS,
  THEME_PRIMARY_PILL_CLASS,
  THEME_PRIMARY_SELECTION_CLASS,
} from '@/shared/styles'
import { cn } from '@/shared/lib/utils'

interface Contributor {
  username: string
  role?: string
  bio?: string
}

const CONTRIBUTORS: Contributor[] = [
  {
    username: "ariafatah0711",
    role: "Core Author & Maintainer",
    bio: "Lead developer and creator of NXCTF platform."
  },
];

const LINKS = [
  { name: "Website", href: NXCTF.nxctf_url || "#", icon: Globe, description: "Official NXCTF Portal" },
  { name: "GitHub", href: NXCTF.nxctf_github || "#", icon: Github, description: "Source Code & Releases" },
  { name: "Docs", href: NXCTF.nxctf_docs || "#", icon: BookOpen, description: "Setup & API Guides" },
  { name: "Discord", href: NXCTF?.nxctf_discord || "#", icon: MessageSquare, description: "Community & Support" },
];

export default function InfoPage() {
  const [repoStats, setRepoStats] = useState<{ stars: number; forks: number } | null>(null)
  const { loading } = useAuth()

  useEffect(() => {
    const repoUrl = NXCTF.nxctf_github
    if (!repoUrl) return
    try {
      const m = repoUrl.match(/github\.com\/(.+?)\/(.+?)(?:\.git|\/|$)/i)
      if (!m) return
      const owner = m[1]
      const repo = m[2]
      const api = `https://api.github.com/repos/${owner}/${repo}`
      fetch(api)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return
          setRepoStats({ stars: data.stargazers_count || 0, forks: data.forks_count || 0 })
        })
        .catch(() => {})
    } catch {
      // ignore
    }
  }, [])

  if (loading) return <Loader fullscreen />

  return (
    <PageBackground
      className="flex flex-col min-h-screen overflow-x-hidden"
      selectionClassName={THEME_PRIMARY_SELECTION_CLASS}
    >
      <main className="flex-1 flex flex-col items-center relative z-10 w-full px-4 py-8 sm:px-6 lg:py-12">
        {/* HERO SECTION */}
        <section className="w-full max-w-3xl mx-auto flex flex-col items-center text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-4 flex items-center justify-center gap-3.5"
          >
            <ImageWithFallback
              src={NXCTF.nxctf_logo}
              alt={`${NXCTF.nxctf_title} logo`}
              size={64}
              rounded={false}
              className="drop-shadow-md"
            />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              <BrandLogo name={NXCTF.nxctf_title} />
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="max-w-xl text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base mb-4 font-normal"
          >
            A high-performance, next-generation Capture The Flag (CTF) platform built for competitive cybersecurity events, training, and education.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/60 px-3.5 py-1 text-xs font-mono text-gray-500 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <Terminal size={12} className="text-blue-500 shrink-0" />
            <span className="truncate">{APP.description || "Hack for fun, not for profit"}</span>
          </motion.div>
        </section>

        {/* STATS & TECHNICAL SPECIFICATION STRIP */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-6 flex w-full max-w-3xl flex-col rounded-2xl border border-gray-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#0e1320]/70"
        >
          {/* Top: GitHub Stats */}
          <div className="flex flex-wrap items-center justify-around gap-4 pb-4">
            {repoStats && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {repoStats.stars}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Stars
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {repoStats.forks}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                      Forks
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              </>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                  {CONTRIBUTORS.length}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                  Maintainer
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gray-200/80 dark:bg-white/10" />

          {/* Bottom: Technical Details */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 pt-3.5 text-[11px] font-mono text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Info size={13} className="text-blue-500" />
              <span className="font-semibold text-gray-800 dark:text-gray-200">v{VERSION}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-indigo-500" />
              <span>{BUILD_TIME}</span>
            </div>

            <a
              href={`${NXCTF.nxctf_github}/blob/main/LICENSE` || "https://www.apache.org/licenses/LICENSE-2.0"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ScrollText size={13} className="text-emerald-500" />
              <span>Apache 2.0</span>
            </a>

            <a
              href={`${NXCTF.nxctf_github}/blob/main/CHANGELOG.md` || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ListOrdered size={13} className="text-amber-500" />
              <span>Changelog</span>
            </a>
          </div>
        </motion.div>

        {/* QUICK LINKS GRID */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {LINKS.map((link, i) => {
            const Icon = link.icon;
            if (link.href === "#") return null;
            return (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3.5 rounded-xl border border-gray-200/80 bg-white/60 p-3 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-blue-500/40 hover:bg-white/90 hover:shadow-md dark:border-white/10 dark:bg-[#0e1320]/60 dark:hover:border-blue-500/40 dark:hover:bg-[#131929]/80"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700 transition-all duration-200 group-hover:bg-blue-500 group-hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:group-hover:bg-blue-600">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {link.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium truncate">
                    {link.description}
                  </span>
                </div>
              </a>
            );
          })}
        </motion.div>

        {/* AUTHOR & CREDIT SECTION (Compact, sleek pill) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {CONTRIBUTORS.map((contributor) => (
              <a
                key={contributor.username}
                href={`https://github.com/${contributor.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 rounded-full border border-gray-200/80 bg-white/70 py-1 pl-1.5 pr-3.5 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-blue-500/40 hover:bg-white/95 hover:shadow-md dark:border-white/10 dark:bg-[#0e1320]/70 dark:hover:border-blue-500/40 dark:hover:bg-[#131929]/90"
              >
                <ProfileAvatar username={contributor.username} size={26} />
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    @{contributor.username}
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Author
                  </span>
                </div>
                <Github size={13} className="text-gray-400 group-hover:text-gray-900 dark:text-gray-500 dark:group-hover:text-white transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </PageBackground>
  );
}

function ProfileAvatar({ username, size = 26 }: { username: string; size?: number }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  const url = `https://github.com/${username}.png`

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    setErrored(false)
    const img = new window.Image()
    img.src = url
    img.onload = () => {
      if (!cancelled) setLoaded(true)
    }
    img.onerror = () => {
      if (!cancelled) setErrored(true)
    }
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-gray-200/80 bg-gray-100 dark:border-white/10 dark:bg-gray-800"
      style={{ width: size, height: size }}
    >
      {!loaded && !errored && (
        <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}
      <Image
        src={url}
        alt={`${username} avatar`}
        width={size}
        height={size}
        className={cn(
          'h-full w-full object-cover transition-transform duration-200 group-hover:scale-105',
          !loaded || errored ? 'opacity-0' : 'opacity-100'
        )}
        unoptimized
      />
    </div>
  )
}

