'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#recurring', label: 'Recurring Plans' },
  { href: '#service-areas', label: 'Service Areas' },
  { href: '#get-app', label: 'Get the App' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 h-[68px] border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-full max-w-[1440px] items-center px-6 sm:px-[65px]">
          <Link href="/" className="mr-10 flex flex-shrink-0 items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-xs font-extrabold !text-white">
              NMD
            </div>
            <div>
              <div className="text-base font-bold leading-tight text-gray-900">NMD Pressure Washing</div>
              <div className="text-[11px] font-medium leading-none text-gray-400">Services LLC</div>
            </div>
          </Link>

          <ul className="nav-desktop-only flex flex-1 items-center justify-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/mission" className="rounded-md px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                Our Mission
              </Link>
            </li>
            <li>
              <Link href="/client/register" className="rounded-md px-2.5 py-1.5 text-[13px] font-semibold text-teal-700 hover:bg-teal-50">
                Create Account
              </Link>
            </li>
          </ul>

          <div className="nav-desktop-only ml-auto flex flex-shrink-0 items-center gap-3">
            <a href="/client/login" className="px-2.5 py-1.5 text-[13px] font-medium text-gray-700 hover:text-gray-900">
              Client Login
            </a>
            <a
              href="/client/request-service"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold !text-white shadow-sm hover:bg-teal-800 hover:shadow-md"
            >
              Get a Free Quote
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="nav-mobile-toggle ml-auto h-9 w-9 items-center justify-center rounded-md border border-gray-200"
            aria-label="Toggle menu"
          >
            <span className="text-lg leading-none">{mobileOpen ? '\u2715' : '\u2630'}</span>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-[68px] z-[99] flex flex-col gap-3 border-b border-gray-200 bg-white p-5 shadow-lg">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="border-b border-gray-100 pb-2 text-base font-medium text-gray-700"
            >
              {link.label}
            </a>
          ))}

          <Link
            href="/mission"
            onClick={() => setMobileOpen(false)}
            className="border-b border-gray-100 pb-2 text-base font-medium text-gray-700"
          >
            Our Mission
          </Link>

          <Link
            href="/client/register"
            onClick={() => setMobileOpen(false)}
            className="border-b border-gray-100 pb-2 text-base font-semibold text-teal-700"
          >
            Create Account &rarr;
          </Link>

          <div className="flex gap-3 pt-2">
            <a
              href="/client/login"
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-semibold text-gray-900"
            >
              Client Login
            </a>
            <a
              href="/client/request-service"
              className="flex-1 rounded-lg bg-teal-700 py-2.5 text-center text-sm font-semibold !text-white"
            >
              Get a Quote
            </a>
          </div>
        </div>
      )}
    </>
  )
}






