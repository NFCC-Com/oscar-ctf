'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

import APP from '@/config'
import ImageWithFallback from '@/shared/components/ImageWithFallback'
import { useAuth } from '@/shared/contexts/AuthContext'
import { useTheme } from '@/shared/contexts/ThemeContext'
import {
  SURFACE_NAVBAR_CLASS,
  SURFACE_NAV_LINK_BASE_CLASS,
  SURFACE_NAV_LINK_ACTIVE_CLASS,
  SURFACE_NAV_LINK_IDLE_CLASS,
} from '@/shared/styles'

import useAdminStatus from './Navbar/useAdminStatus'
import DesktopNav from './Navbar/DesktopNav'
import UserMenu from './Navbar/UserMenu'
import MobileMenu from './Navbar/MobileMenu'

const NavbarLogsButton = dynamic(() => import('./components/NavbarLogsButton'), {
  ssr: false,
})

const NavbarNotifications = dynamic(() => import('@/widgets/notifications/NavbarNotifications'), {
  ssr: false,
})

const DevConfig = dynamic(() => import('@/widgets/dev-config'), {
  ssr: false,
})

const DEFAULT_NAVBAR_LOGO_SRC = '/logo.svg'

function normalizeNavbarImageSrc(src?: string | null, fallback: string | null = null) {
  const value = String(src || '').trim()
  if (!value) return fallback
  if (/^(https?:\/\/|data:|blob:)/i.test(value) || value.startsWith('//')) return value
  if (value.startsWith('/')) return value

  const publicPath = value
    .replace(/^\.?\//, '')
    .replace(/^public\//, '')

  return publicPath ? `/${publicPath}` : fallback
}

export default function Navbar() {
  const router = useRouter()
  const { user, setUser, loading } = useAuth()
  const pathname = usePathname()
  const { theme } = useTheme()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { adminStatus, globalAdminStatus, setAdminStatus, setGlobalAdminStatus } = useAdminStatus(user)

  const authReady = !loading
  const logoSrc = normalizeNavbarImageSrc(APP.image_logo, DEFAULT_NAVBAR_LOGO_SRC)
  const avatarSrc = normalizeNavbarImageSrc(user?.profile_picture_url || user?.picture || null, null)

  const handleLogout = async () => {
    setMobileMenuOpen(false)
    const { AuthService } = await import('@/features/auth/services/auth.service')
    await AuthService.signOut()
    setUser(null)
    setAdminStatus(false)
    setGlobalAdminStatus(false)
    router.push('/login')
  }

  const showTeamScoreboard = APP.teams.enabled
  const showUserScoreboard = !showTeamScoreboard || !APP.teams.hideScoreboardIndividual
  const scoreboardOptionCount = Number(showUserScoreboard) + Number(showTeamScoreboard)
  const routeActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const scoreboardActive = routeActive('/scoreboard') || routeActive('/teams/scoreboard')
  const infoActive = routeActive('/info') || routeActive('/rules')
  const navLinkClass = (active = false) =>
    `${SURFACE_NAV_LINK_BASE_CLASS} ${active ? SURFACE_NAV_LINK_ACTIVE_CLASS : SURFACE_NAV_LINK_IDLE_CLASS}`

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      <nav className={SURFACE_NAVBAR_CLASS}>
        <div className="max-w-7xl mx-auto px-4 sm:px-0">
          <div className="flex justify-between h-14 items-center">
            {/* Left section: Logo & Nav items */}
            <div className="flex items-center space-x-8">
              <Link
                href="/"
                className="group flex items-center gap-2 caret-transparent rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0"
                data-tour="navbar-logo"
              >
                <ImageWithFallback
                  src={logoSrc}
                  alt={`${APP.shortName} logo`}
                  size={42}
                  className="rounded-full"
                />
                <span className={`text-[1.35rem] font-extrabold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-all duration-200 group-hover:text-blue-500 dark:group-hover:text-blue-400`}>
                  {APP.shortName}
                </span>
              </Link>

              <DesktopNav
                user={user}
                authReady={authReady}
                adminStatus={adminStatus}
                globalAdminStatus={globalAdminStatus}
                showTeamScoreboard={showTeamScoreboard}
                showUserScoreboard={showUserScoreboard}
                scoreboardOptionCount={scoreboardOptionCount}
                routeActive={routeActive}
                scoreboardActive={scoreboardActive}
                infoActive={infoActive}
                navLinkClass={navLinkClass}
              />
            </div>

            {/* Right section: User Status, Notifications, Dev Widget & Hamburger */}
            <div className="flex items-center space-x-5">
              <UserMenu
                user={user}
                authReady={authReady}
                theme={theme}
                avatarSrc={avatarSrc}
                handleLogout={handleLogout}
              />

              {/* Notifications */}
              {authReady && user && (
                <NavbarNotifications key="notifications" theme={theme} globalAdminStatus={globalAdminStatus} />
              )}

              {/* Logs Icon */}
              {authReady && user && (
                <NavbarLogsButton key="logs" theme={theme} pathname={pathname} />
              )}

              {/* Dev Config Widget */}
              <DevConfig key="dev-config" />

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <MobileMenu
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        user={user}
        authReady={authReady}
        theme={theme}
        avatarSrc={avatarSrc}
        scoreboardOptionCount={scoreboardOptionCount}
        showUserScoreboard={showUserScoreboard}
        showTeamScoreboard={showTeamScoreboard}
        adminStatus={adminStatus}
        globalAdminStatus={globalAdminStatus}
        handleLogout={handleLogout}
        routeActive={routeActive}
      />
    </>
  )
}
