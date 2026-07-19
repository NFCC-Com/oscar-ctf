import React from 'react'
import Link from 'next/link'
import ImageWithFallback from '@/shared/components/ImageWithFallback'

interface UserMenuProps {
  user: any | null
  authReady: boolean
  theme: string
  avatarSrc: string | null
  handleLogout: () => void
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  authReady,
  theme,
  avatarSrc,
  handleLogout,
}) => {
  if (!authReady) return null

  if (user) {
    return (
      <div className="flex items-center space-x-3 animate-in fade-in duration-300">
        <Link
          href="/profile"
          className="group flex items-center gap-2 caret-transparent rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-0"
          data-tour="navbar-profile"
        >
          <ImageWithFallback src={avatarSrc} alt={user.username} size={36} className="rounded-full" />
          <span
            className={`text-[15px] font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-all duration-150 group-hover:text-blue-500 dark:group-hover:text-blue-400 truncate whitespace-nowrap max-w-[100px] md:max-w-[160px] block`}
            title={user.username}
          >
            {user.username}
          </span>
        </Link>
        <button
          onClick={handleLogout}
          className="hidden md:block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3 animate-in fade-in duration-300">
      <Link
        href="/login"
        className={`px-4 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150 ${theme === 'dark' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        Login
      </Link>
      <Link
        href="/register"
        className={`px-4 py-2 rounded-lg text-[15px] font-medium shadow transition-all duration-150 ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
      >
        Register
      </Link>
    </div>
  )
}
export default UserMenu
