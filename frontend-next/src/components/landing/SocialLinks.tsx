// Social profile icons, driven entirely by admin-editable site content.
// A platform with no URL saved renders nothing at all, so the footer never
// shows a dead icon pointing at a profile the business does not keep.

type Platform = {
  key: string
  label: string
  path: string
  viewBox?: string
}

// Ordered by how much they matter to a local home-services business:
// Google reviews first, then the visual platforms, then the rest.
export const SOCIAL_PLATFORMS: Platform[] = [
  {
    key: 'social.google_business_url',
    label: 'Google Business Profile',
    path: 'M12 11v2.4h5.6c-.24 1.44-1.7 4.24-5.6 4.24-3.36 0-6.1-2.78-6.1-6.2S8.64 5.24 12 5.24c1.92 0 3.2.8 3.94 1.5l2.68-2.58C16.9 2.6 14.66 1.6 12 1.6 6.76 1.6 2.52 5.84 2.52 11.08S6.76 20.56 12 20.56c5.44 0 9.06-3.82 9.06-9.2 0-.62-.06-1.1-.16-1.56H12z',
  },
  {
    key: 'social.angi_url',
    label: 'Angi',
    // Lettermark, not Angi's official logo. Swap the path for the real
    // brand asset if the owner supplies it.
    path: 'M12 3l8 18h-3.6l-1.5-3.6H9.1L7.6 21H4l8-18zm0 5.4L10.2 14h3.6L12 8.4z',
  },
  {
    key: 'social.homeadvisor_url',
    label: 'HomeAdvisor',
    // House mark, not HomeAdvisor's official logo.
    path: 'M12 2.8L2.6 11.1l1.46 1.65L5 11.93V20a1 1 0 001 1h4.2v-5.2h3.6V21H18a1 1 0 001-1v-8.07l.94.82 1.46-1.65L12 2.8z',
  },
  {
    key: 'social.facebook_url',
    label: 'Facebook',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22C18.34 21.24 22 17.08 22 12.06z',
  },
  {
    key: 'social.instagram_url',
    label: 'Instagram',
    path: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.36 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12C21.33 1.36 20.66.94 19.86.63 19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z',
  },
  {
    key: 'social.tiktok_url',
    label: 'TikTok',
    path: 'M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 01-2.59-2.59 2.59 2.59 0 013.44-2.44v-3.13a5.67 5.67 0 00-.85-.06A5.68 5.68 0 004.2 15.4a5.68 5.68 0 005.66 5.68 5.68 5.68 0 005.68-5.68V9.4a7.35 7.35 0 004.27 1.37V7.68a4.28 4.28 0 01-3.2-1.86z',
  },
  {
    key: 'social.youtube_url',
    label: 'YouTube',
    path: 'M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z',
  },
  {
    key: 'social.x_url',
    label: 'X',
    path: 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.584-6.64 7.584H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z',
  },
  {
    key: 'social.linkedin_url',
    label: 'LinkedIn',
    path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.13 2.06 2.06 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z',
  },
  {
    key: 'social.yelp_url',
    label: 'Yelp',
    path: 'M20.16 12.59l-4.15 1.36c-.79.26-1.5-.6-1.08-1.31l2.26-3.77a1 1 0 011.55-.2 6.7 6.7 0 011.87 3.06 1 1 0 01-.45.86zm-5.53 3.1l2.6 3.53a1 1 0 01-.25 1.44 6.7 6.7 0 01-3.4 1.1 1 1 0 01-1.04-.86l-.26-4.36c-.05-.83.93-1.31 1.53-.75zm-3.46-.42l-.13 4.37a1 1 0 01-1.1.96 6.7 6.7 0 01-3.33-1.26 1 1 0 01-.2-1.45l2.73-3.42c.56-.7 1.66-.28 1.63.6zM9.6 11.8l-4.42-1.3a1 1 0 01-.7-1.13 6.7 6.7 0 011.6-3.23 1 1 0 011.55.06l2.84 4.13c.47.68-.1 1.58-.87 1.47zm2.31-2.14L11.48 2.6a1 1 0 011.2-1.02 12 12 0 013.1.96 1 1 0 01.45 1.45l-2.83 5.8c-.4.83-1.63.65-1.7-.24z',
  },
  {
    key: 'social.nextdoor_url',
    label: 'Nextdoor',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.2h-2.32v-4.06c0-1.06-.46-1.74-1.42-1.74-.76 0-1.2.5-1.4 1a1.8 1.8 0 00-.08.66v4.14H9.06s.03-6.9 0-7.6h2.32v1.08c.3-.48.85-1.16 2.08-1.16 1.52 0 2.66 1 2.66 3.14v4.54z',
  },
]

type Props = {
  content: Record<string, string>
  className?: string
  iconClassName?: string
}

export default function SocialLinks({ content, className = '', iconClassName = '' }: Props) {
  const active = SOCIAL_PLATFORMS.filter((p) => {
    const url = content[p.key]
    return typeof url === 'string' && url.trim() !== ''
  })

  if (active.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {active.map((p) => (
        <a
          key={p.key}
          href={content[p.key].trim()}
          target="_blank"
          rel="noopener noreferrer me"
          aria-label={`NMD Pressure Washing on ${p.label}`}
          title={p.label}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/15 !text-white/70 hover:border-white/40 hover:!text-white ${iconClassName}`}
          style={{ transition: 'color 0.15s ease-out, border-color 0.15s ease-out' }}
        >
          <svg width="17" height="17" viewBox={p.viewBox || '0 0 24 24'} fill="currentColor" aria-hidden="true">
            <path d={p.path} />
          </svg>
        </a>
      ))}
    </div>
  )
}