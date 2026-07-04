const fs = require('fs')
const path = require('path')
const ROOT = 'C:/Dev/NMD-App'

let c = fs.readFileSync(path.join(ROOT, 'frontend-next/src/app/routes/page.tsx'), 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n') // normalize to LF for matching

const patches = [
  // 1. Add responsive style tag after PortalShell opens
  [
    `<PortalShell requiredRole={['admin', 'superadmin']}>\n      <SectionHeader`,
    `<PortalShell requiredRole={['admin', 'superadmin']}>\n      <style>{\`
        @media (max-width: 768px) {
          .nmd-route-grid { grid-template-columns: 1fr !important; }
          .nmd-route-employees { flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; padding-bottom: 0.5rem !important; -webkit-overflow-scrolling: touch; }
          .nmd-route-emp-btn { flex-shrink: 0 !important; min-width: 150px !important; }
          .nmd-route-map-wrap { height: 240px !important; }
          .nmd-route-map-inner { height: 240px !important; }
        }
      \`}</style>\n      <SectionHeader`,
    'style tag'
  ],
  // 2. Grid: single column on mobile
  [
    `<div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>`,
    `<div className="nmd-route-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>`,
    'grid className'
  ],
  // 3. Employee list: horizontal scroll on mobile
  [
    `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>\n            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 2 }}>Employees</div>`,
    `<div className="nmd-route-employees" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>\n            <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 2 }}>Employees</div>`,
    'employee list className'
  ],
  // 4. Employee buttons: don't shrink on mobile
  [
    `<button key={emp.id} onClick={() => selectEmployee(emp)}`,
    `<button key={emp.id} className="nmd-route-emp-btn" onClick={() => selectEmployee(emp)}`,
    'employee button className'
  ],
  // 5. Map wrapper: shorter on mobile
  [
    `<div style={{ position: 'relative', height: 420, width: '100%' }}>`,
    `<div className="nmd-route-map-wrap" style={{ position: 'relative', height: 420, width: '100%' }}>`,
    'map wrapper className'
  ],
  // 6. Map inner div: shorter on mobile
  [
    `<div ref={mapDivRef} style={{ height: 420, width: '100%', borderRadius: '0 0 9px 9px' }} />`,
    `<div ref={mapDivRef} className="nmd-route-map-inner" style={{ height: 420, width: '100%', borderRadius: '0 0 9px 9px' }} />`,
    'map inner className'
  ],
]

let allOk = true
for (const [old, replacement, name] of patches) {
  if (!w.includes(old)) {
    console.error(`ERROR: patch target not found — "${name}"`)
    allOk = false
  } else {
    w = w.replace(old, replacement)
    console.log(`✓ ${name}`)
  }
}

if (!allOk) process.exit(1)

const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(path.join(ROOT, 'frontend-next/src/app/routes/page.tsx'), final, 'utf8')
console.log('routes/page.tsx patched — mobile responsive')
