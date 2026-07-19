import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Flag, Trophy, Users, Compass, BookOpen, Shield, Gavel, User } from 'lucide-react'
import { NXCTF } from '@/_vars/const'
import { SURFACE_NAV_DROPDOWN_CLASS, SURFACE_NAV_DROPDOWN_ITEM_CLASS } from '@/shared/styles'
import useClickOutside from './useClickOutside'

interface DesktopNavProps {
  user: any | null
  authReady: boolean
  adminStatus: boolean
  globalAdminStatus: boolean
  showTeamScoreboard: boolean
  showUserScoreboard: boolean
  scoreboardOptionCount: number
  routeActive: (href: string) => boolean
  scoreboardActive: boolean
  infoActive: boolean
  navLinkClass: (active?: boolean) => string
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  user,
  authReady,
  adminStatus,
  globalAdminStatus,
  showTeamScoreboard,
  showUserScoreboard,
  scoreboardOptionCount,
  routeActive,
  scoreboardActive,
  infoActive,
  navLinkClass,
}) => {
  const [scoreboardOpen, setScoreboardOpen] = useState(false)
  const scoreboardMenuRef = useRef<HTMLDivElement | null>(null)

  const [docsOpen, setDocsOpen] = useState(false)
  const docsMenuRef = useRef<HTMLDivElement | null>(null)

  useClickOutside(scoreboardMenuRef, () => setScoreboardOpen(false), scoreboardOpen)
  useClickOutside(docsMenuRef, () => setDocsOpen(false), docsOpen)

  return (
    <div className="hidden md:flex space-x-2">
      {authReady && user && (
        <Link
          href="/challenges"
          className={navLinkClass(routeActive('/challenges'))}
          data-tour="navbar-challenges"
        >
          <Flag size={18} className="mr-1" /> Challenges
        </Link>
      )}

      {authReady && user && scoreboardOptionCount > 0 && (
        scoreboardOptionCount === 1 ? (
          <Link
            href={showTeamScoreboard ? '/teams/scoreboard' : '/scoreboard'}
            className={navLinkClass(scoreboardActive)}
            data-tour="navbar-scoreboard"
          >
            <Trophy size={18} className="mr-1" /> Scoreboard
          </Link>
        ) : (
          <div ref={scoreboardMenuRef} className="relative">
            <button
              type="button"
              data-tour="navbar-scoreboard"
              onClick={() => setScoreboardOpen((v) => !v)}
              className={navLinkClass(scoreboardActive)}
            >
              <Trophy size={18} className="mr-1" /> Scoreboard
              <ChevronDown className={`ml-1 h-3.5 w-3.5 opacity-70 transition-transform ${scoreboardOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {scoreboardOpen && (
              <div className={SURFACE_NAV_DROPDOWN_CLASS}>
                {showUserScoreboard && (
                  <Link
                    href="/scoreboard"
                    onClick={() => setScoreboardOpen(false)}
                    className={SURFACE_NAV_DROPDOWN_ITEM_CLASS}
                  >
                    <span className="flex items-center">
                      <User size={18} className="mr-1" />
                      User Scoreboard
                    </span>
                  </Link>
                )}
                {showTeamScoreboard && (
                  <Link
                    href="/teams/scoreboard"
                    onClick={() => setScoreboardOpen(false)}
                    className={SURFACE_NAV_DROPDOWN_ITEM_CLASS}
                  >
                    <span className="flex items-center">
                      <Users size={18} className="mr-1" />
                      Team Scoreboard
                    </span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )
      )}

      {authReady && user && showTeamScoreboard && (
        <Link
          href="/teams"
          className={navLinkClass(routeActive('/teams') && !routeActive('/teams/scoreboard'))}
        >
          <Users size={18} className="mr-1" /> Teams
        </Link>
      )}

      {/* Info Dropdown */}
      <div ref={docsMenuRef} className="relative">
        <button
          type="button"
          data-tour="navbar-docs"
          onClick={() => setDocsOpen((v) => !v)}
          className={navLinkClass(infoActive)}
        >
          <Compass size={18} className="mr-1" /> Info
          <ChevronDown className={`ml-1 h-3.5 w-3.5 opacity-70 transition-transform ${docsOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {docsOpen && (
          <div className={SURFACE_NAV_DROPDOWN_CLASS}>
            <Link
              href="/info"
              onClick={() => setDocsOpen(false)}
              className={SURFACE_NAV_DROPDOWN_ITEM_CLASS}
              data-tour="navbar-info"
            >
              <span className="flex items-center">
                <Compass size={18} className="mr-1" />
                Info
              </span>
            </Link>
            <Link
              href="/rules"
              onClick={() => setDocsOpen(false)}
              className={SURFACE_NAV_DROPDOWN_ITEM_CLASS}
              data-tour="navbar-rules"
            >
              <span className="flex items-center">
                <Gavel size={18} className="mr-1" />
                Rules
              </span>
            </Link>
            <Link
              href={NXCTF.nxctf_docs}
              target="_blank"
              onClick={() => setDocsOpen(false)}
              className={SURFACE_NAV_DROPDOWN_ITEM_CLASS}
              data-tour="navbar-docs"
            >
              <span className="flex items-center">
                <BookOpen size={18} className="mr-1" />
                Docs
              </span>
            </Link>
          </div>
        )}
      </div>

      {authReady && adminStatus && user && (
        <Link
          href={globalAdminStatus ? '/admin/overview' : '/admin/challenges'}
          className={navLinkClass(routeActive('/admin'))}
        >
          <Shield size={18} className="mr-1" /> Admin
        </Link>
      )}
    </div>
  )
}
export default DesktopNav
