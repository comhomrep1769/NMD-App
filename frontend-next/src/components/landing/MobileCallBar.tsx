'use client'

import { usePhone } from '@/lib/usePhone'

// Fixed call bar for small screens only. A pressure washing business is
// call-driven, and on a phone the number should never be more than one tap
// away regardless of scroll position.
export default function MobileCallBar() {
  const { display, href } = usePhone()

  return (
    <>
      <style>{`
        .nmd-call-bar { display: none; }
        @media (max-width: 767px) {
          .nmd-call-bar { display: flex; }
          .nmd-call-bar-spacer { height: 68px; }
        }
      `}</style>

      <div className="nmd-call-bar fixed inset-x-0 bottom-0 z-[95] items-stretch gap-2 border-t border-gray-200 bg-white p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <a
          href={href}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-teal-700 px-4 text-sm font-semibold !text-white"
          aria-label={`Call NMD Pressure Washing at ${display}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call {display}
        </a>
        <a
          href="/client/request-service"
          className="flex min-h-[48px] items-center justify-center rounded-[10px] border border-gray-300 px-4 text-sm font-semibold text-gray-900"
        >
          Free quote
        </a>
      </div>
      <div className="nmd-call-bar-spacer" aria-hidden="true" />
    </>
  )
}