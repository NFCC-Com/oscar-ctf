import React from 'react'
import Link from 'next/link'
import { Flag, Trophy, Users, BookOpen, Compass, Gavel, User, Shield, X } from 'lucide-react'
import ImageWithFallback from '@/shared/components/ImageWithFallback'

interface MobileMenuProps {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  user: any | null
  authReady: boolean
  theme: string
  avatarSrc: string | null
  scoreboardOptionCount: number
  showUserScoreboard: boolean
  showTeamScoreboard: boolean
  adminStatus: boolean
  globalAdminStatus: boolean
  handleLogout: () => void
  routeActive: (href: string) => boolean
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  mobileMenuOpen,
  setMobileMenuOpen,
  user,
  authReady,
  theme,
  avatarSrc,
  scoreboardOptionCount,
  showUserScoreboard,
  showTeamScoreboard,
  adminStatus,
  globalAdminStatus,
  handleLogout,
  routeActive,
}) => {
  if (!mobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white/95 backdrop-blur-xl transition-all duration-200 dark:bg-[#0b0f19]/95 md:hidden">
      <div className="flex items-center justify-between border-b border-gray-200/80 px-4 py-3 dark:border-gray-800/90">
        <span className={`text-lg font-bold tracking-wide ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Menu</span>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="px-4 pt-4 pb-6 space-y-2 animate-fade-in">
        {/* Profile */}
        {authReady && user && (
          <Link
            href="/profile"
            className="flex items-center space-x-3 px-3 py-2 border-b border-gray-200 mb-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            <ImageWithFallback src={avatarSrc} alt={user.username} size={36} className="rounded-full" />
            <span
              className={`text-[15px] font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate whitespace-nowrap max-w-[120px] block`}
              title={user.username}
            >
              {user.username}
            </span>
          </Link>
        )}

        {authReady && user && (
          <>
            <Link
              href="/challenges"
              className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800 focus:ring-2 focus:ring-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Flag size={18} className="mr-1" /> Challenges
            </Link>
            {scoreboardOptionCount > 0 && (
              scoreboardOptionCount === 1 ? (
                <Link
                  href={showTeamScoreboard ? '/teams/scoreboard' : '/scoreboard'}
                  className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800 focus:ring-2 focus:ring-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Trophy size={18} className="mr-1" /> Scoreboard
                </Link>
              ) : (
                <details className="rounded-lg">
                  <summary className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}>
                    <Trophy size={18} className="mr-1" /> Scoreboard
                  </summary>
                  <div className="mt-1 ml-6 flex flex-col gap-1">
                    {showUserScoreboard && (
                      <Link
                        href="/scoreboard"
                        className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                        onClick={() => setMobileMenuOpen(false)}
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
                        className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          <Users size={18} className="mr-1" />
                          Team Scoreboard
                        </span>
                      </Link>
                    )}
                  </div>
                </details>
              )
            )}
            {showTeamScoreboard && (
              <Link
                href="/teams"
                className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800 focus:ring-2 focus:ring-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={18} className="mr-1" /> Teams
              </Link>
            )}
          </>
        )}

        {/* Info Menu - Mobile */}
        <details className="rounded-lg">
          <summary className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 cursor-pointer ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}>
            <Compass size={18} className="mr-1" /> Info
          </summary>
          <div className="mt-1 ml-6 flex flex-col gap-1">
            <Link
              href="/info"
              className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Compass size={18} className="mr-1" /> Info
              </span>
            </Link>
            <Link
              href="/rules"
              className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <Gavel size={18} className="mr-1" /> Rules
              </span>
            </Link>
            <Link
              href="/docs"
              className={`px-3 py-2 rounded-lg text-sm ${theme === 'dark' ? 'text-gray-300 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="flex items-center">
                <BookOpen size={18} className="mr-1" /> Docs
              </span>
            </Link>
          </div>
        </details>

        {authReady && user && (
          <>
            {adminStatus && (
              <Link
                href={globalAdminStatus ? '/admin/overview' : '/admin/challenges'}
                className={`px-3 py-2 rounded-lg flex items-center gap-1 text-[15px] font-medium transition-all duration-150 ${theme === 'dark' ? 'text-gray-200 hover:text-blue-400 hover:bg-gray-800 focus:ring-2 focus:ring-blue-700' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield size={18} className="mr-1" /> Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150"
            >
              Logout
            </button>
          </>
        )}

        {authReady && !user && (
          <>
            <Link
              href="/login"
              className={`flex px-3 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className={`flex px-3 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
export default MobileMenu
