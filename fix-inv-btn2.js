const fs = require('fs')
const f = 'frontend-next/src/app/invoices/page.tsx'
let c = fs.readFileSync(f, 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n')

const OLD = '              {linkError?.id === inv.id && (\n                <div style={{ fontSize: \'0.7rem\', color: \'#B91C1C\' }}>{linkError.message}</div>\n              )}\n            </div>'

const NEW = '              {linkError?.id === inv.id && (\n                <div style={{ fontSize: \'0.7rem\', color: \'#B91C1C\' }}>{linkError.message}</div>\n              )}\n              <button onClick={() => handleDelete(inv)} disabled={deletingId === inv.id} style={{ padding: \'0.3rem 0.65rem\', borderRadius: 6, border: \'none\', background: \'#FEF2F2\', color: \'#B91C1C\', fontWeight: 600, fontSize: \'0.75rem\', cursor: \'pointer\', fontFamily: \'DM Sans, sans-serif\', marginTop: 4 }}>{deletingId === inv.id ? \'Deleting...\' : \'Delete\'}</button>\n            </div>'

if (!w.includes(OLD)) { console.error('MISS'); process.exit(1) }
w = w.replace(OLD, NEW)
const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(f, final, 'utf8')
console.log('Done:', w.includes('handleDelete(inv)'))
