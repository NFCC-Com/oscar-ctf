import Link from 'next/link'
import { THEME_PRIMARY_TEXT_CLASS } from '@/shared/styles'

interface AuthFooterProps {
  text: string
  href: string
  linkText: string
}

export function AuthFooter({ text, href, linkText }: AuthFooterProps) {
  return (
    <p className="mt-6 text-center text-xs font-mono text-gray-600 dark:text-gray-400">
      {text}{' '}
      <Link
        href={href}
        className={`font-bold transition-colors hover:text-blue-500 dark:hover:text-blue-300 ${THEME_PRIMARY_TEXT_CLASS}`}
      >
        {linkText}
      </Link>
    </p>
  )
}
