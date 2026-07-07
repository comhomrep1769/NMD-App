const fs = require('fs')

// Fix Requests - replace Del text with trash icon
const rf = 'frontend-next/src/app/requests/page.tsx'
let rc = fs.readFileSync(rf, 'utf8')
rc = rc.replace(
  /\{deletingReqId === r\.id \? '\.\.\.' : 'Del'\}/g,
  '{deletingReqId === r.id ? "..." : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>}'
)
rc = rc.replace(
  /padding: '0\.25rem 0\.5rem', borderRadius: 5, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0\.7rem', cursor: 'pointer'/g,
  "padding: '0.35rem', borderRadius: 6, border: '1px solid #FECACA', background: 'white', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center'"
)
fs.writeFileSync(rf, rc, 'utf8')
console.log('Requests fixed')

// Fix Schedule - replace ... text with trash icon
const sf = 'frontend-next/src/app/schedule/page.tsx'
let sc = fs.readFileSync(sf, 'utf8')
sc = sc.replace(
  /\{deletingJobId === j\.id \? "\.\.\.?" : "Delete"\}/g,
  '{deletingJobId === j.id ? "..." : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>}'
)
sc = sc.replace(
  /padding: "0\.25rem 0\.55rem", borderRadius: 5, border: "none", background: "#FEF2F2", color: "#B91C1C", fontWeight: 600, fontSize: "0\.7rem", cursor: "pointer", marginLeft: 6/g,
  'padding: "0.35rem", borderRadius: 6, border: "1px solid #FECACA", background: "white", color: "#DC2626", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: 6'
)
fs.writeFileSync(sf, sc, 'utf8')
console.log('Schedule fixed')

// Fix Invoices too
const inf = 'frontend-next/src/app/invoices/page.tsx'
let ic = fs.readFileSync(inf, 'utf8')
ic = ic.replace(
  /\{deletingId === inv\.id \? 'Deleting\.\.\.' : 'Delete'\}/g,
  '{deletingId === inv.id ? "..." : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>}'
)
ic = ic.replace(
  /padding: '0\.3rem 0\.65rem', borderRadius: 6, border: 'none', background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, fontSize: '0\.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginTop: 4/g,
  "padding: '0.35rem', borderRadius: 6, border: '1px solid #FECACA', background: 'white', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', marginTop: 4"
)
fs.writeFileSync(inf, ic, 'utf8')
console.log('Invoices fixed')

console.log('All done')
