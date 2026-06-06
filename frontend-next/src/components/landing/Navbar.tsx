'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <nav className="nmd-nav">
        <Link href="/" className="nmd-nav-logo">
          <div className="nmd-nav-logo-mark">NMD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>NMD Pressure Washing</div>
            <div style={{ fontWeight: 400, fontSize: '0.68rem', color: 'var(--color-text-3)', letterSpacing: '0.02em', lineHeight: 1 }}>Services LLC</div>
          </div>
        </Link>

        <ul className="nmd-nav-links">
          <li><a href="#services">Services</a></li>
          <li><a href="#recurring">Recurring Plans</a></li>
          <li><a href="#service-areas">Service Areas</a></li>
          <li><a href="#get-app">Get the App</a></li>
          <li><Link href="/mission" style={{ color: 'var(--color-text-2)', fontWeight: 500, textDecoration: 'none' }}>Our Mission</Link></li>
        </ul>

        <div className="nmd-nav-ctas">
          <a href="/client/login" className="btn-ghost">Client Login</a>
          <a href="/client/request-service" className="btn-primary">
            Get a Free Quote
          </a>
          <button
            className="nmd-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            top: 68,
            left: 0,
            right: 0,
            zIndex: 99,
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          {[
            ['#services', 'Services'],
            ['#recurring', 'Recurring Plans'],
            ['#service-areas', 'Service Areas'],
            ['#get-app', 'Get the App'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: '1rem',
                fontWeight: 500,
                color: 'var(--color-text-2)',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {label}
            </a>
          ))}

          {/* Our Mission — mobile */}
          <Link
            href="/mission"
            onClick={() => setMobileOpen(false)}
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              color: 'var(--color-text-2)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border)',
              textDecoration: 'none',
            }}
          >
            Our Mission
          </Link>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <a href="/client/login" className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Client Login
            </a>
            <a
              href="/client/request-service"
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Get a Quote
            </a>
          </div>
        </div>
      )}
    </>
  )
}