'use client'

import { useState, useEffect, useRef } from 'react'
import { usePhone } from '@/lib/usePhone'

// Small-screen contact bar. A pressure washing business runs on phone calls,
// so the number should never be more than one tap away.
//
// Scrolling down folds the full-width bar into a single call button rather
// than hiding it, so it stops covering content without ever becoming
// unreachable. Scrolling up, or pausing, expands it again.
export default function MobileCallBar() {
  const { display, href } = usePhone()
  const [collapsed, setCollapsed] = useState(false)
  const lastY = useRef(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY.current

      // Ignore jitter and rubber-band scrolling past the top.
      if (Math.abs(delta) < 8 || y < 0) return

      // Near the top there is nothing to reclaim, so stay expanded.
      if (y < 120) setCollapsed(false)
      else if (delta > 0) setCollapsed(true)
      else setCollapsed(false)

      lastY.current = y

      // Expand again once scrolling stops, so the number is readable
      // without having to scroll up first.
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setCollapsed(false), 1600)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  return (
    <>
      <style>{`
        .nmd-contact { display: none; }
        @media (max-width: 767px) {
          .nmd-contact {
            display: flex;
            position: fixed;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 95;
            align-items: stretch;
            gap: 8px;
            padding: 10px;
            background: white;
            border-top: 1px solid #DDD8CF;
            box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
            transition: left 0.28s ease-out, padding 0.28s ease-out,
                        background-color 0.28s ease-out, border-color 0.28s ease-out,
                        box-shadow 0.28s ease-out;
          }
          .nmd-contact-spacer { height: 68px; }

          /* Collapsed: the bar shrinks to the width of the call button and
             loses its surface, leaving a single floating action button. */
          .nmd-contact.is-collapsed {
            left: auto;
            width: auto;
            justify-content: flex-end;
            padding: 0 14px 14px 0;
            background: transparent;
            border-top-color: transparent;
            box-shadow: none;
            pointer-events: none;
          }
          .nmd-contact.is-collapsed .nmd-contact-call { pointer-events: auto; }
          .nmd-contact.is-collapsed .nmd-contact-quote { display: none; }
          .nmd-contact.is-collapsed .nmd-contact-call {
            flex: 0 0 56px;
            width: 56px;
            min-width: 56px;
            max-width: 56px;
            border-radius: 999px;
            padding: 0;
            gap: 0;
            box-shadow: 0 6px 20px rgba(0,0,0,0.22);
          }
          .nmd-contact.is-collapsed .nmd-contact-label {
            opacity: 0;
            width: 0;
            margin: 0;
            overflow: hidden;
          }

          /* Chat bubble sits above the expanded bar, and beside the
             collapsed button so the two never overlap. */
          :root { --nmd-chat-offset: 5.25rem; }
          :root:has(.nmd-contact.is-collapsed) { --nmd-chat-offset: 5.5rem; }
        }
        @media (max-width: 767px) and (prefers-reduced-motion: reduce) {
          .nmd-contact, .nmd-contact-call, .nmd-contact-label { transition: none; }
        }
      `}</style>

      <div className={`nmd-contact ${collapsed ? 'is-collapsed' : ''}`}>
        <a
          href={href}
          aria-label={`Call NMD Pressure Washing at ${display}`}
          className="nmd-contact-call flex min-h-[48px] flex-1 items-center justify-center gap-2 overflow-hidden rounded-[10px] bg-[#A85A2C] px-4 text-sm font-semibold !text-white"
          style={{ transition: 'width 0.28s ease-out, border-radius 0.28s ease-out, box-shadow 0.28s ease-out, padding 0.28s ease-out' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span
            className="nmd-contact-label whitespace-nowrap"
            style={{ opacity: 1, transition: 'opacity 0.12s ease-out, width 0.26s ease-out 0.06s, margin 0.26s ease-out 0.06s' }}
          >
            Call {display}
          </span>
        </a>
        <a
          href="/client/request-service"
          className="nmd-contact-quote flex min-h-[48px] items-center justify-center rounded-[10px] border border-[#DDD8CF] bg-white px-4 text-sm font-semibold text-gray-900"
        >
          Free quote
        </a>
      </div>
      <div className="nmd-contact-spacer" aria-hidden="true" />
    </>
  )
}