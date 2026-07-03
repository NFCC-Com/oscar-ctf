import { LINKS, YEAR, DIFFICULTY_STYLES, NXCTF } from './const'

export const APP = {
  shortName: "OSCAR",
  fullName: "OSCAR",
  description: "OSCAR 3.0: EXPLORE THE FUTURE TECHNOLOGY. Lestarikan alam, berinovasi di dunia digital. Bergabunglah dalam tantangan teknologi bergengsi bagi generasi inovator masa depan.",
  flagFormat: "OSCAR{your_flag_here}",

  challengeCategories: [
    "Intro",
    "Linux",
    "Boot To Root",
    "Web",
    "Forensics",
    "AI",
    "Osint",
    "Crypto",
    "Reverse",
    "Pwn",
    "Stegnography",
    "Misc",
    "Blockchain",
    "Network"
  ],

  // Sub-category ordering hints used in challenge sorting and admin form suggestions.
  challengeSubCategories: [
    "fundamentals",
    "intro",
    "user",
    "root"
  ],

  // Base URL (ambil dari env kalau ada). Prefer changing NEXT_PUBLIC_SITE_URL in .env.local.
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  image_icon: "favicon.ico",
  image_logo: "logo.png",
  image_preview: "og-image.png",

  // Turnstile aktif otomatis kalau site key ada di env.
  captchaEnabled: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
  captchaSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '',

  /* Setting Config */
  notifSolves: true, // notifikasi global saat ada yang solve challenge

  teams: {
    enabled: true,
    hideScoreboardIndividual: true,
    hidescoreboardTotal: true,
  },
  hideEventMain: false, // enable / disable hiding "Main Event" in event selector (useful for single event nxctf)
  // Label untuk challenges tanpa event_id (event_id = NULL). Jika kosong, fallback ke "Main".

  eventMainLabel: "main",
  // Gambar untuk "Main/Featured" event (boleh URL external atau path public). Contoh:
  // 'https://example.com/banner.png' atau '/images/banner.png'
  eventMainImageUrl: "",
  // Fallback image untuk event yang tidak punya image_url.
  // eventFallbackImageUrl: "",
  eventFallbackImageUrl: "",

  /* Maintenance configuration (env-only): NEXT_PUBLIC_MAINTENANCE_MODE should be 'yes' or 'no'. */
  maintenance: {
    mode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'yes' ? 'yes' : 'no',
  },

  links: {
    ...LINKS,
    discord: "https://discord.gg/Cbjdq3a66B",
  },
  difficultyStyles: DIFFICULTY_STYLES,
  year: YEAR,
  nxctf: NXCTF
}

export default APP
